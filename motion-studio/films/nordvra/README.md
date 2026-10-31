# Nordvra ads – seven films and a filming kit

Swedish, 9:16 (Reels/Stories) and 4:5 (feed), 10–21 s, original synthesized sound mixed to −14 LUFS.
Shared look and helpers in `lib.js` (live site palette, Figtree, logo, price cards, colour-band
scenes, end card); sound in `score.py`. Prices are screenshots of the live site's price step
(captured 31 Oct 2026, `assets/cards/`); phone number 072-222 88 00.

Render one film:
```bash
python3 films/nordvra/score.py tak out/n_score_tak.wav
node render.mjs --fps 30 --dur 15 --sub 4 --page films/nordvra/tak/index.html --out out/silent.mp4
./mux.sh out/silent.mp4 out/n_score_tak.wav out/nordvra_tak_9x16.mp4
```
Feed: `--w 1080 --h 1350`. Snow with a town: `--page "films/nordvra/sno/index.html?town=Sundsvall"`.

House rules kept in every film: price before and after the deduction with "vanligtvis", RUT 50 %
and ROT 30 % on the labour cost (never "halva priset"), "Avdraget förutsätter att du har rätt till
det", no "kryphål", no fake reviews.

## The films

| # | Folder | Length | Run when | Audience |
|---|---|---|---|---|
| 1 | `tak/` "Har du använt ditt avdrag för 2026?" | 15 s | Mid Nov – 31 Dec | Everyone 25+, homeowners for ROT |
| 2 | `sno/` "Snön kommer." | 12 s | When SMHI forecasts snow, in that region | House owners, Norrland first |
| 3 | `jul/` "Städat före jul?" | 15 s | 1–20 Dec | 30+, families |
| 4 | `ring/` "Krångligt med formulär?" | 12 s | Always on | 65+ on Facebook |
| 5 | `myter/` "Sant eller falskt?" | 21 s | Always on | Broad, cold audiences |
| 7 | `rekord/` "Rekordår för RUT" | 12 s | Always on | Broad, 45+ |
| 8 | `vantar/` "Du var nästan klar." | 10 s | Always on | Retargeting only: visited /boka, did not send (needs the Meta pixel) |

### Facts and sources
| Claim on screen | Source |
|---|---|
| 75 000 kr per person and year for RUT and ROT | Skatteverket, "Så fungerar rutavdraget": "högst 75 000 kronor per år i rotavdrag och rutavdrag" |
| The payment date decides the year (paying before New Year counts for 2026) | Skatteverket: "Det är datumet som du betalar för arbetet som styr vilket beskattningsår rutavdraget hamnar på" |
| "Har du redan använt RUT/ROT i år?" + the Mina sidor link | The site's own step 6 |
| The company makes the deduction on the invoice | Skatteverket: "Företaget du anlitar ska göra avdraget på fakturan" |
| RUT covers snow clearing, garden, moving help, IT help | Skatteverket's list of rutarbeten |
| Only the labour cost gives a deduction | Skatteverket / site copy |
| RUT in your parents' home, if you paid | Skatteverket: "om det är du som har haft utgiften för tjänsten" |
| 8,87 miljarder kr in RUT deductions 2025, a new record | Almega, Rutindikatorn 2025 (28 Jan 2026): "Under 2025 gjordes rut-avdrag för 8,87 miljarder kronor (avrundat)" |
| 41,2 % of RUT purchases 2025 by people over 65 | Almega: "Personer över 65 år står för 41,2 procent av alla rut köp 2025" |
| Snöskottning 290–400 kr/h, takskottning 375–500 kr/h, storstädning 60–79 m² 2 300–3 300 kr, flyttstädning 60–79 m² 2 300–3 600 kr (after RUT) | Live site, 31 Oct 2026. Re-capture if prices change |
| "Vi svarar på dina frågor och fyller i förfrågan åt dig", "Förfrågan är gratis och inte bindande", "Du får en offert som du godkänner innan något bokas", "Vi hittar ett bra företag …" | Site copy |

## Captions (Ads Manager)

**1 Tak** · Primärtext: "Har du RUT- eller ROT-avdrag kvar för 2026? Det är betaldatumet som avgör vilket år avdraget hamnar på. Kolla vad du har kvar på Skatteverkets Mina sidor – och få ditt pris från oss inom 24 timmar. Ingen bokningsavgift." · Rubrik: "Använd ditt avdrag för 2026" · Knapp: Få offert

**2 Snö** · "Snön är på väg. Vi bokar snöskottning och takskottning åt dig – vanligtvis 290–400 kr/timme efter RUT-avdrag. Exakt pris inom 24 timmar." · Rubrik: "Boka snöskottning" · Knapp: Få offert

**3 Jul** · "Städat hem till jul? Storstädning 60–79 m² kostar vanligtvis 2 300–3 300 kr efter RUT-avdrag. Vi hittar ett bra företag och skickar en offert inom 24 timmar." · Rubrik: "Boka julstädningen i tid" · Knapp: Få offert

**4 Ring** · "Du behöver inte klicka runt. Ring oss på 072-222 88 00 – vi svarar på dina frågor och fyller i förfrågan åt dig. Städning och hantverkare med RUT- och ROT-avdrag i hela Sverige." · Rubrik: "Ring oss – vi fixar resten" · Knapp: Ring nu

**5 Myter** · "Sant eller falskt? Fyra saker många tror om RUT-avdraget 👀 Hos Nordvra ser du priset efter avdrag direkt – och vi sköter avdraget på fakturan." · Rubrik: "Se ditt pris efter avdrag" · Knapp: Få offert

**7 Rekord** · "2025 gjordes rut-avdrag för 8,87 miljarder kronor – ett nytt rekord (Almega). Har du kollat vad du kan få? Se ditt ungefärliga pris efter avdrag på två minuter." · Rubrik: "Se vad du kan få" · Knapp: Få offert

**8 Väntar** · "Du var nästan klar! Förfrågan är gratis och inte bindande – du godkänner offerten innan något bokas." · Rubrik: "Fortsätt din förfrågan" · Knapp: Läs mer

## 6 "Vi ringer runt – du slipper" (filming kit)

You on camera, phone vertical, 15 s, natural light, no script reading: say it in your own words.

| Time | Shot | You say (example) | On-screen text we add |
|---|---|---|---|
| 0–2 s | Close-up, you at a table with a phone and a list of firms | "Jag ringer runt så att du slipper." | **Vi jämför åt dig** |
| 2–6 s | Over the shoulder: ticking names off the list, phone to ear | "Jag hittar ett bra företag som kan när du vill." | **Ett pris. Ett företag.** |
| 6–10 s | Back to camera | "Du får priset efter avdrag, inom 24 timmar." | **Exakt pris inom 24 timmar** |
| 10–15 s | Phone screen showing nordvra.se/boka | "Det tar två minuter. Ingen bokningsavgift." | End card: logo, "Gör en förfrågan – 2 minuter", chips |

Film it on a phone in 1080×1920, send the clip, and it gets captions, the end card and the same sound.
Only show real things: your real list, your real phone, real firms blurred if they can be read.
