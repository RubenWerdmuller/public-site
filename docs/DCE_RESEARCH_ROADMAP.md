# Onderzoeksrichting: discrete-choice-model voor Oelie en Roebie

Status: **voorstel, nog niet geïmplementeerd of wetenschappelijk gevalideerd** (9 oktober 2026).

## Wat de app nu echt doet

- De 124 handgeschreven dilemma's bieden A/B-keuzes, soms met meerdere veranderende attributen.
- `lib/domain.ts:insights` telt voor elk numeriek attribuut of de gekozen optie hoger of lager scoorde dan de afgewezen optie; `lib/service.ts:refreshInsights` slaat dit als `weak_preference` op.
- `confidence = min(.75, observations / 12)` is een heuristiek, **geen** statistisch betrouwbaarheidsinterval.
- Als temperatuur, kosten en privacy tegelijk veranderen, is een keuze geen zuiver bewijs voor ieder afzonderlijk attribuut. Het huidige algoritme schrijft toch aan alle veranderde numerieke attributen een richting toe.
- `selectTravelSet` spreidt onderwerpen en geeft onbekende thema's voorrang. Het optimaliseert geen statistische informatie-opbrengst (expected information gain).
- Bekende harde grenzen en expliciete voorkeuren staan los van afgeleide voorkeuren; deze scheiding moet behouden blijven.

## Doel: individuele voorkeuren met onzekerheid

Voor persoon `i`, vergelijking `t`, en attributenverschil `d_t = x_A - x_B`:

`P_i(A | d_t, beta_i) = sigmoid(beta_i · d_t)`.

Dit is een binaire logit (speciale vorm van conditional logit) op basis van random-utility-theorie. `beta_i` zijn geschatte individuele attribuutgewichten, niet absolute waarheden. Door weinig keuzes per persoon zijn sterke regularisatie / zwakke uitspraken noodzakelijk.

De app heeft precies twee specifieke gebruikers. Bouw **geen** populatiemodel of complexe hiërarchische Bayes uit alleen hun data. Een per-persoon logistisch model met regularisatie is een passende eerste stap; een Bayesiaanse posterior met expliciete prior en onzekerheid is een mogelijke vervolgstap.

## Gefaseerde uitvoering

1. **Attributen en niveaus vastleggen.** Begin met een klein, consistent aantal besluitvariabelen: reisduur, maandbudget voor twee, temperatuur, privacy, rijbelasting en community-intensiteit. Leg schalen, eenheden, referentieniveaus en begrensde waardes vast. Gebruik nooit verschillende prijseenheden alsof ze hetzelfde attribuut zijn.
2. **Goed ontworpen keuzetaken.** Toon twee geloofwaardige alternatieven en varieer 1–3 attributen tegelijk; houd de rest gelijk. Zorg over de reeks voor gebalanceerde niveaus, weinig perfecte correlaties en omwisseling van A/B-posities. Vermijd duidelijk gedomineerde opties. Voeg indien nodig 'geen van beide' toe. Harde grenzen worden eerst expliciet geverifieerd; keuzes maken niet stilzwijgend een harde grens.
3. **Fit en onzekerheid.** Sla een ontwerpversie en genormaliseerde attributen per keuze op, behoud oude immutable snapshots. Schat per persoon een geregulariseerde logistische likelihood (en later eventueel Bayesiaans). Toon bij weinig bewijs 'nog onduidelijk', niet schijnpreciese percentages of vaste `confidence`.
4. **Vragen adaptief selecteren.** Gebruik eerst diverse, gebalanceerde vragen. Later kan het systeem kandidaten rangschikken op informatiewaarde en themadekking. Omdat beide mensen dezelfde vraag ontvangen, moet de selectie rekening houden met de onzekerheid **van allebei**, zonder de geheime keuze te onthullen.
5. **Valideren.** Houd enkele vooraf vastgelegde vergelijkingen apart als voorspellingstest. Vergelijk voorspellende kwaliteit en kalibratie met een simpele baseline, controleer herhaalbaarheid en mogelijke vraagmoeheid. Maak niet de claim dat een reis- of relatieresultaat bewezen wordt.

## Concrete voorbeeldvraag voor het nieuwe model

Zelfde regio, dezelfde reisduur en activiteiten; alleen twee attributen verschillen:

- **A:** € 1.800 per maand voor twee; gedeelde badkamer.
- **B:** € 2.300 per maand voor twee; eigen badkamer.

De afweging zegt iets over de combinatie van budget en privacy, **niet** los over de waarde van elk attribuut. Voeg andere zorgvuldig ontworpen vergelijkingen toe om beide gewichten van elkaar te onderscheiden.

## Van persoonlijke gewichten naar samen reizen

- Maak individuele voorspellingen apart voor Oelie en Roebie.
- Bepaal gezamenlijk welke opties aan expliciete harde grenzen voldoen en voor beide aantrekkelijk lijken; presenteer verschillen als bespreekpunten.
- Houd `match %` duidelijk gelabeld als beschrijvende overeenstemming, niet als kans op een geslaagde relatie.
- Bewaar privacy: vóór dubbel antwoord alleen eigen antwoorden tonen; gebruik geen individuele posterior van de partner als impliciete onthulling.
- Geef naast A/B ruimte voor open wensen, uitzonderingen en 'daar zit een gesprek'.

## Onderbouwing

- ISPOR Task Force 2013, experimenteel ontwerp en identificeerbaarheid: https://pubmed.ncbi.nlm.nih.gov/23337210/
- ISPOR Task Force 2016, analysekeuze en conditional logit: https://pubmed.ncbi.nlm.nih.gov/27325321/
- Kessels, Jones & Goos (2011), partial-profile designs tegen keuze-overbelasting: https://www.sciencedirect.com/science/article/pii/S1755534513700423
- Gibbard & Sadlier (2025), adaptieve Bayesiaanse designs vooral zinvol voor **individuele**, niet automatisch populatieparameters: https://link.springer.com/article/10.1007/s11002-025-09768-4

**Praktische volgende code-stap:** een geteste, versioned experimentele vraaggenerator voor 4–6 attributen met simpele logistische schatting en uitdrukkelijke onzekerheidslabels. Houd de bestaande speelse vragenbank intact.
