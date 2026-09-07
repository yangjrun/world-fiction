---
country: us
countryName: Stati Uniti
document: dv-lottery
documentName: foto per la lotteria DV
title: "Lotteria DV: requisiti della foto (600x600 px, sotto 240 KB)"
description: Crea nel browser una foto conforme per la lotteria dei visti per la diversità. Esattamente 600x600 pixel, sotto il limite di 240 KB, con testa e occhi in posizione.
output:
  kind: digital
  widthPx: 600
  heightPx: 600
headHeight:
  minRatio: 0.5
  maxRatio: 0.69
eyeLine:
  minRatio: 0.56
  maxRatio: 0.69
background:
  description: Bianco pieno o bianco sporco
  colors:
    - '#ffffff'
file:
  format: jpeg
  maxBytes: 245760
sourceUrl: https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-entry/diversity-visa-submit-entry1/diversity-visa-photograph-requirements.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - File più grande di 240 KB, che il modulo di iscrizione rifiuta subito
  - Immagine non esattamente quadrata da 600 x 600 pixel
  - Altezza della testa fuori dal 50%-69% dell’altezza dell’immagine
  - Occhi fuori dalla fascia 56%-69% misurata dal bordo inferiore
  - Riutilizzo della foto di un’iscrizione di un anno precedente, che comporta la squalifica automatica
  - Una foto di una foto, o una scansione in cui si vede la grana della carta
faq:
  - q: Che dimensioni deve avere una foto per la lotteria DV?
    a: Esattamente 600 x 600 pixel, quadrata, e il file non deve superare i 240 KB.
  - q: Perché la mia foto viene rifiutata per la dimensione del file?
    a: Il modulo applica un tetto rigido di 240 KB. Questo strumento cerca la massima qualità JPEG che resta sotto quel limite, così il file passa senza sembrare troppo compresso.
  - q: Dove devono stare gli occhi?
    a: Tra il 56% e il 69% dell’altezza dell’immagine sopra il bordo inferiore, e la testa deve occupare tra il 50% e il 69% dell’altezza.
  - q: Posso riusare la foto dell’anno scorso?
    a: No. Una foto presentata nell’iscrizione di un anno precedente squalifica la nuova iscrizione. Serve una foto scattata negli ultimi sei mesi.
---

## Due limiti rigidi, e uno è la dimensione del file

Il modulo di iscrizione al visto per la diversità è più severo della maggior parte dei requisiti fotografici perché impone due cose in modo meccanico. L’immagine deve essere esattamente di 600 x 600 pixel e il file non deve superare i 240 KB. Se ne sbagli una, il modulo rifiuta il caricamento senza spiegare quale regola hai violato.

È il tetto sulla dimensione a far inciampare. Una foto pulita da 600 x 600 salvata alla massima qualità dalla maggior parte degli editor si assesta tra i 300 KB e i 600 KB, molto oltre il limite. Risalvarla a una qualità inferiore scelta a intuito o sfora ancora, o produce un’immagine visibilmente impastata.

Questo strumento cerca la risposta invece di indovinarla. Codifica la foto più volte, restringendo il campo alla massima qualità JPEG che sta ancora sotto i 240 KB, e ti dà così il file più bello che il modulo accetterà.

## Le regole di posizionamento

Dentro il quadrato la testa deve occupare tra il 50% e il 69% dell’altezza dell’immagine, misurata dalla base del mento alla sommità del capo. Gli occhi devono stare tra il 56% e il 69% dell’altezza sopra il bordo inferiore. Sono le stesse proporzioni del requisito per le foto di passaporto, espresse in percentuale invece che in pollici perché una foto DV è solo digitale.

Lo strumento misura il viso, poi calcola il ritaglio che colloca testa e occhi al centro di entrambe le fasce consentite.

## La squalifica che quasi nessuno conosce

Presentare una foto già usata nell’iscrizione DV di un anno precedente squalifica l’iscrizione. La foto deve essere stata scattata negli ultimi sei mesi e non deve essere stata presentata prima. Se hai partecipato l’anno scorso, fai una foto nuova.

## Privacy

Ogni passaggio avviene nel tuo browser tramite WebAssembly: rilevamento del volto, sostituzione dello sfondo, ritaglio e codifica. La tua fotografia non viene mai caricata su un server, cosa che qui conta più del solito, perché un’iscrizione DV è esattamente il tipo di pratica che attira siti fraudolenti che imitano quelli ufficiali.

Non c’è nulla da stampare. Scarica il JPEG da 600 x 600 e allegalo alla tua iscrizione.
