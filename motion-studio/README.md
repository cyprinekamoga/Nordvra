# Motion studio

Launch videos, product ads and showreels made entirely in code, following
"How to Build a Motion Design Studio With Opus 5.5". Claude writes a page whose `window.seek(t)`
paints frame `t`. `render.mjs` screenshots every frame in headless Chromium and ffmpeg encodes
the MP4, so every render comes out identical.

The studio is separate from the Next.js app. It reuses the repo's Playwright install and has no
build step.

## Setup

```bash
npm install                          # repo root, brings in Playwright
pip install numpy librosa soundfile  # for beats.py
# ffmpeg must be on PATH (brew install ffmpeg / apt install ffmpeg)
```

Use Claude Code with `/model` set to xhigh effort for new videos (medium for small fixes and
re-renders, max when the first 3 seconds carry a big launch).

## Usage

One sentence: `/motion-reel for [URL], 20s, vertical, reference ./refs/frame.png`

| File | What it is |
|---|---|
| `CLAUDE.md` | House rules: render contract, banned looks, sound, critique loop |
| `render.mjs` | `node render.mjs --fps 60 --dur 15 --sub 4 [--w 1080 --h 1920] [--page index.html] [--out out/silent.mp4] [--start 0]` |
| `lib/motion.js` | Closed-form springs: `spring(t)` and `track(t, keys)` |
| `beats.py` | `python beats.py song.wav > beats.json`: BPM, beats, downbeats, hits |
| `review.sh` | `./review.sh out/final.mp4 4.2`: contact sheet, glitch strip, phone test, loop check |
| `mux.sh` | `./mux.sh out/silent.mp4 out/score_raw.wav out/final.mp4`: mix to −14 LUFS and add the sound |
| `audio/score.py` | The current film's music and sound effects, synthesized in code |
| `index.html`, `docs/` | The current film ("Alla fyra" RUT ad), its shot list, style guide and storyboards |
| `assets/` | Logo, Figtree (OFL), live UI captures and CC0 photos (`assets/photos/CREDITS.md`) |
| `prompts/` | The guide's prompts: setup test, launch video, reference, state list, springs, sound, critique, director's brief |

`--sub 4` renders 4 sub-steps per frame and blends them for real motion blur. Outputs go to `out/`
(git-ignored). Put API keys such as `ELEVENLABS_API_KEY` in `motion-studio/.env` (git-ignored),
never in a prompt.

The guide's optional framework skills are installed too: Remotion (`remotion-*`) and HyperFrames
(`hyperframes*` and friends) in `.claude/skills/`, pinned in `skills-lock.json`. Update them with
`npx skills update`. HyperFrames' `media-use` scripts send coarse usage telemetry unless
`DO_NOT_TRACK=1` is set.

## When things go wrong

- **It looks like every other AI video.** The `CLAUDE.md` banned list isn't loaded, or there's no
  reference. Give it a frame or video you love.
- **The motion feels cheap or floaty.** Refactor to springs (`prompts/05-springs.md`) and check the
  effort is xhigh.
- **Text is blurry when it scales up.** Render at full size and avoid scaling text up from small.
  Check `out/strip.png` at that moment.
- **The render changes every time.** Something uses `Math.random` or a live timer.
- **Fonts are wrong in the render.** `render.mjs` waits for `document.fonts.ready`, so check that
  the fonts actually load (put font files in `assets/`).
- **The music and visuals drift apart.** Re-run `beats.py` on the exact final track and re-time the
  cuts to `beats.json`.
- **The first try was mid.** That's normal. Run the critique loop 3 times before judging it.
