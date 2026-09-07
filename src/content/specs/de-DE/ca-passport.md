---
country: ca
countryName: Kanada
document: passport
documentName: kanadisches Passfoto
title: "Kanadisches Passfoto: Größe und Vorgaben (50x70 mm)"
description: Erstellen Sie ein regelkonformes kanadisches Passfoto in 50x70 mm im Browser. Korrekte Gesichtshöhe von 31-36 mm, weißer Hintergrund und ein druckfertiger Bogen.
output:
  kind: physical
  widthMm: 50
  heightMm: 70
  dpi: 300
headHeight:
  minMm: 31
  maxMm: 36
background:
  description: Reinweiß, gleichmäßig und ohne Schatten
  colors:
    - '#ffffff'
file:
  format: jpeg
sourceUrl: https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Gesichtshöhe außerhalb des Bereichs von 31 mm bis 36 mm vom Kinn zum Scheitel
  - Foto nicht auf einfachem Fotopapier mit mattem oder seidenmattem Finish gedruckt
  - Auf der Rückseite eines Abzugs fehlen Name, Adresse und Datum des Fotografen
  - Ein Hintergrund, der nicht gleichmäßig weiß ist, oder ein Schatten hinter dem Kopf
  - Spiegelung oder Blendung auf der Brille, die die Augen verdeckt
  - Foto mehr als zwölf Monate vor dem Antrag aufgenommen
faq:
  - q: Welche Größe hat ein kanadisches Passfoto?
    a: 50 mm breit und 70 mm hoch, ungewöhnlich hoch im Vergleich zu den meisten Ländern. Bei 300 DPI sind das 591 x 827 Pixel.
  - q: Wie hoch muss mein Gesicht sein?
    a: Zwischen 31 mm und 36 mm, gemessen von der Kinnunterkante bis zum Scheitel.
  - q: Brauche ich zwei Fotos?
    a: Ja. Zwei identische Fotos sind erforderlich, und die Rückseite eines davon muss Name und Adresse des Fotografen sowie das Aufnahmedatum tragen.
  - q: Kann ich stattdessen ein digitales Foto einreichen?
    a: Nein. Kanadische Passanträge verlangen gedruckte Fotos, das Drucken des Bogens lässt sich also nicht umgehen.
---

## Ein ungewöhnliches Format, und warum das zählt

Ein kanadisches Passfoto ist 50 mm breit und 70 mm hoch. Dieses Verhältnis von 5:7 ist deutlich höher als die 35 x 45 mm, die der größte Teil Europas verwendet, und als das Quadrat von 2 x 2 Zoll in den USA; ein für eines dieser Formate gemachtes Foto funktioniert hier nicht. Innerhalb des Rahmens muss Ihr Gesicht von der Kinnunterkante bis zum Scheitel 31 mm bis 36 mm messen.

Weil der Rahmen hoch ist, umfasst der Zuschnitt mehr von Ihren Schultern als andere Formate. Ist Ihr Ausgangsfoto am Kragen abgeschnitten, fehlt Bildmaterial, und dieses Werkzeug sagt es Ihnen, anstatt zu verzerren.

## Die Vorgabe, die die meisten übersehen

Kanada verlangt zwei identische Fotos, und die Rückseite eines davon muss Name und Adresse des Fotografen sowie das Aufnahmedatum zeigen. Auf einem Foto, das Sie selbst gemacht und am Schalter gedruckt haben, steht davon nichts. Schreiben Sie es vor der Einreichung selbst auf die Rückseite: Verlangt wird die Information, nicht der Stempel eines gewerblichen Studios.

Eine digitale Einreichung ist für kanadische Pässe nicht möglich, Drucken ist hier also ein notwendiger Schritt und keine Bequemlichkeit.

## Wie dieses Werkzeug arbeitet

Laden Sie ein Foto hoch. Das Werkzeug bestimmt Kinn, Scheitel und Augenlinie und berechnet dann den Zuschnitt, der Ihr Gesicht auf 33,5 mm setzt, die Mitte des erlaubten Bereichs, was den größten Spielraum für Messfehler lässt. Der Hintergrund wird durch gleichmäßiges Weiß ersetzt, was die Schattenprobleme beseitigt, die einen großen Teil der Ablehnungen verursachen.

Die Verarbeitung findet über WebAssembly vollständig in Ihrem Browser statt. Ihr Foto wird nirgends hochgeladen.

## Drucken

Ein Foto von 50 x 70 mm passt viermal auf einen Abzug von 4 x 6 Zoll, wenn man es um eine Vierteldrehung dreht, was das Werkzeug automatisch tut. Laden Sie den Bogen herunter, lassen Sie ihn auf mattem oder seidenmattem Fotopapier drucken und schneiden Sie an den Hilfslinien. Das ergibt zwei Paare, genug für diesen Antrag und ein Ersatzfoto.
