# Walkthrough videos — log

## 21-Oct-2026
- Pipeline `make_video.mjs`, audio-led: Kokoro-82M (kokoro-js, ONNX q8, CPU, voice af_heart, speed 1.0) → per-beat WAV cached by text hash; Playwright 1.64 headless native recordVideo 1440×900; beat start times measured, each WAV placed at its start (+0.35 s); loudnorm −16 LUFS.
- Storylines: `o2c.story.mjs` (12 beats, ~4:23) and `sc.story.mjs` (12 beats, ~4:48). Written for a financial controller; numbers quoted are the 09:10 demo before any decision.
- Why 0.27 s: Playwright starts recording ~0.27 s after page creation; the video is trimmed to beat 1 minus that lag.
- SC beat 8 takes SC-GIT-06 on camera (Take → Confirm). It runs in a throwaway browser context, so the demo state is not changed.
- O2C beat 8 opens and closes the drawer without deciding, so later quoted numbers stay true.
- Fixes after the first pass: SC Take needs a Confirm click. O2C beat 6's second drill lands on status, not customer, so the copy says "open versus disputed". Segment/class chips are held about 5–7 s so the picture matches the narration.
- Rebuild: `cd video_resources && npm i && node make_video.mjs sc.story.mjs` (add `--only-audio` to regenerate narration only). Server must run on :8765.
