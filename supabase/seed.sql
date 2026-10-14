-- Nordvra – seed data. GENERATED FILE, do not edit by hand.
-- Source: lib/catalog/seed.ts. Regenerate with: npm run db:seed:generate
--
-- Idempotent: re-running resets catalogue rows (categories, services, add-ons, price ranges)
-- to the seed values, and never deletes anything. The admin user and the settings row are
-- only inserted when missing.

-- categories
insert into public.categories (id, name, icon, deduction_type, sort, active) values
  ('stadning', 'Städning', 'sparkles', 'rut'::public.deduction_type, 10, true),
  ('flytt', 'Flytt', 'truck', 'rut'::public.deduction_type, 20, true),
  ('fonsterputs', 'Fönsterputs', 'window', 'rut'::public.deduction_type, 30, true),
  ('tradgard', 'Trädgård & snö', 'tree', 'rut'::public.deduction_type, 40, true),
  ('hem-it', 'Hem-IT & vitvaror', 'wifi', 'rut'::public.deduction_type, 50, true),
  ('omsorg', 'Barn- & omsorg', 'heart', 'rut'::public.deduction_type, 60, true),
  ('maleri', 'Måla & tapetsera', 'paint', 'rot'::public.deduction_type, 70, true),
  ('badrum-kok', 'Badrum & kök', 'bath', 'rot'::public.deduction_type, 80, true),
  ('snickeri', 'Snickeri', 'hammer', 'rot'::public.deduction_type, 90, true),
  ('el', 'El', 'zap', 'rot'::public.deduction_type, 100, true),
  ('vvs', 'VVS & värmepump', 'droplet', 'rot'::public.deduction_type, 110, true),
  ('tak-fasad', 'Tak, fasad & fönster', 'house', 'rot'::public.deduction_type, 120, true),
  ('mark', 'Mark & dränering', 'shovel', 'rot'::public.deduction_type, 130, true)
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  deduction_type = excluded.deduction_type,
  sort = excluded.sort,
  active = excluded.active;

