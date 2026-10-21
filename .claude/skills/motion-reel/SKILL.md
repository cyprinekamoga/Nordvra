---
name: motion-reel
description: Make a product or showreel motion video rendered from code. Use when the
  user asks for a launch video, showreel, product reel, animated explainer or motion ad.
  This is the default for motion video in this repo; use the Remotion or HyperFrames
  skills only when the user asks for one of those frameworks by name.
---

# Motion reel

Work in `motion-studio/` and run every command from there. Read `motion-studio/CLAUDE.md` first:
its render contract, banned looks and critique loop apply to every video. Prompt templates for each
step are in `motion-studio/prompts/`. Use xhigh effort for new videos, max when the first 3 seconds
have to carry a big launch.

## Inputs to collect first
Product + URL, duration, formats (9:16 / 1:1 / 16:9), brand colors + fonts,
a reference (frame, video, or image folder), music (file or "synthesize").

## Pipeline
1. Gather assets from the URL with Playwright into ./assets. List them.
2. If a reference exists, write docs/style_guide.md from it (prompts/03-reference.md).
3. Measure or synthesize music. beats.py → beats.json (prompts/06-sound.md).
4. Write docs/shotlist.md on the beat grid. Show it and wait for OK.
5. Build index.html with window.seek(t) using lib/motion.js springs. Follow CLAUDE.md.
6. Contact sheet → critique → fix. 3 rounds minimum (./review.sh, prompts/07-critique.md).
7. node render.mjs → sound → mix to -14 LUFS → out/final.mp4, all formats
   (`--w 1080 --h 1080` for 1:1, `--w 1920 --h 1080` for 16:9).
8. Deliver final.mp4, contact.png, poster.png. Say what you'd improve next.

## Hard rules
- Real product UI only. Never invent screens.
- No Math.random, no timers, no CSS transitions in render mode.
- Banned: corner labels, centered title on gradient, everything fading in.
- API keys live in motion-studio/.env (git-ignored). Never put a key in a prompt or a file you commit.
