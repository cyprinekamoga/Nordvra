# Indicative prices and where they come from

The ranges in `lib/catalog/seed.ts` (and `supabase/seed.sql`, generated from it) follow what
Swedish firms charge. They were checked in October 2026 against about 60 published price lists
and price guides. Each range is roughly the middle half of the market (25th–75th percentile), so
cheap local firms and premium chains both fit. Recheck them about once a year; the admin can also
edit them in the database.

**Where the live prices are read from:** the site reads the catalogue from the Supabase database
(tables `price_ranges` and `service_addons`); `lib/catalog/seed.ts` is only the fallback and the
source for `supabase/seed.sql`. After changing prices in the seed, run `npm run db:seed:generate`
and apply `supabase/seed.sql` to the database (it upserts and never deletes), or edit the prices in
admin. The October 2026 prices were applied to the live database on 18 October 2026.

RUT prices are shown **after** the 50 % RUT deduction; ROT prices **before** the 30 % ROT
deduction, labour only, incl. moms. Material, framkörning and vehicles never give a deduction.

## Cleaning (after RUT)

| Size | Flyttstädning | Storstädning | Hemstädning, per visit (every other week) |
| --- | --- | --- | --- |
| 0–39 m² | 1 700–2 100 kr | 1 800–2 300 kr | 600–900 kr |
| 40–59 m² | 1 900–2 800 kr | 1 900–2 400 kr | 850–1 000 kr |
| 60–79 m² | 2 300–3 600 kr | 2 300–3 300 kr | 900–1 200 kr |
| 80–99 m² | 2 700–4 500 kr | 2 700–3 800 kr | 950–1 400 kr |
| 100–129 m² | 3 100–5 300 kr | 3 100–4 700 kr | 1 100–1 700 kr |
| 130–159 m² | 3 500–5 600 kr | 3 600–5 200 kr | 1 300–1 900 kr |
| 160+ m² | 4 000–6 400 kr | 3 900–5 500 kr | 1 500–2 200 kr |

* Hemstädning by the hour: about 250–320 kr; weekly is a little cheaper, monthly a little dearer.
* Fönsterputs: 60–95 kr per 4-sided window, spröjs about +30 kr, minimum 650–950 kr per visit.
* Flyttstäd extras: balkong 150–300, inglasad balkong 300–500, förråd 200–300 kr.
* Storstäd extras: ugn 250–500, kyl/frys 200–300, fönsterputs 400–700 kr.
* Homepage example: Flyttstäd 60 m², 5 600 kr before → 2 800 kr after RUT.

Sources: Freska (freska.se), Strykfritt (strykfritt.se), Miljöklar (miljoklar.se), GlansRent
(glansrent.se), Nytta, Flyttstädning08, Julias Städservice (renthusstockholm.se), Brillex
(brillex.se), Klarafy (klarafy.se), Qleanex (qleanex.se), Städmyran i väst (stadmyranvast.se),
Flyttstädning i Göteborg, Flyttstädning Norrköping, Karlstad flyttstädning, Hello Clean
(helloclean.se), Städhjälp Göteborg, Malmö Maids, TimeOut Service (timeoutservice.se); Compify and
Hurbra averages as a cross-check.

## Moving and other RUT services (after RUT)

| Service | Range |
| --- | --- |
| Bära, lasta och lossa | 300–420 kr per person och timme (2 flyttare + lastbil: usually 500–800 kr/h) |
| Packning och uppackning | 300–420 kr per person och timme |
| Möbelmontering, upphängning | 400–500 kr per person och timme |
| Transport till second hand | 1 200–3 200 kr before deduction (deduction 25 % of the total) |
| Gräsklippning, häck, ogräs, krattning | 250–380 kr/h |
| Beskärning | 300–450 kr/h |
| Trädfällning | 400–700 kr/h |
| Stubbfräsning | 1 100–1 600 kr for the first stump, 350–550 kr per extra stump |
| Snöskottning / takskottning | 290–400 / 375–500 kr per person och timme |
| IT-hjälp | 400–700 kr/h |
| Reparation av vitvaror | 700–800 kr/h |
| Barnpassning / personlig omsorg | 180–250 / 250–350 kr/h |
| Tillsyn av bostaden | 200–350 kr per besök |
| Tvätt och strykning | 250–330 kr/h |

Sources: Pipers, Rent A Mover, Flexflytt, Nacka Flytt & Transport, Ekofox, Fixkalle, Limpio,
Miljöklar, Vasa Flytt, Lågprisflytt, Östra Aros, Jönköpings Flyttbud, Nordflytt, Nufix,
Stockholms Handyman, Skräphämtarna, Garden Oasis, Kröns Trädgård, Trädgårdsproffs, Veteranpoolen,
Stubbfräskompaniet, Arborister.se, Hjälper.se, Datorhjälp i Stockholm, FixarData, Elgiganten
Hemtekniker, ED Service, Nanny.nu, Barnvakt i Stockholm, Barnvakten Göteborg, Seniorglädje,
Silverkanten, Botrygg; Offerta's 2026 guides as a cross-check.

## ROT services (before ROT, labour)

| Service | Range |
| --- | --- |
| Målning inomhus | 160–300 kr per m² vägg (tak about +10 %) |
| Tapetsering | 250–450 kr per m² vägg |
| Fasadmålning | 200–450 kr per m² fasad (+ ställning on houses over one floor) |
| Målare per timme (dörrar, köksluckor) | 600–750 kr/h |
| Snickare | 650–800 kr/h |
| Plattsättare | 700–850 kr/h (650–1 100 kr per m²) |
| Badrumsrenovering | 700–900 kr/h; a whole 4–5 m² bathroom 140 000–220 000 kr incl. material |
| Elektriker | 750–950 kr/h |
| Rörmokare / VVS | 800–950 kr/h |

Sources: Byggahus' 2026 hourly-rate surveys (39 firms in 13 cities: snickare mean 707,
elektriker 835, rörmokare 851, plattsättare 758 kr/h), NLL Måleri, Hemfixarna, Offerta/KBO Grupp,
Bygghantverkarna, GMS Måleri, Nobelius Måleri, JK Snickare, BraByggare, Elkontakten, FRESAB,
Jourpartner, Täby VVS, Rörfiness, Nordgren & Partners VVS, Boio.

## Known gaps

* No range yet (the partner quotes): tak, plåt, fönsterbyte, fasadtvätt, murning, mark och
  dränering, rengöring av ventilation och avlopp, byggstädning.
* Wall-mounted laddbox: listed under El with ROT, as decided by the owner (October 2026).
* Thin data (few published prices): transport to second hand, tillsyn, strykning, the 160+ m²
  cleaning bands and tapetsering.
