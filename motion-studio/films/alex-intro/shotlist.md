# "Meet Alex" – introduction ad for *Alex's Luganda Journey*

20 s, 120 BPM (beat 0.5 s), 9:16 for Reels and Stories, 4:5 for the feed, English and Swedish
(`index.html?lang=sv`). An introduction, not a sales ad: no price, no "buy now". It introduces the
character, teaches three real phrases from the book and shows real pages, so people learn something
in the first five seconds and remember the book.

Look: the shop page's palette (yellow, navy, purple, blue, red), Fredoka (OFL), the book's own
illustrations and pages. Each scene is a colour band that rises over the last one.

## Beat sheet

| Time | Band | On screen | Sound |
|---|---|---|---|
| 0.0–3.0 | Yellow | **"Meet Alex."** "He's flying from Sweden to Uganda, and learning Luganda on the way." A red plane flies a dotted arc from a Swedish flag to a Ugandan flag. Alex at the plane window (book art). | Shaker and a rising marimba call, an airy plane pass |
| 3.0–5.5 | Purple | "Greeting Jjaja" · Alex greets Jjaja on the porch (book art) · bubble **Oli otya?** → *How are you?* · step dot 1 of 3 | Hand drums start; pop, three bright notes on the phrase, a low answer on the meaning |
| 5.5–8.0 | Blue | "At the market" · Alex with mangoes at the market · **Mmeka zino?** → *How much are these?* · 2 of 3 | Same pattern, higher |
| 8.0–10.5 | Red | "Saying thank you" · the farewell party · **Weebale nnyo!** → *Thank you very much!* · 3 of 3 | Same pattern, highest |
| 10.5–15.0 | Light grey | **"Learn with Alex."** Real pages dealt onto a stack, one per second: dialogue page → *Dialogues*, body parts → *Words & phrases*, food from Buganda → *Culture & stories*, market worksheet → *Exercises* | A paper flick and a drum on each page |
| 15.0–20.0 | Yellow | The cover lands. **Learn. Speak. Discover.** on the beats. Navy button *Follow Alex's journey →*, line *A children's book for learning Luganda* | Drum hit, open chord, three rising notes, resolves on C |

## Luganda on screen (all from the book, spelled as there)

| Phrase | Meaning used in the ad | Where in the book |
|---|---|---|
| Oli otya? | How are you? / Hur mår du? | p. 6 dialogue ("Oli otya, mwana wange?"), p. 25 phrase page ("HUR MÅR DU? – OLI OTYA") |
| Mmeka zino? | How much are these? / Vad kostar de här? | Chapter 7 worksheet ("För att fråga om priset säger man …", answer box "Mmeka zino") |
| Weebale nnyo! | Thank you very much! / Tack så mycket! | p. 25 ("TACK SÅ MYCKET – WEEBALE NNYO"), chapter 7 worksheet ("'weebale nnyo' betyder …") |
| Jjaja | Grandmother (as in the book) | Chapter 4 "Okukyalila ku Jjaja" |

The book writes "Webale" in a couple of places and "Weebale" on the phrase page and worksheet; the
ad uses "Weebale nnyo", the spelling the exercises teach.

The scene labels ("Dialogues", "Words & phrases", "Culture & stories", "Exercises") come from the back
cover's "I boken får du" list.

## Assets
`assets/art/` and `assets/pages/p06, p31` come from the book's shop page; `assets/pages/body.png` and
`market-worksheet.png` are the pages supplied for this ad. All are the book's own content, used to
promote the book. Fonts: Fredoka, SIL Open Font License (`assets/fonts/OFL.txt`).

## Render
```bash
python3 films/alex-intro/score.py out/alex_score.wav
node render.mjs --fps 30 --dur 20 --sub 4 --w 1080 --h 1920 --page films/alex-intro/index.html --out out/alex_silent.mp4
./mux.sh out/alex_silent.mp4 out/alex_score.wav out/alex_intro_en_9x16.mp4
```
Swedish: `--page "films/alex-intro/index.html?lang=sv"`. Feed: `--w 1080 --h 1350`.

## Captions

**English**
> Meet Alex 👋 He's flying from Sweden to Uganda to meet his family, and learning Luganda on the way.
> Can you say these yet?
> Oli otya? – How are you?
> Mmeka zino? – How much are these?
> Weebale nnyo! – Thank you very much!
> Alex's Luganda Journey: stories, dialogues and exercises for children learning Luganda. 🇺🇬

Headline: *Learn Luganda with Alex* · Button: *Learn more*

**Svenska**
> Det här är Alex 👋 Han flyger från Sverige till Uganda för att träffa sin familj och lär sig luganda på vägen.
> Kan du redan de här?
> Oli otya? – Hur mår du?
> Mmeka zino? – Vad kostar de här?
> Weebale nnyo! – Tack så mycket!
> Alex's Luganda Journey: berättelser, dialoger och övningar för barn som lär sig luganda. 🇺🇬

Rubrik: *Lär dig luganda med Alex* · Knapp: *Läs mer*
