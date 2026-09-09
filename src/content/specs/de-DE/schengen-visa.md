---
country: schengen
countryName: Schengen-Raum
document: visa
documentName: Schengen-Visumfoto
title: "Schengen-Visumfoto online gratis: 35x45 mm und Vorgaben"
description: "Gratis Schengen-Visumfoto online: 35x45 mm, Gesichtshöhe von 70-80%, heller Hintergrund und ein Druckbogen. Läuft komplett im Browser – nichts wird hochgeladen."
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 32
  maxMm: 36
background:
  description: Einfarbig hellgrau oder creme, gleichmäßig ausgeleuchtet
  colors:
    - '#f0f0f0'
    - '#f5f0e6'
file:
  format: jpeg
sourceUrl: https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Gesicht füllt weniger als 70% oder mehr als 80% der Bildhöhe
  - Ein reinweißer Hintergrund, den mehrere Konsulate als überbelichtet lesen
  - Kopf geneigt oder gedreht statt frontal zur Kamera
  - Haare, die die Augen oder die Gesichtskontur verdecken
  - Spiegelungen oder breite Ränder, wenn eine Brille getragen wird
  - Foto älter als sechs Monate
faq:
  - q: Welche Größe hat ein Schengen-Visumfoto?
    a: 35 mm breit und 45 mm hoch. Bei 300 DPI sind das 413 x 531 Pixel.
  - q: Wie viel vom Foto soll mein Gesicht ausfüllen?
    a: Zwischen 70% und 80% der Höhe, was einem Kopf von 32 mm bis 36 mm vom Kinn zum Scheitel entspricht.
  - q: Soll der Hintergrund weiß sein?
    a: Besser einfarbig hellgrau oder creme. Verlangt wird ein heller, gleichmäßiger, kontrastierender Hintergrund, und ein reinweißer kann als überbelichtet gelesen werden.
  - q: Funktioniert ein Foto für jedes Schengen-Land?
    a: Das Format 35x45 mm und die Regel von 70-80% Gesichtshöhe gelten überall, doch einzelne Konsulate ergänzen eigene Hinweise. Prüfen Sie das Konsulat, bei dem Sie beantragen.
---

## Die Regel, die entscheidet: 70 bis 80 Prozent

Jedes Schengen-Konsulat arbeitet mit demselben Fotoformat, 35 mm breit und 45 mm hoch, und derselben zentralen Vorgabe: Ihr Gesicht muss 70% bis 80% der Bildhöhe ausfüllen. In Millimetern ist das ein Kopf von 32 mm bis 36 mm, gemessen von der Kinnunterkante bis zum Scheitel, Haare eingeschlossen.

Dieses Band ist enger, als es klingt. Ein Zuschnitt, der dem Auge vernünftig erscheint, landet häufig bei 60% oder 85%, und beides ist ein Ablehnungsgrund. Es ist der häufigste Grund, aus dem eingereichte Schengen-Fotos zurückkommen.

## Warum kein weißer Hintergrund

Vorgeschrieben ist ein heller, gleichmäßiger Hintergrund, der sich vom Gesicht abhebt. Reinweiß erfüllt streng genommen hell, doch in der Praxis verliert ein mit hellem Blitz fotografierter weißer Hintergrund die Kontur heller Haare und Schultern, und mehrere Konsulate behandeln das als überbelichtet. Hellgrau oder creme ist die sicherere Lesart derselben Regel, deshalb ist Hellgrau hier die Voreinstellung.

## Wie dieses Werkzeug arbeitet

Laden Sie ein einigermaßen frontales Foto hoch. Das Werkzeug bestimmt Kinn, Scheitel und Augenlinie und berechnet dann den Zuschnitt, der Ihren Kopf auf 34 mm bringt, die Mitte des erlaubten Bereichs, was den weitesten Spielraum für Messfehler lässt. Der Hintergrund wird durch gleichmäßiges Hellgrau ersetzt.

Ist Ihr Ausgangsfoto zu eng zugeschnitten für ein regelkonformes Ergebnis, nennt das Werkzeug die zu kurze Kante, statt weiter hineinzuschneiden und Ihnen ein Foto zu geben, das durchfällt. Nehmen Sie es mit größerem Abstand zur Kamera neu auf.

Die gesamte Verarbeitung läuft über WebAssembly in Ihrem Browser. Es wird nichts hochgeladen.

## Drucken

Ein Foto von 35 x 45 mm passt achtmal auf einen Abzug von 4 x 6 Zoll, viermal quer und zweimal hoch. Laden Sie den Bogen herunter, lassen Sie ihn als gewöhnliches Foto drucken und schneiden Sie an den Hilfslinien. Die meisten Konsulate verlangen zwei identische Fotos, ein Bogen deckt also vier Anträge.
