# Productvisie — Oelie en Roebie

> **SINGLE SOURCE OF TRUTH: dit is het leidende document voor het doel, de gewenste ervaring, de productgrenzen en de ontwikkelvolgorde van Oelie en Roebie.**
>
> Vastgesteld: **10 oktober 2026**. Status: **besloten productrichting; deels nog niet gebouwd**.
>
> **Werkregel:** begin bij dit document voordat je iets aan UX, vragen, modellen, rapporten of reissuggesties verandert. Werk nieuwe productbeslissingen hier bij, niet alleen in een losse chat, PR, README of technische notitie. Technische documenten mogen de implementatie uitwerken, maar mogen geen afwijkend productdoel definiëren.

## 1. Missie en kernbelofte

**Eén speels reisboekje voor twee dat via mooie, betekenisvolle en slim gekozen vragen ontdekt welke lange reis bij beiden past, en op basis daarvan steeds concretere, haalbare volledige reisvoorstellen maakt.**

De gebruiker speelt geen eindeloze enquête en hoeft niet zelf een spreadsheet met etappes in te vullen. Iedere set helpt om samen te dromen, elkaar beter te begrijpen en stap voor stap van **verlangen → voorkeuren → grenzen → reisstructuur → echte reisopties** te komen.

**Belofte:** vragen zijn leuk om samen te beleven én leveren zorgvuldig geïnterpreteerde gegevens op. Reis-DNA vertelt wat we leren; het Reiskantoor toont wat dat voor de hele reis betekent.

### Vijf productprincipes

1. **Eén vragenervaring.** Niet apart kiezen tussen Sets en Reisvragen; één vloeiende stroom van meestal vier vragen per set.
2. **Leuk én serieus.** Humor, kwetsbaarheid, verrassing en romantiek blijven essentieel. Wetenschappelijke zorgvuldigheid zit vooral in selectie, registratie, analyse en rapportage.
3. **Twee gelijkwaardige reizigers.** Ieder antwoordt op het eigen account. Verschillen mogen blijven bestaan; een compromis is uitlegbaar en niet stiekem een gemiddelde of een winnaar.
4. **Één complete reis.** Heenreis, tussenstops, lange verblijven, vrije tijd en terugreis zijn onderling afhankelijk. Een week kan niet tweemaal worden uitgegeven.
5. **Geen schijnzekerheid.** Maak onderscheid tussen een droom, een antwoord, een geschatte voorkeur, een expliciete harde grens, een modelscenario en een met bronnen geverifieerde echte mogelijkheid.

## 2. De gewenste app: één ingang, twee resultaten

### Vragen — de enige primaire vragenstroom

- De oorspronkelijke **Sets** en afzonderlijke **Reisvragen** worden **in de gewenste UX samengebracht** onder **Vragen**. De achterliggende soorten vragen en hun bewijsstatus blijven technisch gescheiden.
- Meestal bevat een set **vier complementaire vragen**, thematisch verbonden en kort genoeg voor een ontspannen moment.
- Beide gebruikers krijgen dezelfde, onveranderlijke vraag en opties, maar ieder beheert de eigen voortgang. Antwoorden worden pas onthuld als allebei de betreffende vraag hebben beantwoord.
- Een set mag worden bewaard, gepauzeerd en later hervat. **Voor later** is de plek voor opgeslagen vragen; **Geschiedenis** toont eerdere gezamenlijke ontdekkingen.
- Nieuwe sets mogen adaptief inspelen op ontbrekende kennis en verrassende verschillen, maar mogen niet halverwege worden herschreven nadat iemand begonnen is.
- Er blijft ruimte voor de wekelijkse hoofdvraag, mits die geen verwarrende tweede verplichte vragenstroom wordt.

### Reis-DNA — het persoonlijke en gezamenlijke reisportret

Toont na verloop van tijd:

