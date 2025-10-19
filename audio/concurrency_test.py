import asyncio
import time
from typing import Tuple, List

import httpx

# Fixed parameters
URL = "http://127.0.0.1:8000/transcribe"
AUDIO_PATH = "audio.wav"  # The audio file located in the same directory
TOTAL_REQUESTS = 6        # total number of requests to send
CONCURRENCY = 6            # max concurrent requests
TIMEOUT = 600.0            # seconds, allow long processing


async def post_once(client: httpx.AsyncClient, payload: bytes, idx: int) -> Tuple[int, float, str]:
    """Send one POST request, return (status_code, duration_ms, text_or_error)."""
    start = time.perf_counter()
    try:
        files = {"file": ("audio.wav", payload, "audio/wav")}
        resp = await client.post(URL, files=files, timeout=TIMEOUT)
        duration = (time.perf_counter() - start) * 1000
        if resp.status_code == 200:
            data = resp.json()
            text = data.get("text", "")
            return resp.status_code, duration, text
        else:
            return resp.status_code, duration, f"error: {resp.text}"
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000
        return 0, duration, f"exception: {e}"


async def worker(name: str, sem: asyncio.Semaphore, client: httpx.AsyncClient, payload: bytes, idx: int):
    async with sem:
        code, ms, text = await post_once(client, payload, idx)
        preview = (text or "").replace("\n", " ")
        if len(preview) > 80:
            preview = preview[:80] + "..."
        print(f"[task {idx:02d}] status={code} time={ms:.2f} ms text={preview}")
        return code, ms, text


async def run():
    # Load audio once to reduce disk contention
    try:
        with open(AUDIO_PATH, "rb") as f:
            payload = f.read()
    except FileNotFoundError:
        print(f"Audio file not found: {AUDIO_PATH}")
        return

    limits = httpx.Limits(max_keepalive_connections=CONCURRENCY, max_connections=CONCURRENCY)
    async with httpx.AsyncClient(limits=limits) as client:
        sem = asyncio.Semaphore(CONCURRENCY)
        tasks = [asyncio.create_task(worker("w", sem, client, payload, i)) for i in range(1, TOTAL_REQUESTS + 1)]
        start = time.perf_counter()
        results: List[Tuple[int, float, str]] = await asyncio.gather(*tasks)
        total_ms = (time.perf_counter() - start) * 1000

    ok = sum(1 for code, _, _ in results if code == 200)
    fail = len(results) - ok
    avg_ms = sum(ms for _, ms, _ in results) / len(results) if results else 0.0
    p95 = 0.0
    if results:
        sorted_ms = sorted(ms for _, ms, _ in results)
        p95 = sorted_ms[int(0.95 * (len(sorted_ms) - 1))]

    print("\n===== Summary =====")
    print(f"URL           : {URL}")
    print(f"Requests      : {len(results)} (ok={ok}, fail={fail})")
    print(f"Concurrency   : {CONCURRENCY}")
    print(f"Total elapsed : {total_ms:.2f} ms")
    print(f"Avg per req   : {avg_ms:.2f} ms")
    print(f"p95 per req   : {p95:.2f} ms")


if __name__ == "__main__":
    asyncio.run(run())
