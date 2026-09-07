---
country: schengen
countryName: Area Schengen
document: visa
documentName: foto per visto Schengen
title: "Foto per visto Schengen: misure e requisiti (35x45 mm)"
description: Crea nel browser una foto per visto Schengen di 35x45 mm conforme ai requisiti. Viso al 70-80% dell’altezza, sfondo chiaro e un foglio stampabile.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 32
  maxMm: 36
background:
  description: Grigio chiaro o crema uniforme, illuminato in modo omogeneo
  colors:
    - '#f0f0f0'
    - '#f5f0e6'
file:
  format: jpeg
sourceUrl: https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Il viso occupa meno del 70% o più dell’80% dell’altezza dell’inquadratura
  - Uno sfondo bianco puro, che diversi consolati leggono come sovraesposto
  - Testa inclinata o girata invece che frontale rispetto alla fotocamera
  - Capelli che coprono gli occhi o il contorno del viso
  - Riflessi o montature spesse se si portano occhiali
  - Foto più vecchia di sei mesi
faq:
  - q: Che misure ha una foto per visto Schengen?
    a: 35 mm di larghezza per 45 mm di altezza. A 300 DPI sono 413 x 531 pixel.
  - q: Quanta parte della foto deve occupare il viso?
    a: Tra il 70% e l’80% dell’altezza, che corrisponde a una testa da 32 mm a 36 mm dal mento alla sommità del capo.
  - q: Lo sfondo deve essere bianco?
    a: Meglio grigio chiaro o crema uniforme. Il requisito è uno sfondo chiaro, uniforme e in contrasto, e uno bianco puro può essere letto come sovraesposto.
  - q: Una sola foto va bene per tutti i paesi Schengen?
    a: Il formato 35x45 mm e la regola del 70-80% sono comuni a tutti, ma ogni consolato aggiunge indicazioni proprie. Controlla il consolato a cui presenti la domanda.
---

## La regola che decide: dal 70 all’80 per cento

Tutti i consolati Schengen lavorano con lo stesso formato di foto, 35 mm di larghezza per 45 mm di altezza, e con lo stesso requisito centrale: il viso deve occupare dal 70% all’80% dell’altezza dell’inquadratura. In millimetri è una testa tra 32 mm e 36 mm misurata dalla base del mento alla sommità del capo, capelli compresi.

Quella fascia è più stretta di quanto sembri. Un ritaglio che a occhio pare ragionevole finisce spesso al 60% o all’85%, e in entrambi i casi è motivo di rifiuto. È la ragione più frequente per cui le foto Schengen tornano indietro.

## Perché non uno sfondo bianco

Il requisito pubblicato è uno sfondo chiaro e uniforme che contrasti con il viso. Il bianco puro soddisfa tecnicamente la parola chiaro, ma in pratica uno sfondo bianco fotografato con un flash forte perde il contorno dei capelli chiari e delle spalle, e diversi consolati lo trattano come sovraesposto. Il grigio chiaro o il crema è la lettura più prudente della stessa regola, quindi questo strumento usa per impostazione predefinita il grigio chiaro.

## Come funziona questo strumento

Carica una foto ragionevolmente frontale. Lo strumento individua mento, sommità del capo e linea degli occhi, poi calcola il ritaglio che porta la testa a 34 mm, il centro dell’intervallo consentito, lasciando il margine più ampio possibile all’errore di misura. Lo sfondo viene sostituito con un grigio chiaro uniforme.

Se la foto di partenza è ritagliata troppo stretta per produrre un risultato conforme, lo strumento ti dice quale bordo è corto invece di ritagliare ancora e consegnarti una foto che non passa. Rifalla stando più lontano dalla fotocamera.

Tutta l’elaborazione avviene nel tuo browser tramite WebAssembly. Non viene caricato nulla.

## Stampa

Una foto da 35 x 45 mm entra otto volte in una stampa da 4 x 6 pollici, quattro in larghezza e due in altezza. Scarica il foglio, fallo stampare come una foto normale e taglia lungo le linee. La maggior parte dei consolati chiede due foto identiche, quindi un foglio copre quattro domande.