- Selecteer **Oelie**, **Roebie** of **samen** voor individuele geschatte voorkeuren, overeenkomsten, verschillen en relevante onzekerheid.
- Een **rangorde** van reiseigenschappen, met herleidbare onderbouwing en een zichtbaar onderscheid tussen **voldoende bewijs**, **voorlopig signaal** en **nog onbekend**.
- Hoe goed het model nieuwe keuzes voorspelt, hoe de onderbouwing groeit en waarom de volgende vragen worden gesteld.
- Leuke bevindingen: onverwachte overeenkomsten, verrassende verschillen, veranderde voorkeuren, gespreksonderwerpen en persoonlijke dromen.
- Het bestaande **Reisrapport** leeft hier als **speelse historische terugblik en verhaal**, niet als reisdagboek dat pas tijdens de reis begint. Vermeng de oude speelse tekst niet met harde wetenschappelijke conclusies.
- Geen claims over persoonlijkheid, relatiekwaliteit of een objectieve compatibiliteitsscore op basis van een kleine set hypothetische keuzes.

### Reiskantoor — het resultaat, niet het invulformulier

Toont:

- Een **complete lange reis** als afgeleid scenario, met een heenreis, mogelijke tussenstops, één of meer lange verblijven, vrije ruimte en een terugreis.
- Tijd, etappes, rijbelasting, rustmomenten, wenssoorten en later kosten die **onderling kloppen**. Als iets niet past, een begrijpelijke uitleg en alternatieven.
- Verschillende gezamenlijke varianten wanneer voorkeuren uiteenlopen: bijvoorbeeld **één lange thuisbasis** tegenover **twee verblijfplaatsen**, of **langzamer reizen** tegenover **meer ontdekken onderweg**.
- Inspirerende **typen ervaringen** (leren, zeilen, community, keramiek, natuur, stad, ontspannen) op basis van bewijs uit antwoorden.
- Later **echte bestemmingen** met bron, route, seizoen, concrete haalbaarheid, kosten en beschikbaarheid dankzij een afzonderlijke AI-ondersteunde onderzoekslaag.
- Geen verplichte handmatige etappe-invoer om tot een resultaat te komen. Bewuste bevestiging/correctie van een belangrijke voorkeur of harde grens mag wél.

## 3. Samenstelling van een set: vier vragen met verschillende taken

**Standaarddoel voor de meeste sets:**

| Slot | Vraagfunctie | Wat levert het op? | Mag dit het statistische DCE-model trainen? |
| --- | --- | --- | --- |
| 1 | **Speels en persoonlijk** | Verhalen, humor, dromen, thema's en gesprek | **Nee**, niet als experimentele waarneming |
| 2 | **Reissoort / etappe / grens** | Duidelijkheid over reisritme, duur, heen- en terugreis, minimumverblijf, flexibiliteit | **Nee**, tenzij ooit apart ontworpen als valide meettaak; wél input voor de planning |
| 3 | **Gecontroleerde meer-attribuut-afweging** | Geschatte voorkeuren en trade-offs | **Ja**, indien aangewezen schattingstaak uit vaste studieversie |
| 4 | **Gecontroleerde meer-attribuut-afweging** | Meer identificerende informatie; soms een afzonderlijke toetsvraag | **Ja** bij schattingstaak; **nee** bij vooraf gereserveerde holdout |

**Dit is een streefverdeling, geen onwrikbaar quota.** De selectie kan tijdelijk extra etappevragen gebruiken als een belangrijke planbeperking onbekend is, meer wetenschappelijke afwegingen wanneer het model te onzeker blijft, of meer luchtigheid als de cognitieve belasting te hoog wordt. Een set moet een begrijpelijk **thema** hebben, zoals *Zwerven of ergens landen?*, *De reis ernaartoe* of *Op één plek thuis voelen*.

