import whisper
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
import uvicorn
import os
import tempfile
from typing import Optional
import asyncio
import logging
import time
import uuid
import shutil
from pathlib import Path

# Global model per-process (each uvicorn worker will have its own copy)
_model: Optional[whisper.Whisper] = None

def get_model() -> whisper.Whisper:
    global _model
    if _model is None:
        model_name = "turbo"
        # Note: ensure ffmpeg is installed on the system for whisper to work.
        try:
            _model = whisper.load_model(model_name)
        except RuntimeError as e:
            # Handle corrupted/cancelled download cache by clearing and retrying once
            if "checksum" in str(e).lower():
                cache_dir = Path(os.getenv("WHISPER_CACHE_DIR", str(Path.home() / ".cache" / "whisper")))
                try:
                    shutil.rmtree(cache_dir, ignore_errors=True)
                    logger.warning("cleared whisper cache at %s due to checksum mismatch; retrying...", cache_dir)
                except Exception:
                    logger.exception("failed to clear whisper cache at %s", cache_dir)
                _model = whisper.load_model(model_name)
            else:
                raise
    return _model

def transcribe_file(path: str) -> str:
    model = get_model()
    result = model.transcribe(path)
    return result.get("text", "")

app = FastAPI(title="Audio Transcription Service", version="1.1.0")


# ---------- Logging Setup ----------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s pid=%(process)d rid=%(request_id)s %(name)s: %(message)s",
)

# Helper to inject request_id into log records
class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True

for _handler in logging.getLogger().handlers:
    _handler.addFilter(RequestIdFilter())

logger = logging.getLogger("audio.service")


# ---------- Middleware ----------
@app.middleware("http")
async def add_request_id_and_timing(request: Request, call_next):
    # Propagate X-Request-ID or generate a new one
    req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    start = time.perf_counter()

    # Attach request_id to this task's context for logging
    # We can't globally set it on logger, so add to record via filter
    def _with_request_id(record: logging.LogRecord):
        setattr(record, "request_id", req_id)
        return True

    request_filter = logging.Filter()
    request_filter.filter = _with_request_id  # type: ignore
    for h in logging.getLogger().handlers:
        h.addFilter(request_filter)

    try:
        response = await call_next(request)
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000
        logger.exception("Unhandled exception processing request", extra={"request_id": req_id})
        return JSONResponse(
            status_code=500,
            content={"detail": "internal_error", "request_id": req_id, "duration_ms": round(duration, 2)},
        )
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(
            "request completed: %s %s %s in %.2f ms",
            request.method,
            request.url.path,
            response.status_code if 'response' in locals() else '-',
            duration,
            extra={"request_id": req_id},
        )
        # Ensure header propagation
        if 'response' in locals():
            response.headers["X-Request-ID"] = req_id

    return response

@app.get("/")
def root():
    pid = os.getpid()
    return {"status": "ok", "pid": pid}

@app.get("/health")
def health():
    loaded = _model is not None
    return {"status": "ok", "model_loaded": loaded, "pid": os.getpid()}

@app.on_event("startup")
def on_startup():
    # Optional warmup
    if os.getenv("WARMUP_MODEL", "false").lower() in ("1", "true", "yes"):
        model_name = "turbo"
        logger.info("warming up model '%s'...", model_name)
        get_model()
        logger.info("model '%s' loaded", model_name)

@app.post("/transcribe")
async def transcribe_endpoint(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    filename = file.filename or "uploaded"
    suffix = os.path.splitext(filename)[1] or ".wav"
    content_type = file.content_type or ""
    # Optional size limit in MB
    max_mb = float(os.getenv("MAX_UPLOAD_MB", "100"))
    start = time.perf_counter()
    try:
        contents = await file.read()
        size_mb = len(contents) / (1024 * 1024)
        if size_mb > max_mb:
            raise HTTPException(status_code=413, detail=f"File too large: {size_mb:.2f}MB > {max_mb:.2f}MB")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        # Offload the CPU-bound task so the event loop stays responsive.
        # For true CPU parallelism, run uvicorn with multiple workers.
        logger.info(
            "start transcribe: file=%s size=%.2fMB ctype=%s tmp=%s",
            filename,
            size_mb,
            content_type,
            tmp_path,
        )
        text = await asyncio.get_event_loop().run_in_executor(None, transcribe_file, tmp_path)
        duration = (time.perf_counter() - start) * 1000
        logger.info("done transcribe in %.2f ms, chars=%d", duration, len(text))
        return JSONResponse({"text": text, "duration_ms": round(duration, 2)})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("transcription failed")
        raise HTTPException(status_code=500, detail="transcription_error")
    finally:
        try:
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            # Best-effort cleanup
            pass

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    # Multiple workers enable parallel CPU-bound processing
    workers = int(os.getenv("WORKERS", max(1, os.cpu_count() or 1)))
    uvicorn.run("main:app", host=host, port=port, workers=workers)