-- services 1/3
insert into public.services (id, category_id, extra_category_ids, name, description, deduction_type, model, rot_kind, pricing_unit, labour_share_of_total, form_kind, ask_home_details, uses_size_band, skv_work_type, warning_ids, sort, active) values
  ('hemstadning', 'stadning', '{}'::text[], 'Hemstädning', 'Löpande städning varje eller varannan vecka – eller en gång.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'visit'::public.pricing_unit, null, 'hemstad'::public.form_kind, true, true, 'Städning', array['rut-gemensamma-utrymmen', 'rut-hemstajling']::text[], 10, true),
  ('storstadning', 'stadning', '{}'::text[], 'Storstädning', 'Grundlig städning av hela bostaden, inklusive svåra ställen.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'job'::public.pricing_unit, null, 'storstad'::public.form_kind, true, true, 'Städning', array['rut-gemensamma-utrymmen']::text[], 20, true),
  ('flyttstadning', 'stadning', '{}'::text[], 'Flyttstädning', 'Städning när du flyttar, med garanti inför besiktningen.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'job'::public.pricing_unit, null, 'flyttstad'::public.form_kind, true, true, 'Städning', array['rut-byggstadning', 'rut-gemensamma-utrymmen']::text[], 30, true),
  ('tvatt-strykning', 'stadning', '{}'::text[], 'Tvätt och strykning i hemmet', 'Tvätt, strykning och mangling hemma hos dig.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Kläd- och textilvård', '{}'::text[], 40, true),
  ('fonsterputs', 'fonsterputs', array['stadning']::text[], 'Fönsterputs', 'Puts av fönster in- och utvändigt.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'window'::public.pricing_unit, null, 'fonster'::public.form_kind, true, false, 'Städning', '{}'::text[], 10, true),
  ('packning', 'flytt', '{}'::text[], 'Packning och uppackning', 'Vi packar ner och packar upp dina saker.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Flyttjänster', array['rut-flyttbil', 'rut-tippen']::text[], 10, true),
  ('bara-lasta', 'flytt', '{}'::text[], 'Bära, lasta och lossa', 'Bärhjälp vid flytt – lastning och lossning.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Flyttjänster', array['rut-flyttbil', 'rut-tippen']::text[], 20, true),
  ('mobelmontering', 'flytt', '{}'::text[], 'Montering och demontering av möbler', 'Vi tar isär och sätter ihop möbler vid flytten.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Flyttjänster', array['rut-mobelreparation']::text[], 30, true),
  ('upphangning', 'flytt', '{}'::text[], 'Upphängning av tavlor och lampor vid flytt', 'Vi hänger upp tavlor, hyllor och lampor i nya hemmet.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Möblering', '{}'::text[], 40, true),
  ('secondhand-transport', 'flytt', '{}'::text[], 'Transport till second hand eller auktion', 'Vi kör bohag till försäljning. Avdraget räknas på halva priset.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'job'::public.pricing_unit, 0.5, 'standard'::public.form_kind, false, false, 'Transport till försäljning', array['rut-tippen']::text[], 50, true),
  ('grasklippning', 'tradgard', '{}'::text[], 'Gräsklippning', 'Klippning av gräsmatta på din tomt.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Trädgårdsarbete', array['rut-robot']::text[], 10, true),
  ('hackklippning', 'tradgard', '{}'::text[], 'Häckklippning', 'Klippning och formning av häckar.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Trädgårdsarbete', array['rut-tippen']::text[], 20, true),
  ('ograsrensning', 'tradgard', '{}'::text[], 'Ogräsrensning', 'Rensning av rabatter och gångar.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Trädgårdsarbete', '{}'::text[], 30, true),
  ('krattning', 'tradgard', '{}'::text[], 'Krattning', 'Krattning av löv och gräs.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Trädgårdsarbete', array['rut-tippen']::text[], 40, true),
  ('beskarning', 'tradgard', '{}'::text[], 'Beskärning', 'Beskärning av träd och buskar.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Trädgårdsarbete', '{}'::text[], 50, true),
  ('tradfallning', 'tradgard', '{}'::text[], 'Trädfällning på tomten', 'Fällning av träd på din tomt.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Trädgårdsarbete', array['rut-tippen']::text[], 60, true),
  ('stubbfrasning', 'tradgard', '{}'::text[], 'Stubbfräsning', 'Fräsning av stubbar på tomten.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Trädgårdsarbete', '{}'::text[], 70, true),
  ('snoskottning', 'tradgard', '{}'::text[], 'Snöskottning', 'Skottning av uppfart och gångar vid bostaden.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Snöskottning', '{}'::text[], 80, true),
  ('takskottning', 'tradgard', '{}'::text[], 'Takskottning', 'Skottning av snö från taket.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Snöskottning', '{}'::text[], 90, true),
  ('it-installation', 'hem-it', '{}'::text[], 'Installation av dator, router, wifi och TV', 'Vi installerar och kopplar in utrustningen hemma hos dig.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'IT-tjänster', array['rut-fjarrsupport', 'rut-larm-robot']::text[], 10, true),
  ('it-felsokning', 'hem-it', '{}'::text[], 'Felsökning och reparation på plats', 'Hjälp med dator, nätverk och TV när något krånglar.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'IT-tjänster', array['rut-fjarrsupport']::text[], 20, true),
  ('vitvaror-reparation', 'hem-it', '{}'::text[], 'Reparation av vitvaror', 'Tvättmaskin, torktumlare, diskmaskin, kyl, frys, ugn, spis eller köksfläkt.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'vitvaror'::public.form_kind, false, false, 'Reparation av vitvaror', array['rut-vitvaror-installation']::text[], 30, true),
  ('barnpassning', 'omsorg', '{}'::text[], 'Barnpassning', 'Barnpassning i hemmet för barn upp till årskurs 7.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Barnpassning', array['rut-djurpassning']::text[], 10, true),
  ('personlig-omsorg', 'omsorg', '{}'::text[], 'Personlig omsorg', 'Hjälp med hygien, promenader, enkla ärenden och enkel matlagning.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Personlig omsorg', array['rut-bidrag', 'rut-massage']::text[], 20, true),
  ('tillsyn', 'omsorg', '{}'::text[], 'Tillsyn av bostaden', 'Vi tittar till bostaden när du är borta – vattnar, tömmer post, kollar läget.', 'rut'::public.deduction_type, 'seller'::public.service_model, null, 'visit'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Tillsyn av bostad', '{}'::text[], 30, true)
on conflict (id) do update set
  category_id = excluded.category_id,
  extra_category_ids = excluded.extra_category_ids,
  name = excluded.name,
  description = excluded.description,
  deduction_type = excluded.deduction_type,
  model = excluded.model,
  rot_kind = excluded.rot_kind,
  pricing_unit = excluded.pricing_unit,
  labour_share_of_total = excluded.labour_share_of_total,
  form_kind = excluded.form_kind,
  ask_home_details = excluded.ask_home_details,
  uses_size_band = excluded.uses_size_band,
  skv_work_type = excluded.skv_work_type,
  warning_ids = excluded.warning_ids,
  sort = excluded.sort,
  active = excluded.active;

-- services 2/3
insert into public.services (id, category_id, extra_category_ids, name, description, deduction_type, model, rot_kind, pricing_unit, labour_share_of_total, form_kind, ask_home_details, uses_size_band, skv_work_type, warning_ids, sort, active) values
  ('rot-ventilation', 'stadning', '{}'::text[], 'Rengöring av ventilationskanaler', 'Rengöring av ventilationskanaler i bostaden.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Rengöring', '{}'::text[], 100, true),
  ('rot-avlopp', 'stadning', '{}'::text[], 'Rengöring av avlopp', 'Rensning och spolning av avlopp i bostaden.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Rengöring', '{}'::text[], 110, true),
  ('rot-byggstadning', 'stadning', '{}'::text[], 'Byggstädning efter ROT-arbete', 'Städning efter renovering eller annat ROT-arbete.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Rengöring', array['rot-bortforsling']::text[], 120, true),
  ('malning-inomhus', 'maleri', '{}'::text[], 'Målning inomhus', 'Målning av väggar och tak inomhus.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'm2'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Målning/tapetsering', '{}'::text[], 10, true),
  ('tapetsering', 'maleri', '{}'::text[], 'Tapetsering', 'Tapetsering av väggar.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'm2'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Målning/tapetsering', '{}'::text[], 20, true),
  ('malning-utomhus', 'maleri', '{}'::text[], 'Målning utomhus', 'Målning av fasad, fönster och knutar.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'm2'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Målning/tapetsering', array['rot-fristaende']::text[], 30, true),
  ('malning-dorrar', 'maleri', '{}'::text[], 'Målning av dörrar', 'Målning av innerdörrar och ytterdörrar.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Målning/tapetsering', '{}'::text[], 40, true),
  ('malning-koksluckor', 'maleri', '{}'::text[], 'Målning av köksluckor', 'Lackering och målning av köksluckor.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Målning/tapetsering', '{}'::text[], 50, true),
  ('badrumsrenovering', 'badrum-kok', '{}'::text[], 'Badrumsrenovering', 'Renovering av badrum, helt eller delvis.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', array['rot-bortforsling', 'rot-arkitekt']::text[], 10, true),
  ('kakel-klinker', 'badrum-kok', '{}'::text[], 'Kakel och klinker', 'Plattsättning av väggar och golv inomhus.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', '{}'::text[], 20, true),
  ('golv-kok-badrum', 'badrum-kok', '{}'::text[], 'Golv i kök eller badrum', 'Byte eller reparation av golv.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', '{}'::text[], 30, true),
  ('fast-inredning', 'badrum-kok', '{}'::text[], 'Fast inredning i kök', 'Byte av köksskåp, bänkskivor och annan fast inredning.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', array['rot-bortforsling']::text[], 40, true),
  ('vitvaror-installation', 'badrum-kok', '{}'::text[], 'Installation av vitvaror vid renovering', 'Installation av inbyggda vitvaror när köket renoveras.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', '{}'::text[], 50, true),
  ('golvlaggning', 'snickeri', '{}'::text[], 'Golvläggning', 'Läggning, slipning och reparation av golv.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', '{}'::text[], 10, true),
  ('vaggar-tak', 'snickeri', '{}'::text[], 'Väggar och innertak', 'Nya eller ändrade väggar och innertak.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', '{}'::text[], 20, true),
  ('dorrar-las', 'snickeri', '{}'::text[], 'Dörrar och lås', 'Byte och justering av dörrar och lås.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', array['rot-larm']::text[], 30, true),
  ('trappor', 'snickeri', '{}'::text[], 'Trappor', 'Byte eller renovering av trappor inomhus.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', '{}'::text[], 40, true),
  ('garderober', 'snickeri', '{}'::text[], 'Inbyggda garderober', 'Platsbyggda garderober och förvaring.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', '{}'::text[], 50, true),
  ('altan-balkong', 'snickeri', '{}'::text[], 'Altan eller balkong fäst i huset', 'Altan eller balkong som sitter fast i huset.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', array['rot-fristaende', 'rot-brf-utanfor']::text[], 60, true),
  ('eldragning', 'el', '{}'::text[], 'Ny- och omdragning av el', 'Nya ledningar eller omdragning av el i bostaden.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'El', '{}'::text[], 10, true),
  ('eluttag', 'el', '{}'::text[], 'Uttag och strömbrytare', 'Nya eller flyttade uttag och strömbrytare.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'El', '{}'::text[], 20, true),
  ('elcentral', 'el', '{}'::text[], 'Byte av elcentral', 'Byte eller uppgradering av elcentral.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'El', '{}'::text[], 30, true),
  ('spotlights', 'el', '{}'::text[], 'Spotlights och fast belysning', 'Installation av infälld och fast belysning.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'El', array['rot-larm']::text[], 40, true),
  ('laddbox', 'el', '{}'::text[], 'Väggmonterad laddbox', 'Installation av laddbox på husväggen.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'El', array['rot-laddstolpe']::text[], 50, true),
  ('rorarbeten', 'vvs', '{}'::text[], 'Rörarbeten', 'Byte och reparation av vatten- och värmerör.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'VVS', '{}'::text[], 10, true)
on conflict (id) do update set
  category_id = excluded.category_id,
  extra_category_ids = excluded.extra_category_ids,
  name = excluded.name,
  description = excluded.description,
  deduction_type = excluded.deduction_type,
  model = excluded.model,
  rot_kind = excluded.rot_kind,
  pricing_unit = excluded.pricing_unit,
  labour_share_of_total = excluded.labour_share_of_total,
  form_kind = excluded.form_kind,
  ask_home_details = excluded.ask_home_details,
  uses_size_band = excluded.uses_size_band,
  skv_work_type = excluded.skv_work_type,
  warning_ids = excluded.warning_ids,
  sort = excluded.sort,
  active = excluded.active;

-- services 3/3
insert into public.services (id, category_id, extra_category_ids, name, description, deduction_type, model, rot_kind, pricing_unit, labour_share_of_total, form_kind, ask_home_details, uses_size_band, skv_work_type, warning_ids, sort, active) values
  ('avlopp', 'vvs', '{}'::text[], 'Avlopp', 'Byte och reparation av avloppsrör i huset.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'VVS', '{}'::text[], 20, true),
  ('varmepump', 'vvs', '{}'::text[], 'Värmepump', 'Installation och byte av värmepump.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'VVS', '{}'::text[], 30, true),
  ('takbyte', 'tak-fasad', '{}'::text[], 'Takbyte', 'Byte eller renovering av tak.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Bygg', array['rot-fristaende']::text[], 10, true),
  ('platarbeten', 'tak-fasad', '{}'::text[], 'Plåtarbeten', 'Plåtarbeten på tak och fasad.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Glas/plåtarbete', '{}'::text[], 20, true),
  ('hangrannor', 'tak-fasad', '{}'::text[], 'Hängrännor och stuprör', 'Byte och reparation av hängrännor.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Glas/plåtarbete', '{}'::text[], 30, true),
  ('fonsterbyte', 'tak-fasad', '{}'::text[], 'Fönsterbyte', 'Byte av fönster och fönsterdörrar.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Glas/plåtarbete', '{}'::text[], 40, true),
  ('inglasning', 'tak-fasad', '{}'::text[], 'Inglasning av balkong', 'Inglasning av balkong eller altan fäst i huset.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Glas/plåtarbete', array['rot-brf-utanfor']::text[], 50, true),
  ('fasadtvatt', 'tak-fasad', '{}'::text[], 'Fasad- och taktvätt', 'Tvätt av fasad och tak.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Rengöring', '{}'::text[], 60, true),
  ('skorsten', 'tak-fasad', '{}'::text[], 'Murning och sotning: skorsten', 'Murning och renovering av skorsten.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Murning', '{}'::text[], 70, true),
  ('kamin', 'tak-fasad', '{}'::text[], 'Murning och sotning: kamin', 'Installation och murning av kamin.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'rebuild'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Murning', '{}'::text[], 80, true),
  ('kakelugn', 'tak-fasad', '{}'::text[], 'Murning och sotning: kakelugn', 'Renovering av kakelugn.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Murning', '{}'::text[], 90, true),
  ('dranering', 'mark', '{}'::text[], 'Dränering av husgrund', 'Dränering runt husets grund.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Mark/dräneringsarbete', array['rot-markarbeten']::text[], 10, true),
  ('gravning', 'mark', '{}'::text[], 'Grävning för avlopp, vatten, el eller fiber', 'Grävning för ledningar till huset.', 'rot'::public.deduction_type, 'agent'::public.service_model, 'repair'::public.rot_kind, 'hour'::public.pricing_unit, null, 'standard'::public.form_kind, false, false, 'Mark/dräneringsarbete', array['rot-markarbeten']::text[], 20, true)
on conflict (id) do update set
  category_id = excluded.category_id,
  extra_category_ids = excluded.extra_category_ids,
  name = excluded.name,
  description = excluded.description,
  deduction_type = excluded.deduction_type,
  model = excluded.model,
  rot_kind = excluded.rot_kind,
  pricing_unit = excluded.pricing_unit,
  labour_share_of_total = excluded.labour_share_of_total,
  form_kind = excluded.form_kind,
  ask_home_details = excluded.ask_home_details,
  uses_size_band = excluded.uses_size_band,
  skv_work_type = excluded.skv_work_type,
  warning_ids = excluded.warning_ids,
  sort = excluded.sort,
  active = excluded.active;

-- service_addons
insert into public.service_addons (id, service_id, label, included, per_window, labour_min_ore, labour_max_ore, sort) values
  ('flytt-ugn', 'flyttstadning', 'Ugn', true, false, 0, 0, 10),
  ('flytt-kyl', 'flyttstadning', 'Kyl och frys', true, false, 0, 0, 20),
  ('flytt-balkong', 'flyttstadning', 'Balkong', false, false, 30000, 50000, 30),
  ('flytt-inglasad', 'flyttstadning', 'Inglasad balkong', false, false, 60000, 100000, 40),
  ('flytt-sprojs', 'flyttstadning', 'Spröjsade fönster', false, false, 40000, 80000, 50),
  ('fonster-sprojs', 'fonsterputs', 'Spröjsade fönster', false, true, 3000, 5000, 10),
  ('storstad-ugn', 'storstadning', 'Ugn', false, false, 40000, 70000, 10),
  ('storstad-kyl', 'storstadning', 'Kyl och frys', false, false, 30000, 60000, 20),
  ('storstad-fonster', 'storstadning', 'Fönsterputs', false, false, 60000, 140000, 30)
on conflict (id) do update set
  service_id = excluded.service_id,
  label = excluded.label,
  included = excluded.included,
  per_window = excluded.per_window,
  labour_min_ore = excluded.labour_min_ore,
  labour_max_ore = excluded.labour_max_ore,
  sort = excluded.sort;

-- price_ranges 1/3
insert into public.price_ranges (service_id, size_band, labour_min_ore, labour_max_ore, material_min_ore, material_max_ore, travel_min_ore, travel_max_ore, note) values
  ('flyttstadning', '0-39'::public.size_band, 440000, 580000, 0, 0, 0, 0, null),
  ('flyttstadning', '40-59'::public.size_band, 620000, 800000, 0, 0, 0, 0, null),
  ('flyttstadning', '60-79'::public.size_band, 760000, 960000, 0, 0, 0, 0, null),
  ('flyttstadning', '80-99'::public.size_band, 940000, 1200000, 0, 0, 0, 0, null),
  ('flyttstadning', '100-129'::public.size_band, 1120000, 1420000, 0, 0, 0, 0, null),
  ('flyttstadning', '130-159'::public.size_band, 1300000, 1660000, 0, 0, 0, 0, null),
  ('flyttstadning', '160+'::public.size_band, 1500000, 2100000, 0, 0, 0, 0, null),
  ('hemstadning', '0-39'::public.size_band, 90000, 140000, 0, 0, 0, 0, 'Per städtillfälle. Lägst pris när vi städar varje vecka.'),
  ('hemstadning', '40-59'::public.size_band, 120000, 170000, 0, 0, 0, 0, 'Per städtillfälle. Lägst pris när vi städar varje vecka.'),
  ('hemstadning', '60-79'::public.size_band, 140000, 200000, 0, 0, 0, 0, 'Per städtillfälle. Lägst pris när vi städar varje vecka.'),
  ('hemstadning', '80-99'::public.size_band, 170000, 240000, 0, 0, 0, 0, 'Per städtillfälle. Lägst pris när vi städar varje vecka.'),
  ('hemstadning', '100-129'::public.size_band, 190000, 270000, 0, 0, 0, 0, 'Per städtillfälle. Lägst pris när vi städar varje vecka.'),
  ('hemstadning', '130-159'::public.size_band, 240000, 340000, 0, 0, 0, 0, 'Per städtillfälle. Lägst pris när vi städar varje vecka.'),
  ('hemstadning', '160+'::public.size_band, 290000, 420000, 0, 0, 0, 0, 'Per städtillfälle. Lägst pris när vi städar varje vecka.'),
  ('storstadning', '0-39'::public.size_band, 440000, 580000, 0, 0, 0, 0, null),
  ('storstadning', '40-59'::public.size_band, 580000, 740000, 0, 0, 0, 0, null),
  ('storstadning', '60-79'::public.size_band, 720000, 920000, 0, 0, 0, 0, null),
  ('storstadning', '80-99'::public.size_band, 860000, 1100000, 0, 0, 0, 0, null),
  ('storstadning', '100-129'::public.size_band, 1040000, 1340000, 0, 0, 0, 0, null),
  ('storstadning', '130-159'::public.size_band, 1260000, 1620000, 0, 0, 0, 0, null),
  ('storstadning', '160+'::public.size_band, 1520000, 1960000, 0, 0, 0, 0, null),
  ('fonsterputs', null, 8000, 12000, 0, 0, 0, 0, 'Per fönster. Pris för spröjsade fönster tillkommer.'),
  ('tvatt-strykning', null, 50000, 70000, 0, 0, 0, 0, null),
  ('packning', null, 60000, 90000, 0, 0, 0, 0, 'Per person och timme.'),
  ('bara-lasta', null, 60000, 90000, 0, 0, 0, 0, 'Per person och timme.')
on conflict (service_id, size_band) do update set
  labour_min_ore = excluded.labour_min_ore,
  labour_max_ore = excluded.labour_max_ore,
  material_min_ore = excluded.material_min_ore,
  material_max_ore = excluded.material_max_ore,
  travel_min_ore = excluded.travel_min_ore,
  travel_max_ore = excluded.travel_max_ore,
  note = excluded.note;

-- price_ranges 2/3
insert into public.price_ranges (service_id, size_band, labour_min_ore, labour_max_ore, material_min_ore, material_max_ore, travel_min_ore, travel_max_ore, note) values
  ('mobelmontering', null, 60000, 90000, 0, 0, 0, 0, null),
  ('upphangning', null, 60000, 90000, 0, 0, 0, 0, null),
  ('secondhand-transport', null, 160000, 400000, 0, 0, 0, 0, 'Avdraget är 25 % av hela priset, eftersom halva priset räknas som arbete.'),
  ('grasklippning', null, 50000, 80000, 0, 0, 0, 0, null),
  ('hackklippning', null, 50000, 80000, 0, 0, 0, 0, null),
  ('ograsrensning', null, 50000, 80000, 0, 0, 0, 0, null),
  ('krattning', null, 50000, 80000, 0, 0, 0, 0, null),
  ('beskarning', null, 50000, 80000, 0, 0, 0, 0, null),
  ('tradfallning', null, 70000, 120000, 0, 0, 0, 0, null),
  ('stubbfrasning', null, 70000, 120000, 0, 0, 0, 0, null),
  ('snoskottning', null, 50000, 80000, 0, 0, 0, 0, null),
  ('takskottning', null, 70000, 120000, 0, 0, 0, 0, null),
  ('it-installation', null, 60000, 100000, 0, 0, 0, 0, null),
  ('it-felsokning', null, 60000, 100000, 0, 0, 0, 0, null),
  ('vitvaror-reparation', null, 80000, 140000, 0, 0, 0, 0, 'Reservdelar tillkommer.'),
  ('barnpassning', null, 35000, 55000, 0, 0, 0, 0, null),
  ('personlig-omsorg', null, 40000, 60000, 0, 0, 0, 0, null),
  ('tillsyn', null, 30000, 60000, 0, 0, 0, 0, 'Per besök.'),
  ('malning-inomhus', null, 14000, 23000, 0, 0, 0, 0, 'Per m² väggyta, före ROT-avdrag. Material tillkommer.'),
  ('tapetsering', null, 15000, 25000, 0, 0, 0, 0, 'Per m² väggyta, före ROT-avdrag. Tapet tillkommer.'),
  ('malning-utomhus', null, 15000, 30000, 0, 0, 0, 0, 'Per m² fasad, före ROT-avdrag. Material tillkommer.'),
  ('golvlaggning', null, 45000, 65000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('vaggar-tak', null, 45000, 65000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('dorrar-las', null, 45000, 65000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('trappor', null, 45000, 65000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.')
on conflict (service_id, size_band) do update set
  labour_min_ore = excluded.labour_min_ore,
  labour_max_ore = excluded.labour_max_ore,
  material_min_ore = excluded.material_min_ore,
  material_max_ore = excluded.material_max_ore,
  travel_min_ore = excluded.travel_min_ore,
  travel_max_ore = excluded.travel_max_ore,
  note = excluded.note;

-- price_ranges 3/3
insert into public.price_ranges (service_id, size_band, labour_min_ore, labour_max_ore, material_min_ore, material_max_ore, travel_min_ore, travel_max_ore, note) values
  ('garderober', null, 45000, 65000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('altan-balkong', null, 45000, 65000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('eldragning', null, 55000, 75000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('eluttag', null, 55000, 75000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('elcentral', null, 55000, 75000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('spotlights', null, 55000, 75000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('laddbox', null, 55000, 75000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('rorarbeten', null, 55000, 75000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('avlopp', null, 55000, 75000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.'),
  ('varmepump', null, 55000, 75000, 0, 0, 0, 0, 'Före ROT-avdrag. Material tillkommer.')
on conflict (service_id, size_band) do update set
  labour_min_ore = excluded.labour_min_ore,
  labour_max_ore = excluded.labour_max_ore,
  material_min_ore = excluded.material_min_ore,
  material_max_ore = excluded.material_max_ore,
  travel_min_ore = excluded.travel_min_ore,
  travel_max_ore = excluded.travel_max_ore,
  note = excluded.note;

-- settings
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- admin_users
insert into public.admin_users (email, added_by) values ('cyprinekamoga@gmail.com', 'seed')
on conflict (email) do nothing;