**Cruciale nuance:** thematische samenhang in de **beleving** mag de statistische identificatie van het experiment **niet verstoren**. Selecteer gecontroleerde keuzetaken uit de versievaste DCE-bank met voldoende onafhankelijke variatie in attributen en niveaus; laat een AI geen aantrekkelijk maar willekeurig alternatief presenteren alsof het een valide studie-observatie is. De vaste testvragen blijven buiten de training.

### Voorbeeld: 'Zwerven of ergens landen?'

1. Speels: *Een maand wonen in een kunstenaarsdorp of iedere week een nieuw uitzicht?*
2. Reisstructuur: *Lievere heenreis van drie weken met veel stops, of sneller naar het eerste lange verblijf?* De totale reisduur blijft expliciet in beeld.
3. Een wetenschappelijk gecontroleerde afweging uit de vastgelegde bank met onder andere kosten, verblijfsduur en rijbelasting.
4. Een tweede zorgvuldig ontworpen vergelijking, eventueel een vooraf gereserveerde holdout.

Na afloop: **één leuke onthulling**, een eventuele aanpassing van de **onderzoeksstatus in Reis-DNA** en — zodra verantwoord — een **bijgesteld reisvoorstel in Reiskantoor**. Niet elke set hoeft een nieuwe route af te dwingen: soms is 'we weten het nog niet' het juiste resultaat.

## 4. Reissoort wordt ontdekt, niet vooraf opgedrongen

De app stelt niet meteen vast dat iemand een 'roadtripper', 'slow traveller' of 'avonturier' is. Deze woorden zijn bruikbare **scenario- en verhaalbeschrijvingen**, geen bewezen psychologische types.

Mogelijke reisvormen die samen of naast elkaar mogen bestaan:

- **Slow travel:** langere thuisbasissen, ritme, rust en lokale verbinding.
- **Zwervende rondreis:** meer stops en ontdekking onderweg, met passende rijbelasting.
- **Hybride lange reis:** een avontuurlijke heenreis, één of twee lange verblijven en een andere terugreis.
- **Leer- of communityreis:** langere etappes gericht op activiteiten en deelname; dit is een *doel* en niet noodzakelijk een vervoersvorm.

Toon **waarom** een scenario bij elk van beiden lijkt te passen, hoe onzeker die conclusie is en wat het kost in reistijd, budget of flexibiliteit. Gebruik geen verzonnen matchpercentages.

## 5. De wetenschappelijke kern: soorten bewijs blijven herkenbaar

### A. Speelse antwoorden en het bestaande Reisrapport

Geschikt voor inspiratie, verhaal, vervolggesprek en het aanwijzen van nog onduidelijke thema's. Historische sets blijven behouden; ze worden **niet ongemerkt omgezet in nieuwe DCE-waarnemingen**.

### B. Etappe- en grensvragen

Beschrijven wensen over bijvoorbeeld totale reisduur, heenreis, terugreis, hoeveel weken ergens landen, aantal stops, rustweken, seizoen en reisbudget. De antwoorden voeden **de haalbaarheid en scenario-keuze**. Een A/B-antwoord legt **nooit automatisch een harde grens** vast. Harde grenzen vereisen expliciete bevestiging.

### C. Gecontroleerde Discrete Choice Experiments (DCE)

Het experiment houdt rekening met meerdere attributen tegelijk en schat **persoonsgebonden relatieve voorkeuren**. De huidige technische pilot heeft een **versievaste bank van 48 vergelijkingen**, waarvan **42 voor schatting en zes vooraf gereserveerde holdouts**. Per vergelijking blijven het ontwerp, de schaal, antwoordidentiteit en rol onveranderlijk.

