# Breedte, diepte en sets

De bank bevat 124 handgeschreven dilemma’s: 60 bestaande vragen blijven voor opgeslagen snapshots en geschiedenis beschikbaar; 64 nieuwe vragen zijn gericht op de langere autoreis. Nieuwe sets selecteren uit deze 64 vragen. Dit voorkomt terugkerende vliegvakanties en korte luxeweekjes die niet bij de uitgangssituatie passen.

Een set heeft normaal vier rollen: kernvraag, grens/verfijning, persoonlijk/samen en speelse wildcard. Het is geen dagelijkse blokkade: na antwoord of bewaren volgt direct de volgende vraag; na de set kiest iemand vrijwillig Nog een set. Beide personen krijgen dezelfde set per dag/volgnummer, maar hebben een eigen voortgang. Een tweede persoon hoeft niet te wachten en wordt niet doorgestuurd naar de set van de eerste. Bij uitputting stopt de flow met een duidelijke melding; een laatste set kan minder vragen bevatten als grenzen de beschikbare bank beperken.

Onderwerpen omvatten reisduur, vertrekmaand, maandbudget voor twee, buffer, rijtijd, verplaatsingen, warm/droog weer, regenuitzonderingen, zee, retreats, communities, privacy, werkafspraken, vrijwilligerswerk, leerbudget, taal, keramiek, koken, tuinieren, zeilen, surfen, dansen, eigen dromen, sociale verschillen, thuiscontact, rust, autonomie en zelfspot. Prijzen vermelden hun eenheid en zijn fictieve dilemmawaarden, geen actuele aanbiedingen. Foto’s zijn sfeerbeelden, geen bewijs van een concrete bestemming.

Vraagvormen: paired comparison/trade-off, scenario, extreme, one-change, wildcard, boundary, refinement, personal-dream, conflict, conditional en bundle. Bundles combineren een paar expliciete attributen; dit is een pragmatische DCE-vorm zonder geclaimde statistische kalibratie.

`selectTravelSet` sluit eerder toegewezen vragen uit, maakt de vier rollen divers, geeft open of onzekere expliciete attributen voorrang en weegt recente verschillen en overmatig herhaalde thema’s mee. Bekende harde grenzen filteren vergelijkbare optiewaarden/ranges; zachte voorkeuren blijven bespreekbaar. Een optie zonder een attribuut geldt als onbekend, niet als bewezen conform: een dilemma is geen complete reisbeschrijving. Er worden geen nieuwe vragen door AI gegenereerd en geen causale voorkeurinteracties verzonnen.

Nieuwe afspraken beïnvloeden nog te maken sets. Een bestaande gedeelde set wordt niet halverwege vervangen, zodat antwoordvergelijking en snapshots betekenis houden. Bijzondere hardheidsvragen tonen een gesprek over een regel; een gewone A/B-keuze verandert de expliciete afspraak niet stilzwijgend. Via Onze reisuitgangspunten kan het duo een grens bewust vastleggen.

Directe beantwoording onderbreekt de flow niet met een reveal. De uitkomst is later beschikbaar via Antwoordgeschiedenis of Alle sets. Alleen dan, na beide antwoorden, worden keuzes vergeleken. Het volledige kaartvlak gebruikt dezelfde native knop voor muis, touch en toetsenbord.

Voor iteratief proberen: `/test` gebruikt dezelfde vragen, foto’s, selectie, individuele tellers en schermen uitsluitend in geheugen. Beide personen, bewaren, extra sets, instellingen, rapportvoorbeelden en reset werken zonder app-API, storage of service-workerregistratie. `npm test`, `scripts/sets-check.mjs` en `scripts/preview-check.mjs` controleren de domeinregels, echte databaseflow en browserflow.
