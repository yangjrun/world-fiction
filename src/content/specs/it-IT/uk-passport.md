---
country: uk
countryName: Regno Unito
document: passport
documentName: foto per passaporto britannico
title: "Foto per passaporto britannico: misure e requisiti (35x45 mm)"
description: Crea nel browser una foto per passaporto britannico di 35x45 mm conforme ai requisiti. Altezza della testa da 29 a 34 mm, sfondo chiaro e un foglio stampabile.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 29
  maxMm: 34
background:
  description: Crema o grigio chiaro uniforme, senza ombre
  colors:
    - '#f5f0e6'
    - '#f0f0f0'
file:
  format: jpeg
sourceUrl: https://www.gov.uk/photos-for-passports
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Testa fuori dall’intervallo da 29 mm a 34 mm dal mento alla sommità del capo
  - Qualsiasi ombra sul viso o dietro la testa
  - Copricapo indossato senza motivo religioso o medico
  - Occhi coperti dai capelli, dalla montatura degli occhiali o da un riflesso sulle lenti
  - Qualunque altra cosa visibile nell’inquadratura, compresa una seconda persona o lo schienale di una sedia
  - Foto scattata più di un mese prima della domanda, se il tuo aspetto è cambiato
faq:
  - q: Che misure ha una foto per passaporto britannico?
    a: 35 mm di larghezza per 45 mm di altezza. A 300 DPI sono 413 x 531 pixel.
  - q: Quanto deve essere alta la testa nella foto?
    a: Tra 29 mm e 34 mm dalla base del mento alla sommità del capo, capelli compresi.
  - q: Posso sorridere?
    a: No. L’HM Passport Office richiede un’espressione neutra con la bocca chiusa.
  - q: Posso usare questa foto per la domanda online?
    a: Sì. La via digitale richiede almeno 600 x 750 pixel, e il file prodotto da questo strumento supera quel minimo.
---

## Cosa misura l’HM Passport Office

Una foto per passaporto britannico è larga 35 mm e alta 45 mm, e la misura che conta al suo interno è l’altezza della testa: da 29 mm a 34 mm dalla base del mento alla sommità del capo, capelli compresi. È una finestra di 5 mm su una foto di 45 mm, quindi un ritaglio che a occhio sembra vicino spesso non lo è abbastanza.

Nota che questa fascia è più stretta e più bassa di quella del visto Schengen, anche se entrambi usano lo stesso formato esterno di 35 x 45 mm. Una foto fatta per un visto Schengen viene di solito respinta per un passaporto britannico, e vale anche il contrario. Se richiedi entrambi, fai due foto.

## Sfondo e illuminazione

Il requisito è uno sfondo uniforme crema o grigio chiaro senza ombre. Le ombre sono la seconda causa di bocciatura dopo la dimensione della testa, e nascono quasi sempre dallo stare troppo vicini a una parete. Mettiti almeno a mezzo metro dallo sfondo e rivolgiti verso una finestra invece che verso una luce a soffitto.

Questo strumento sostituisce lo sfondo con un riempimento uniforme, il che elimina i problemi di ombra dietro la testa. Non può rimuovere un’ombra proiettata sul viso, quindi al momento dello scatto illuminati di fronte.

## Come funziona questo strumento

Carica una foto. Lo strumento trova mento, sommità del capo e linea degli occhi, poi calcola il ritaglio che porta la testa a 31,5 mm, il centro dell’intervallo consentito. Se alla foto manca il margine per un ritaglio conforme, segnala quale bordo è troppo corto invece di ritagliare più stretto e produrre una foto che non passa.

Ogni passaggio avviene localmente nel tuo browser tramite WebAssembly. La tua foto non viene mai caricata.

## Stampare o fare domanda online

Per una domanda su carta, scarica il foglio da 4 x 6 pollici, che contiene otto copie di una foto da 35 x 45 mm, e fallo stampare a qualunque banco fotografico. Per la domanda online, scarica il singolo JPEG e caricalo direttamente: supera con ampio margine il minimo di 600 x 750 pixel.