Modelprincipes:
- Een vooraf beschreven experimenteel ontwerp met voldoende variatie, balans, niet-triviale trade-offs en controle op identificeerbaarheid.
- Voorlopige **Bayesiaans geregulariseerde logistische schattingen (MAP/Laplace)** met onzekerheidsintervallen, niet zomaar een optelsom van gekozen 'hoger/lager'.
- **Adaptieve vraagselectie** op verwachte informatiewaarde voor beide personen; een kleine thematische aansluiting op oude rapporten mag, maar niet ten koste van de identificeerbaarheid.
- **Holdouts** worden niet gebruikt om het model te fitten. Toon een voorspellingstoets (bijv. Brier-score en log-loss) tegenover een eenvoudige baseline, maar noem dit interne validatie.
- Vragen zijn bij voorkeur kort en begrijpelijk, met duidelijke eenheden; beperk vermoeidheid, links/rechts-bias en dominante of onrealistische combinaties.
- Een **volledig gevalideerd wetenschappelijk instrument** vereist nog cognitieve interviews, attributen-/niveauvalidatie, antwoordstabiliteit, toetsing van bias en externe evaluatie. Met twee deelnemers kan geen populatieclaim worden gedaan.

### D. AI-bestemmingsvoorstellen (later)

Dit zijn **onderzochte externe mogelijkheden**, geen voorkeurmetingen. Een LLM mag helpen kandidaten bedenken of samenvatten, maar moet zijn voorstellen laten controleren tegen herleidbare, actuele bronnen en de harde routebeperkingen. **Geen beweerde prijs, reistijd, beschikbaarheid of boekbaarheid zonder verificatie.**

## 6. Het intelligente vragenbrein

Voordat een nieuwe set wordt samengesteld, beoordeelt het systeem:

1. **Wat is onbekend?** Ontbreekt een belangrijke reisgrens, voorkeur, reissoortafweging of wetenschappelijke parameter?
2. **Waar verschillen de personen?** Is er een echt conflict, een mogelijk compromis of vooral onduidelijkheid?
3. **Wat levert de volgende vraag op?** Verwachte informatiewinst in het persoonlijke voorkeurmodel én verwachte impact op een haalbare hele reis.
4. **Is de set prettig om te beantwoorden?** Afwisseling, begrijpelijkheid, humor, geen vermoeiende herhaling en passen bij het eerder gekozen thema.
5. **Is de experimentele integriteit intact?** Een schattingstaak kan niet vervangen worden door een door een AI verzonnen variatie; een holdout blijft een holdout.

De selectielogica mag **twee samenwerkende modellen** hebben:
- **Preference learning:** posterior/schatting met onzekerheid voor individuele keuzes.
- **Planning sensitivity:** simuleer hoe mogelijke antwoorden haalbare hele-reisscenario's veranderen; kies vragen die belangrijke onzekerheid verkleinen.

Daarboven zit een **set-composer** die verschillende vraagrollen in een aantrekkelijke, gedeelde ervaring groepeert. De rollen mogen gemengd in de UI; de data moet altijd vastleggen wat een antwoord wel/niet bewijst.

**Privacy/integriteit:** dezelfde setidentiteit voor beiden, individuele voortgang onafhankelijk, geen partnervoorkeur onthullen voordat beiden kozen, geen adaptieve nieuwe DCE-ronde starten op basis van een nog verborgen individueel antwoord en geen herschrijven van al uitgegeven taken.

## 7. Reiskantoor: meerdere niveaus die elkaar beperken

**L0: gehele reis** — totale duur, indicatief budget, seizoen en expliciete harde grenzen.

**L1: hoofdstukken** — heenreis, lange verblijven, extra tussenhoofdstukken, flexibele buffer, terugreis. Alle weken tellen precies één keer mee.

**L2: kleinere etappes** — stops *binnen* de heen- en terugreis: aantal, stopdagen, rustdagen en ruimte voor daadwerkelijke verplaatsingen. Geen stopdagen buiten het totale tijdsbudget rekenen.

**L3: samenhang** — minimale duur per lang verblijf, maximaal acceptabele rijbelasting, seizoen/weer, individuele afwegingen en resterende flexibiliteit. Onmogelijke combinaties krijgen een conflictmelding en alternatieve scenario's in plaats van een verborgen versoepeling.

