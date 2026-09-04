---
country: uk
countryName: United Kingdom
document: passport
documentName: UK passport photo
title: UK Passport Photo Size and Requirements (35x45 mm)
description: Make a compliant 35x45 mm UK passport photo in your browser. Correct 29-34 mm head height, plain light background and a printable sheet. Nothing is uploaded anywhere.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 29
  maxMm: 34
background:
  description: Plain cream or light grey, with no shadows
  colors:
    - '#f5f0e6'
    - '#f0f0f0'
file:
  format: jpeg
sourceUrl: https://www.gov.uk/photos-for-passports
sourceCheckedOn: 2026-09-03
status: needs-review
rejectionReasons:
  - Head outside the 29 mm to 34 mm range from chin to crown
  - Any shadow on the face or behind the head
  - Head covering worn without a religious or medical reason
  - Eyes obscured by hair, glasses frames or a glare on the lenses
  - Anything else visible in the frame, including a second person or a chair back
  - Photo taken more than one month before applying, if your appearance changed
faq:
  - q: What size is a UK passport photo?
    a: 35 mm wide by 45 mm tall. At 300 DPI that is 413 x 531 pixels.
  - q: How tall should my head be in the photo?
    a: Between 29 mm and 34 mm from the bottom of your chin to the top of your head, hair included.
  - q: Can I smile?
    a: No. HM Passport Office requires a neutral expression with your mouth closed.
  - q: Can I use this photo for the digital application?
    a: Yes. The digital route needs at least 600 x 750 pixels, and the file this tool produces exceeds that.
---

## What HM Passport Office measures

A UK passport photo is 35 mm wide and 45 mm tall, and the measurement that
matters inside it is head height: 29 mm to 34 mm from the bottom of your chin to
the top of your head, including hair. That is a 5 mm window on a 45 mm photo, so
a crop that is close by eye is often not close enough.

Note that this is a tighter and lower band than the Schengen visa format, even
though both use the same 35 x 45 mm outer size. A photo made for a Schengen visa
will usually be rejected for a UK passport, and the reverse is also true. If you
are applying for both, make two photos.

## Background and lighting

The requirement is a plain cream or light grey background with no shadows.
Shadows are the second most common failure after head size, and they usually come
from standing too close to a wall. Stand at least half a metre away from the
background and face a window rather than a ceiling light.

This tool replaces the background with an even fill, which removes shadow
problems behind the head. It cannot remove a shadow cast across your face, so
light yourself from the front when you take the original.

## How this tool works

Upload a photo. The tool finds your chin, crown and eye line, then computes the
crop that puts your head at 31.5 mm, the centre of the permitted range. If your
photo lacks the margin to make a compliant crop, it reports which edge falls
short rather than cropping tighter and producing a photo that fails.

Every step runs locally in your browser through WebAssembly. Your photo is never
uploaded.

## Printing or applying online

For a paper application, download the 4 x 6 inch sheet, which holds eight copies
of a 35 x 45 mm photo, and print it at any photo counter. For the online
application, download the single JPEG and upload it directly; it comfortably
exceeds the 600 x 750 pixel minimum.
