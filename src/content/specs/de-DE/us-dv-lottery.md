---
country: us
countryName: Vereinigte Staaten
document: dv-lottery
documentName: Foto für die DV-Lotterie
title: "DV-Lotteriefoto gratis online: 600x600 px, unter 240 KB"
description: "Gratis DV-Lotteriefoto online: genau 600x600 px, unter 240 KB, weißer Hintergrund, Kopf- und Augenposition korrekt. Läuft komplett im Browser – nichts wird hochgeladen."
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
  description: Reinweiß oder gebrochenes Weiß
  colors:
    - '#ffffff'
file:
  format: jpeg
  maxBytes: 245760
sourceUrl: https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-entry/diversity-visa-submit-entry1/diversity-visa-photograph-requirements.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Datei größer als 240 KB, was das Anmeldeformular sofort zurückweist
  - Bild nicht genau 600 x 600 Pixel quadratisch
  - Kopfhöhe außerhalb von 50% bis 69% der Bildhöhe
  - Augen außerhalb des Bandes von 56% bis 69%, gemessen von der Unterkante
  - Wiederverwendung des Fotos aus der Anmeldung eines Vorjahres, was automatisch disqualifiziert
  - Ein Foto eines Fotos oder ein Scan, auf dem die Papierstruktur zu sehen ist
faq:
  - q: Welche Größe muss ein Foto für die DV-Lotterie haben?
    a: Genau 600 x 600 Pixel, quadratisch, und die Datei darf höchstens 240 KB groß sein.
  - q: Warum wird mein Foto wegen der Dateigröße abgelehnt?
    a: Das Anmeldeformular erzwingt eine harte Grenze von 240 KB. Dieses Werkzeug sucht die höchste JPEG-Qualität, die noch darunter bleibt, damit die Datei durchgeht, ohne überkomprimiert auszusehen.
  - q: Wo müssen meine Augen liegen?
    a: Zwischen 56% und 69% der Bildhöhe über der Unterkante, und Ihr Kopf muss zwischen 50% und 69% der Bildhöhe einnehmen.
  - q: Kann ich das Foto vom letzten Jahr wiederverwenden?
    a: Nein. Ein in der Anmeldung eines Vorjahres eingereichtes Foto disqualifiziert die neue Anmeldung. Sie brauchen ein Foto aus den letzten sechs Monaten.
---

## Zwei harte Grenzen, und eine davon ist eine Dateigröße

Das Anmeldeformular für das Diversity-Visum ist strenger als die meisten Fotovorgaben, weil es zwei Dinge maschinell erzwingt. Das Bild muss genau 600 x 600 Pixel groß sein, und die Datei darf höchstens 240 KB haben. Verfehlen Sie eines von beiden, verweigert das Formular den Upload, ohne zu erklären, welche Regel Sie gebrochen haben.

Die Grenze bei der Größe ist es, worüber die meisten stolpern. Ein sauberes Foto mit 600 x 600 Pixeln, aus den meisten Programmen in voller Qualität gespeichert, landet irgendwo zwischen 300 KB und 600 KB und damit weit über dem Limit. Speichert man es mit geratener niedrigerer Qualität erneut, schießt man entweder darüber hinaus oder erzeugt ein sichtbar matschiges Bild.

Dieses Werkzeug sucht die Antwort statt zu raten. Es kodiert das Foto mehrfach und nähert sich der höchsten JPEG-Qualität, die noch unter 240 KB bleibt, was Ihnen die bestaussehende Datei gibt, die das Formular akzeptiert.

## Die Regeln zur Positionierung

Innerhalb des Quadrats muss Ihr Kopf zwischen 50% und 69% der Bildhöhe einnehmen, gemessen von der Kinnunterkante bis zum Scheitel. Ihre Augen müssen zwischen 56% und 69% der Bildhöhe über der Unterkante liegen. Es sind die gleichen Verhältnisse wie bei der Passfoto-Vorgabe, nur in Prozent statt in Zoll ausgedrückt, weil ein DV-Foto ausschließlich digital ist.

Das Werkzeug vermisst Ihr Gesicht und berechnet dann den Zuschnitt, der Kopf und Augen in die Mitte beider erlaubten Bänder setzt.

## Der Ausschlussgrund, von dem die meisten nichts wissen

Ein Foto einzureichen, das in der DV-Anmeldung eines Vorjahres verwendet wurde, disqualifiziert die Anmeldung. Das Foto muss in den letzten sechs Monaten aufgenommen worden sein und darf nicht vorher eingereicht worden sein. Wenn Sie letztes Jahr teilgenommen haben, machen Sie ein neues Foto.

## Datenschutz

Jeder Schritt läuft über WebAssembly in Ihrem Browser: Gesichtserkennung, Hintergrundersetzung, Zuschnitt und Kodierung. Ihr Foto wird nie auf einen Server geladen, was hier mehr zählt als sonst, denn eine DV-Anmeldung ist genau die Art von Vorgang, die betrügerische Nachahmerseiten anzieht.

Es gibt nichts zu drucken. Laden Sie das JPEG mit 600 x 600 Pixeln herunter und hängen Sie es an Ihre Anmeldung.
