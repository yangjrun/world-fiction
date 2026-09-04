---
country: cn
countryName: China
document: visa
documentName: Chinese visa photo
title: China Visa Photo Size and Requirements (33x48 mm)
description: Create a compliant 33x48 mm Chinese visa photo in your browser, with the correct head height and plain white background. Nothing is uploaded.
output:
  kind: physical
  widthMm: 33
  heightMm: 48
  dpi: 300
headHeight:
  minMm: 28
  maxMm: 33
background:
  description: Plain white, no border
  colors:
    - '#ffffff'
file:
  format: jpeg
sourceUrl: http://cs.mfa.gov.cn/
sourceCheckedOn: 2026-09-03
status: needs-review
rejectionReasons:
  - Head height outside the permitted range from chin to crown
  - Background that is not plain white, or a photo printed with a white border
  - Glasses with heavy frames or any glare on the lenses
  - Head covering, other than for religious reasons
faq:
  - q: What size is a Chinese visa photo?
    a: 33 mm wide by 48 mm tall.
---

## This page is not published yet

The numbers in this file have not been checked against an official source by a
human, so `status` is `needs-review` and the build skips it. Verify the frame
size, the head height range and the digital pixel and file-size limits against
the National Immigration Administration and the relevant embassy page, set
`sourceUrl` to the exact page the numbers came from, update `sourceCheckedOn`,
then change `status` to `verified`.

Two things specifically need confirming. First, whether the current online
application accepts the same 33 x 48 mm proportions as the printed photo, and what
the digital pixel range and file-size limits are. Second, whether the head-height
range published for a visa photo differs from the one published for a Chinese
passport photo, since the two are often confused.

Worth noting for prioritisation: the search demand for this page is almost
entirely in English, from people outside China applying for a Chinese visa. It is
a Tier 1 traffic page despite being about Chinese requirements.
