import whisper
import time

start_transcribe = time.time()
model = whisper.load_model("turbo")
result = model.transcribe("audio.wav")
end_transcribe = time.time()
print(f"音频转录时间: {end_transcribe - start_transcribe:.2f} 秒")

with open("result.txt", "w", encoding="utf-8") as f:
    f.write(result["text"])