---
country: us
countryName: United States
document: dv-lottery
documentName: DV lottery photo
title: DV Lottery Photo Requirements (600x600 px, under 240KB)
description: Make a compliant Diversity Visa lottery photo in your browser. Exactly 600x600 pixels, under the 240KB limit, correct head and eye position. Nothing is uploaded.
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
  description: Plain white or off-white
  colors:
    - '#ffffff'
file:
  format: jpeg
  maxBytes: 245760
sourceUrl: https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-entry/diversity-visa-submit-entry1/diversity-visa-photograph-requirements.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - File larger than 240KB, which the entry form rejects outright
  - Image not exactly 600 x 600 pixels square
  - Head height outside 50% to 69% of the image height
  - Eyes outside the 56% to 69% band measured from the bottom edge
  - Reusing the photo from a previous year's entry, which is automatically disqualified
  - A photo of a photo, or a scan showing paper texture
faq:
  - q: What size does a DV lottery photo need to be?
    a: Exactly 600 x 600 pixels, square, and the file must be 240KB or smaller.
  - q: Why does my photo get rejected for file size?
    a: The entry form enforces a hard 240KB ceiling. This tool searches for the highest JPEG quality that still fits under it, so the file passes without looking over-compressed.
  - q: Where do my eyes need to be?
    a: Between 56% and 69% of the image height above the bottom edge, and your head must be between 50% and 69% of the image height.
  - q: Can I reuse last year's photo?
    a: No. A photo submitted in a previous year's entry disqualifies the new entry. You need a photo taken within the last six months.
---

## Two hard limits, and one of them is a file size

The Diversity Visa entry form is stricter than most photo requirements because it
enforces two things mechanically. The image must be exactly 600 x 600 pixels, and
the file must be 240KB or smaller. Miss either and the form refuses the upload,
with no explanation of which rule you broke.

The size ceiling is what trips people up. A clean 600 x 600 photo saved at full
quality from most editors lands somewhere between 300KB and 600KB, well over the
limit. Saving it again at a guessed lower quality either overshoots or produces a
visibly mushy image.

This tool searches for the answer instead of guessing. It encodes the photo
repeatedly, narrowing in on the highest JPEG quality that still fits under 240KB,
which gives you the best-looking file that the form will accept.

## The positioning rules

Inside the square, your head must occupy between 50% and 69% of the image height,
measured from the bottom of your chin to the top of your head. Your eyes must sit
between 56% and 69% of the image height above the bottom edge. These are the same
proportions the passport photo requirement uses, expressed as percentages rather
than inches because a DV photo is digital only.

The tool measures your face, then computes the crop that puts your head and eyes
at the centre of both permitted bands.

## The disqualification most people do not know about

Submitting a photo that was used in a previous year's DV entry disqualifies the
entry. The photo must have been taken within the last six months, and it must not
have been submitted before. If you entered last year, take a new photo.

## Privacy

Every step runs inside your browser through WebAssembly: face detection,
background replacement, cropping and encoding. Your photograph is never uploaded
to a server, which matters more than usual here, because a DV entry is exactly the
kind of document that attracts fraudulent copycat sites.

There is nothing to print. Download the 600 x 600 JPEG and attach it to your entry.
