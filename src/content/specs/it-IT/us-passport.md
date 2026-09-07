---
country: us
countryName: Stati Uniti
document: passport
documentName: foto per passaporto statunitense
title: "Foto per passaporto USA: misure e requisiti (2x2 pollici)"
description: Crea nel browser una foto per passaporto statunitense di 2x2 pollici conforme ai requisiti. Altezza della testa, linea degli occhi e sfondo bianco corretti.
output:
  kind: physical
  widthMm: 50.8
  heightMm: 50.8
  dpi: 300
headHeight:
  minMm: 25.4
  maxMm: 34.925
eyeLine:
  minMmFromBottom: 28.575
  maxMmFromBottom: 34.925
background:
  description: Bianco pieno o bianco sporco
  colors:
    - '#ffffff'
    - '#fafafa'
file:
  format: jpeg
sourceUrl: https://travel.state.gov/content/travel/en/passports/how-apply/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Testa troppo grande o troppo piccola, da sola la causa di rifiuto più frequente
  - Ombre sul viso o sullo sfondo dietro la testa
  - Occhiali indossati nella foto, non più accettati dal 2016
  - Uno sfondo fantasia, colorato o troppo scuro
  - Sorriso visibile con i denti, invece di un’espressione neutra
  - Una foto più vecchia di sei mesi, o già usata su un passaporto precedente
faq:
  - q: Che misure ha una foto per passaporto statunitense?
    a: Esattamente 2 x 2 pollici, cioè 51 x 51 mm. A 300 DPI sono 600 x 600 pixel.
  - q: Quanto deve essere alta la mia testa?
    a: Misurata dalla base del mento alla sommità del capo, tra 1 pollice e 1 3/8 di pollice (da 25 mm a 35 mm). Gli occhi devono stare tra 1 1/8 e 1 3/8 di pollice sopra il bordo inferiore.
  - q: Posso portare gli occhiali?
    a: No. Gli occhiali non sono più ammessi nelle foto per passaporto statunitense da novembre 2016, salvo con un certificato medico firmato.
  - q: Posso stamparla in un negozio?
    a: Sì. Scarica il foglio da 4x6 pollici, che contiene sei copie, fallo stampare come una foto normale a qualunque banco e taglia lungo le linee di taglio.
---

## Cosa controlla davvero il Dipartimento di Stato

Una foto per passaporto statunitense è un quadrato di 2 x 2 pollici, e sono due misure all’interno di quel quadrato a decidere se passa. La testa, misurata dalla base del mento alla sommità del capo capelli compresi, deve stare tra 1 pollice e 1 3/8 di pollice. Gli occhi devono cadere tra 1 1/8 e 1 3/8 di pollice sopra il bordo inferiore.

Sono queste due regole a spiegare perché tornano respinte tante foto per passaporto fatte in casa. Si ritaglia un quadrato di 2 x 2, cosa facile, e poi si sbaglia la dimensione della testa, cosa che non lo è. Una foto può essere perfettamente quadrata e perfettamente illuminata e non passare comunque, perché il viso occupa troppo dell’inquadratura.

## Come questo strumento posiziona la tua foto

Carica una foto e lo strumento individua mento, sommità del capo e linea degli occhi, poi ragiona all’indietro: calcola il ritaglio che colloca la testa al centro dell’intervallo di dimensioni consentito e gli occhi al centro della fascia consentita. Mirare al centro anziché al bordo lascia margine per i piccoli errori che qualunque misurazione automatica commette.

Se la foto originale non ha abbastanza spazio attorno alla testa perché esista un ritaglio conforme, lo strumento lo dice e indica quale bordo manca, invece di ritagliare più stretto e consegnarti in silenzio qualcosa che verrà respinto allo sportello. In quel caso allontanati e rifai la foto.

Lo sfondo viene sostituito con bianco pieno. Tutto avviene nel tuo browser tramite WebAssembly, quindi la tua foto non viene mai caricata su un server e non esce dal tuo dispositivo.

## Stampare a casa o al banco

La via più economica è una stampa fotografica da 4 x 6 pollici. Una foto di 2 x 2 pollici entra esattamente tre volte in larghezza e due in altezza su 4 x 6, quindi una sola stampa dà sei foto per passaporto al prezzo di una normale. Scarica il foglio, portalo a un banco fotografico o stampalo senza bordi a casa, poi taglia lungo le linee.

Per un rinnovo online non serve stampare nulla. Scarica il singolo JPEG da 600 x 600 pixel e caricalo direttamente.
