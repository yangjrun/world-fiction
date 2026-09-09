---
country: ca
countryName: Canada
document: passport
documentName: Canadian passport photo
title: Free Online Canadian Passport Photo — 50x70 mm Requirements
description: Free 50x70 mm Canadian passport photo maker. Correct 31-36 mm face height, white background and a printable sheet. Works in your browser — nothing is uploaded.
output:
  kind: physical
  widthMm: 50
  heightMm: 70
  dpi: 300
headHeight:
  minMm: 31
  maxMm: 36
background:
  description: Plain white, uniform and shadow-free
  colors:
    - '#ffffff'
file:
  format: jpeg
sourceUrl: https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Face height outside the 31 mm to 36 mm range from chin to crown
  - Photo not printed on plain photographic paper with a matte or semi-matte finish
  - Missing the photographer's name, address and date on the back of one copy
  - A background that is not uniformly white, or shows a shadow behind the head
  - Reflection or glare on glasses obscuring the eyes
  - Photo taken more than twelve months before applying
faq:
  - q: What size is a Canadian passport photo?
    a: 50 mm wide by 70 mm tall, which is unusually tall compared with most countries. At 300 DPI that is 591 x 827 pixels.
  - q: How tall should my face be?
    a: Between 31 mm and 36 mm measured from the bottom of the chin to the crown of the head.
  - q: Do I need two photos?
    a: Yes. Two identical photos are required, and the back of one must carry the photographer's name, address and the date the photo was taken.
  - q: Can I submit a digital photo instead?
    a: No. Canadian passport applications require physical printed photos, so you do need to print the sheet.
---

## An unusual size, and why it matters

A Canadian passport photo is 50 mm wide by 70 mm tall. That 5:7 shape is
noticeably taller than the 35 x 45 mm format most of Europe uses and the 2 x 2
inch square the United States uses, and a photo made for either of those will not
work here. Inside the frame, your face must measure 31 mm to 36 mm from the
bottom of the chin to the crown of the head.

Because the frame is tall, the crop includes more of your shoulders than other
formats. If your source photo is cut off at the collar, there will not be enough
image to work with, and this tool will tell you so rather than stretching it.

## The requirement most people miss

Canada requires two identical photos, and the back of one of them must show the
photographer's name, the address and the date the photo was taken. A photo you
made yourself and printed at a counter has none of that written on it. Write it on
the back yourself before you submit: the requirement is the information, not a
commercial studio stamp.

Digital submission is not an option for Canadian passports, so printing is a
required step rather than a convenience.

## How this tool works

Upload a photo. The tool locates your chin, crown and eye line, then computes the
crop that places your face at 33.5 mm, the middle of the permitted range, leaving
the most room for measurement error. The background is replaced with uniform
white, which removes the shadow problems that cause a large share of rejections.

Processing happens entirely inside your browser using WebAssembly. Your photo is
not uploaded anywhere.

## Printing

A 50 x 70 mm photo fits four to a 4 x 6 inch print when turned a quarter turn,
which the tool does automatically. Download the sheet, have it printed on matte or
semi-matte photo paper, and cut along the guide lines. That gives you two pairs,
enough for this application and a spare.
