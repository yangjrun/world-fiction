---
country: us
countryName: Vereinigte Staaten
document: passport
documentName: US-Passfoto
title: "US-Passfoto: Größe und Vorgaben (2x2 Zoll)"
description: Erstellen Sie ein regelkonformes 2x2-Zoll-Passfoto für die USA im Browser. Korrekte Kopfhöhe, Augenlinie und weißer Hintergrund, plus druckfertiger 4x6-Bogen.
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
  description: Reinweiß oder gebrochenes Weiß
  colors:
    - '#ffffff'
    - '#fafafa'
file:
  format: jpeg
sourceUrl: https://travel.state.gov/content/travel/en/passports/how-apply/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Kopf zu groß oder zu klein, der häufigste einzelne Ablehnungsgrund
  - Schatten im Gesicht oder auf dem Hintergrund hinter dem Kopf
  - Brille auf dem Foto, die seit 2016 nicht mehr akzeptiert wird
  - Ein gemusterter, farbiger oder zu dunkler Hintergrund
  - Sichtbares Lächeln mit Zähnen statt eines neutralen Ausdrucks
  - Ein Foto, das älter als sechs Monate ist oder schon im vorigen Pass verwendet wurde
faq:
  - q: Welche Größe hat ein US-Passfoto?
    a: Genau 2 x 2 Zoll, also 51 x 51 mm. Bei 300 DPI sind das 600 x 600 Pixel.
  - q: Wie hoch muss mein Kopf sein?
    a: Von der Kinnunterkante bis zum Scheitel gemessen zwischen 1 Zoll und 1 3/8 Zoll (25 mm bis 35 mm). Die Augen müssen 1 1/8 bis 1 3/8 Zoll über der Unterkante liegen.
  - q: Darf ich eine Brille tragen?
    a: Nein. Brillen sind auf US-Passfotos seit November 2016 nicht mehr erlaubt, außer mit einer unterschriebenen ärztlichen Bescheinigung.
  - q: Kann ich das im Drogeriemarkt ausdrucken lassen?
    a: Ja. Laden Sie den 4x6-Zoll-Bogen mit sechs Abzügen herunter, lassen Sie ihn an jedem Fotoschalter als normales Foto drucken und schneiden Sie an den Hilfslinien.
---

## Was das US-Außenministerium tatsächlich prüft

Ein US-Passfoto ist ein Quadrat von 2 x 2 Zoll, und über das Bestehen entscheiden zwei Maße innerhalb dieses Quadrats. Ihr Kopf muss, von der Kinnunterkante bis zum Scheitel einschließlich der Haare gemessen, zwischen 1 Zoll und 1 3/8 Zoll hoch sein. Ihre Augen müssen zwischen 1 1/8 und 1 3/8 Zoll über der Unterkante liegen.

Diese zwei Regeln sind der Grund, warum so viele selbst gemachte Passfotos zurückkommen. Man schneidet auf ein 2 x 2 großes Quadrat zu, was leicht ist, und liegt dann bei der Kopfgröße daneben, was nicht leicht ist. Ein Foto kann perfekt quadratisch und perfekt beleuchtet sein und trotzdem durchfallen, weil das Gesicht zu viel vom Bild einnimmt.

## Wie dieses Werkzeug Ihr Foto positioniert

Laden Sie ein Foto, und das Werkzeug findet Kinn, Scheitel und Augenlinie und rechnet dann rückwärts: Es berechnet den Zuschnitt, der Ihren Kopf in die Mitte des erlaubten Größenbereichs und Ihre Augen in die Mitte des erlaubten Bandes setzt. Die Mitte statt des Rands anzuvisieren lässt Raum für die kleinen Fehler, die jede automatische Messung macht.

Hat Ihr Ausgangsfoto zu wenig Platz um den Kopf, um einen regelkonformen Zuschnitt zu erlauben, sagt das Werkzeug es und nennt die zu kurze Kante, statt enger zu schneiden und Ihnen still etwas zu geben, das am Schalter abgelehnt wird. Treten Sie in diesem Fall weiter zurück und fotografieren Sie neu.

Der Hintergrund wird durch Reinweiß ersetzt. Alles läuft über WebAssembly in Ihrem Browser, Ihr Foto wird also nie auf einen Server geladen und verlässt Ihr Gerät nicht.

## Drucken zu Hause oder am Schalter

Der günstigste Weg ist ein Abzug im Format 4 x 6 Zoll. Ein 2 x 2 Zoll großes Foto passt genau dreimal quer und zweimal hoch auf 4 x 6, ein einziger Abzug liefert also sechs Passfotos zum Preis eines Schnappschusses. Laden Sie den Bogen herunter, geben Sie ihn an einem Fotoschalter ab oder drucken Sie ihn randlos zu Hause, und schneiden Sie an den Hilfslinien.

Für eine Online-Verlängerung müssen Sie nichts drucken. Laden Sie das einzelne JPEG mit 600 x 600 Pixeln herunter und laden Sie es direkt hoch.
