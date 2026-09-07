---
country: uk
countryName: Vereinigtes Königreich
document: passport
documentName: britisches Passfoto
title: "Britisches Passfoto: Größe und Vorgaben (35x45 mm)"
description: Erstellen Sie ein regelkonformes britisches Passfoto in 35x45 mm im Browser. Korrekte Kopfhöhe von 29-34 mm, heller Hintergrund und ein druckfertiger Bogen.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 29
  maxMm: 34
background:
  description: Einfarbig creme oder hellgrau, ohne Schatten
  colors:
    - '#f5f0e6'
    - '#f0f0f0'
file:
  format: jpeg
sourceUrl: https://www.gov.uk/photos-for-passports
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Kopf außerhalb des Bereichs von 29 mm bis 34 mm vom Kinn zum Scheitel
  - Jeder Schatten im Gesicht oder hinter dem Kopf
  - Kopfbedeckung ohne religiösen oder medizinischen Grund
  - Augen verdeckt von Haaren, Brillenrändern oder einer Blendung auf den Gläsern
  - Alles andere im Bild, auch eine zweite Person oder eine Stuhllehne
  - Foto mehr als einen Monat vor dem Antrag aufgenommen, wenn sich Ihr Aussehen geändert hat
faq:
  - q: Welche Größe hat ein britisches Passfoto?
    a: 35 mm breit und 45 mm hoch. Bei 300 DPI sind das 413 x 531 Pixel.
  - q: Wie hoch muss mein Kopf auf dem Foto sein?
    a: Zwischen 29 mm und 34 mm von der Kinnunterkante bis zum Scheitel, Haare eingeschlossen.
  - q: Darf ich lächeln?
    a: Nein. Das HM Passport Office verlangt einen neutralen Ausdruck mit geschlossenem Mund.
  - q: Kann ich dieses Foto für den Online-Antrag nutzen?
    a: Ja. Der digitale Weg braucht mindestens 600 x 750 Pixel, und die Datei aus diesem Werkzeug liegt darüber.
---

## Was das HM Passport Office misst

Ein britisches Passfoto ist 35 mm breit und 45 mm hoch, und das Maß, auf das es darin ankommt, ist die Kopfhöhe: 29 mm bis 34 mm von der Kinnunterkante bis zum Scheitel, Haare eingeschlossen. Das ist ein Fenster von 5 mm auf einem 45 mm hohen Foto, ein nach Augenmaß knapp passender Zuschnitt ist also oft nicht knapp genug.

Beachten Sie, dass dieses Band enger und tiefer liegt als beim Schengen-Visum, obwohl beide dasselbe Außenformat von 35 x 45 mm nutzen. Ein für ein Schengen-Visum gemachtes Foto wird für einen britischen Pass meist abgelehnt, und umgekehrt gilt dasselbe. Wenn Sie beides beantragen, machen Sie zwei Fotos.

## Hintergrund und Beleuchtung

Vorgeschrieben ist ein einfarbiger cremefarbener oder hellgrauer Hintergrund ohne Schatten. Schatten sind nach der Kopfgröße der zweithäufigste Fehler, und sie entstehen meist daraus, zu dicht an einer Wand zu stehen. Halten Sie mindestens einen halben Meter Abstand zum Hintergrund und wenden Sie sich einem Fenster zu, nicht einer Deckenlampe.

Dieses Werkzeug ersetzt den Hintergrund durch eine gleichmäßige Fläche, was Schattenprobleme hinter dem Kopf beseitigt. Einen Schatten, der über Ihr Gesicht fällt, kann es nicht entfernen; leuchten Sie sich bei der Aufnahme also von vorn aus.

## Wie dieses Werkzeug arbeitet

Laden Sie ein Foto hoch. Das Werkzeug findet Kinn, Scheitel und Augenlinie und berechnet dann den Zuschnitt, der Ihren Kopf auf 31,5 mm setzt, die Mitte des erlaubten Bereichs. Fehlt Ihrem Foto der Rand für einen regelkonformen Zuschnitt, meldet es die zu kurze Kante, statt enger zu schneiden und ein Foto zu erzeugen, das durchfällt.

Jeder Schritt läuft lokal in Ihrem Browser über WebAssembly. Ihr Foto wird nie hochgeladen.

## Drucken oder online beantragen

Für einen Papierantrag laden Sie den Bogen im Format 4 x 6 Zoll herunter, auf dem acht Abzüge eines 35 x 45 mm großen Fotos Platz haben, und lassen ihn an jedem Fotoschalter drucken. Für den Online-Antrag laden Sie das einzelne JPEG herunter und laden es direkt hoch; es übertrifft die Mindestgröße von 600 x 750 Pixeln deutlich.