**L4: later bestemmingen en concrete planning** — echte regio's, geografische opvolging, reistijden, routes, visa/regels, beschikbaarheid en verifieerbare kosten. De toekomstige AI kiest **binnen het planningsmodel**, niet door beperkingen achteraf weg te rationaliseren.

Het systeem kan een voorstel geven van *ongeveer drie weken heen, twee thuisbasissen, een andere terugweg*, voordat het weet **waar** die zullen zijn. Dat voorlopige resultaat moet duidelijk als scenario worden gepresenteerd.

## 8. Meten of het product beter wordt

**Ervaring:** afgeronde sets, terugkeer, ervaren plezier, gesprekstof, begrijpelijkheid, gebruikersvertrouwen en vermoeidheid.

**Wetenschap:** dekking/identificeerbaarheid van attributen, onzekerheidsreductie, interne/latere externe voorspelkwaliteit, antwoordstabiliteit en kalibratie.

**Planner:** aandeel haalbare scenario's, correct tijdsbudget, geen genegeerde harde grens, individueel nadeel per reiziger, uitleg van verschillen, en hoeveel extra vragen nodig zijn voor een betekenisvol resultaat.

**Echte AI-opties (later):** aandeel geverifieerde routes, datum en bron van prijs/aanbod, geografische consistentie, reisdagen/budget correct en alternatieven met verklaarde trade-offs.

**Voorbeeld van een geslaagde set:** jullie kregen een verrassend gesprek, er is één nog onbekende voorkeur onderzocht en het Reiskantoor laat zien *welke reisopties daardoor ontstaan, blijven of afvallen*. Een 'geen duidelijke verandering' is ook een legitieme conclusie.

## 9. Prioriteiten en productfasen

| Fase | Wat leveren we? | Status op 10-10-2026 |
| --- | --- | --- |
| **0. Bestaande basis** | Dagelijkse Sets, geschiedenis, persoonlijk reiscontextmodel, losse Reisvragen, Reis-DNA en read-only Reiskantoor | **Aanwezig, maar nog twee vragenstromen** |
| **1. Eén uniforme Vragen-ervaring** | Eén set-composer met vier complementaire rollen, thematische set, gedeelde vraagidentiteit, onafhankelijke antwoorden en helder navigatiemodel | **Besloten — nog bouwen** |
| **2. Wetenschap geïntegreerd zonder vervuiling** | DCE-taken in sets, vooraf gereserveerde holdouts, valide model-input, onzekerheid en meetbare informatiewinst; etappevragen apart gemarkeerd | **Onderliggende pilot deels gebouwd; integratie nog bouwen en evalueren** |
| **3. Resultaten die samenkomen** | Reis-DNA als mooi doorlopend verhaal/rapport; Reiskantoor dat door álle relevante vraagrollen beter wordt en uitlegt waarom | **Deels aanwezig; koppeling en UX verbeteren** |
| **4. Echt complete AI-reis** | Onderzoek naar geverifieerde bestemmingen, reistijden, seizoenen, activiteiten en prijzen; scenario-vergelijking over de volledige reis | **Later; echte databronnen nog niet aangesloten** |

**Eerstvolgende implementatiefocus:** één uniforme set-ervaring en betrouwbare routering van de vier vraagrollen naar de juiste resultaten, zonder migratieverlies en zonder terugval in wetenschappelijke kwaliteit. **Niet** beginnen met mooie AI-bestemmingen zolang de vraag- en bewijsarchitectuur niet samenhangt.

## 10. Bewuste niet-doelen en open beslissingen

