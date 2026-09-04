---
country: schengen
countryName: Schengen Area
document: visa
documentName: Schengen visa photo
title: Schengen Visa Photo Size and Requirements (35x45 mm)
description: Create a compliant 35x45 mm Schengen visa photo in your browser. Correct 70-80% face height, light background and a printable sheet. Your photo never leaves your device.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 32
  maxMm: 36
background:
  description: Plain light grey or cream, evenly lit
  colors:
    - '#f0f0f0'
    - '#f5f0e6'
file:
  format: jpeg
sourceUrl: https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Face fills less than 70% or more than 80% of the frame height
  - A pure white background, which several consulates read as overexposed
  - Head tilted or turned rather than square to the camera
  - Hair covering the eyes or the outline of the face
  - Reflections or heavy frames if glasses are worn
  - Photo older than six months
faq:
  - q: What size is a Schengen visa photo?
    a: 35 mm wide by 45 mm tall. At 300 DPI that is 413 x 531 pixels.
  - q: How much of the photo should my face fill?
    a: Between 70% and 80% of the height, which works out to a head between 32 mm and 36 mm from chin to crown.
  - q: Should the background be white?
    a: Prefer plain light grey or cream. The requirement is a light, uniform, contrasting background, and a pure white one can be read as overexposed.
  - q: Does one photo work for every Schengen country?
    a: The 35x45 mm format and the 70-80% face rule are common to all of them, but individual consulates add their own notes. Check the consulate you are applying to.
---

## The rule that decides it: 70 to 80 percent

Every Schengen consulate works from the same photo format, 35 mm wide by 45 mm
tall, and the same central requirement: your face must fill 70% to 80% of the
frame height. In millimetres that is a head between 32 mm and 36 mm measured from
the bottom of the chin to the top of the head, hair included.

That band is narrower than it sounds. A crop that looks reasonable to the eye
frequently lands at 60% or 85%, and either one is grounds for rejection. It is
the most common reason Schengen photo submissions come back.

## Why not a white background

The published requirement is a light, uniform background that contrasts with the
face. Plain white technically satisfies "light", but in practice a white
background photographed with a bright flash loses the outline of light hair and
shoulders, and several consulates treat that as overexposed. Light grey or cream
is the safer read of the same rule, so this tool defaults to light grey.

## How this tool works

Upload any reasonably front-facing photo. The tool locates your chin, crown and
eye line, then computes the crop that lands your head at 34 mm, the middle of the
permitted range, giving the widest possible margin for measurement error. The
background is replaced with an even light grey.

If your source photo is cropped too tightly to produce a compliant result, the
tool tells you which edge is short rather than cropping in further and handing
you a photo that fails. Retake it standing further from the camera.

All processing happens in your browser through WebAssembly. Nothing is uploaded.

## Printing

A 35 x 45 mm photo tiles eight to a 4 x 6 inch print, four across and two down.
Download the sheet, have it printed as an ordinary photo, and cut along the guide
lines. Most consulates ask for two identical photos, so one sheet covers four
applications.
