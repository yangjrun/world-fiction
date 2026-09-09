---
country: ca
countryName: Canada
document: passport
documentName: photo de passeport canadien
title: "Photo passeport canadienne gratuite en ligne : 50x70 mm"
description: Créez gratuitement une photo passeport canadienne 50x70 mm. Hauteur de visage 31-36 mm, fond blanc et planche imprimable. Tout dans votre navigateur, rien n'est envoyé.
output:
  kind: physical
  widthMm: 50
  heightMm: 70
  dpi: 300
headHeight:
  minMm: 31
  maxMm: 36
background:
  description: Blanc uni, uniforme et sans ombre
  colors:
    - '#ffffff'
file:
  format: jpeg
sourceUrl: https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Hauteur du visage hors de la plage de 31 mm à 36 mm du menton au sommet du crâne
  - Photo non imprimée sur papier photo ordinaire à finition mate ou semi-mate
  - Absence du nom, de l’adresse et de la date du photographe au dos d’un exemplaire
  - Un fond qui n’est pas uniformément blanc, ou une ombre derrière la tête
  - Reflet ou éblouissement sur les lunettes masquant les yeux
  - Photo prise plus de douze mois avant la demande
faq:
  - q: Quelle est la taille d’une photo de passeport canadien ?
    a: 50 mm de large sur 70 mm de haut, nettement plus haute que dans la plupart des pays. À 300 DPI cela fait 591 x 827 pixels.
  - q: Quelle hauteur mon visage doit-il avoir ?
    a: Entre 31 mm et 36 mm mesurés du bas du menton au sommet du crâne.
  - q: Ai-je besoin de deux photos ?
    a: Oui. Deux photos identiques sont exigées, et le dos de l’une doit porter le nom et l’adresse du photographe ainsi que la date de la prise de vue.
  - q: Puis-je envoyer une photo numérique à la place ?
    a: Non. Les demandes de passeport canadien exigent des photos imprimées, l’impression de la planche n’est donc pas évitable.
---

## Un format inhabituel, et pourquoi cela compte

Une photo de passeport canadien mesure 50 mm de large sur 70 mm de haut. Ce rapport 5:7 est nettement plus haut que le 35 x 45 mm employé dans la majeure partie de l’Europe et que le carré de 2 x 2 pouces des États-Unis : une photo faite pour l’un ou l’autre ne conviendra pas ici. Dans le cadre, votre visage doit mesurer de 31 mm à 36 mm du bas du menton au sommet du crâne.

Comme le cadre est haut, le recadrage inclut davantage de vos épaules que les autres formats. Si votre photo source est coupée au niveau du col, il n’y aura pas assez d’image, et cet outil vous le dira plutôt que de l’étirer.

## L’exigence que presque tout le monde oublie

Le Canada demande deux photos identiques, et le dos de l’une doit indiquer le nom du photographe, l’adresse et la date de la prise de vue. Une photo que vous avez faite vous-même et imprimée au comptoir ne porte rien de tout cela. Écrivez-le vous-même au dos avant de déposer votre demande : ce qui est exigé, c’est l’information, pas le tampon d’un studio commercial.

L’envoi numérique n’est pas une option pour les passeports canadiens : l’impression est donc une étape obligatoire et non un confort.

## Comment cet outil fonctionne

Chargez une photo. L’outil repère votre menton, le sommet de votre crâne et votre ligne des yeux, puis calcule le recadrage qui place votre visage à 33,5 mm, le milieu de la plage autorisée, ce qui laisse le plus de place à l’erreur de mesure. Le fond est remplacé par un blanc uniforme, ce qui élimine les problèmes d’ombre à l’origine d’une grande part des refus.

Le traitement se déroule entièrement dans votre navigateur via WebAssembly. Votre photo n’est envoyée nulle part.

## Impression

Une photo de 50 x 70 mm tient quatre fois sur un tirage de 4 x 6 pouces si on la tourne d’un quart de tour, ce que l’outil fait automatiquement. Téléchargez la planche, faites-la imprimer sur papier photo mat ou semi-mat, et coupez le long des lignes. Cela donne deux paires, de quoi couvrir cette demande et garder un exemplaire de secours.