Niet doen:
- Geen afzonderlijke verplichte tweede vragenreeks naast Sets.
- Geen handmatige reisplanner als noodzakelijke start; de vragen zijn de primaire input.
- Geen 'wij passen 94% bij elkaar'-achtige compatibiliteitsclaim uit speelse of kleine samples.
- Geen willekeurig gegenereerde DCE-vragen meetellen in het getrainde model.
- Geen onzichtbare versoepeling van tijd, budget of expliciete grenzen.
- Geen fictieve AI-prijzen, routeafstanden of boekbaarheidsclaims.
- Geen oude of lopende antwoorden kwijtraken door vraagrollen/ID's te wijzigen.

Nog te evalueren:
- Hoe vaak mag de vier-vragenset afwijken van de standaardverdeling voordat hij te zwaar of te voorspelbaar wordt?
- Hoe definiëren en valideren we begrijpelijke attributen en niveaus per **reiscontext** (lange autoreis nu; andere reisvormen eventueel later)?
- Hoe tonen we onzekerheid aantrekkelijk in Reis-DNA zonder te stellig of te klinisch te worden?
- Wanneer vraagt het systeem expliciet een grens te bevestigen, en wanneer blijft een voorkeur slechts een scenario?
- Hoe organiseren we gebruikersinterviews en een onafhankelijke testset vóór een claim van wetenschappelijke validatie?
- Hoe voegen we in de toekomst geverifieerde AI-bestemmingen toe zonder de set-ervaring of keuzevaliditeit te verstoren?

## 11. Documenthiërarchie en wijzigingsprocedure

**Productdoel en besluiten: dit bestand.** Alles hieronder is ondergeschikt; herhaal hier geen volledige technische implementatie.

- [README](../README.md) — installatiestappen en stand van de bestaande app, met een link naar deze visie.
- [Vraagstrategie](QUESTION_STRATEGY.md) — geschiedenis/implementatie van Sets en selectie.
- [Voorkeurmodel](PREFERENCE_MODEL.md) — database, expliciete grenzen en bewijssoorten.
- [DCE-onderzoeksprotocol](DCE_STUDY_PROTOCOL.md) — onderzoeksopzet, bestaande beperkingen, validatiecriteria.
- [Wetenschappelijke reisplanner](SCIENCE_TRIP_V2.md) — technische planning en invarianten.
- [Reiskantoor](REISKANTOOR.md) — implementatiedetails en historische architectuur.

**Bij iedere toekomstige productwijziging:**
1. Benoem de gebruikersbehoefte en leg de gewijzigde beslissing **hier** vast.
2. Markeer wat **besloten**, **hypothese**, **gebouwd** of **gevalideerd** is.
3. Pas technische documentatie/code/tests aan en verwijs terug naar deze visie.
4. Controleer backward compatibility van vragen, antwoord-ID's, geschiedenis en statistische model-versies.
5. Verifieer het resultaat in de app met twee afzonderlijke accounts vóór je iets 'live en bewezen' noemt.

### Beslissingslogboek

| Datum | Besluit | Betekenis |
| --- | --- | --- |
| 10-10-2026 | **Één Vragen-ingang**, met sets van meestal vier vragen; de rollen speels, etappe en gecontroleerde afweging worden gecombineerd | De twee bestaande vragenstromen worden later samengevoegd in de UX; geen data samenvoegen alsof alles dezelfde wetenschappelijke status heeft |
| 10-10-2026 | **Reis-DNA en Reiskantoor zijn resultaten** van die vragen, niet alternatieve vragenreeksen | Reis-DNA = persoonlijke en gezamenlijke interpretatie; Reiskantoor = hele, haalbare reisstructuur |
| 10-10-2026 | **Wetenschappelijke integriteit boven cosmetische uniformiteit** | Alleen ontworpen meettaken tellen als DCE-training; holdouts blijven apart |
| 10-10-2026 | **Echte bestemmingen met AI zijn een latere laag** | Eerst het vragenbrein en de onderlinge etappe-afhankelijkheden op orde, daarna gecontroleerde externe reisdata |
