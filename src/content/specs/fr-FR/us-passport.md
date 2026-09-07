---
country: us
countryName: États-Unis
document: passport
documentName: photo de passeport américain
title: "Photo de passeport américain : taille et normes (2x2 pouces)"
description: Créez une photo de passeport américain conforme de 2x2 pouces dans votre navigateur. Hauteur de tête, ligne des yeux et fond blanc corrects, plus une planche 4x6.
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
  description: Blanc uni ou blanc cassé
  colors:
    - '#ffffff'
    - '#fafafa'
file:
  format: jpeg
sourceUrl: https://travel.state.gov/content/travel/en/passports/how-apply/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Tête trop grande ou trop petite, le motif de refus le plus fréquent à lui seul
  - Ombres sur le visage ou sur le fond derrière la tête
  - Lunettes portées sur la photo, ce qui n’est plus accepté depuis 2016
  - Un fond à motifs, coloré ou trop sombre
  - Sourire visible montrant les dents, au lieu d’une expression neutre
  - Une photo de plus de six mois, ou déjà utilisée sur un passeport précédent
faq:
  - q: Quelle est la taille d’une photo de passeport américain ?
    a: Exactement 2 x 2 pouces, soit 51 x 51 mm. À 300 DPI cela fait 600 x 600 pixels.
  - q: Quelle hauteur ma tête doit-elle avoir ?
    a: Mesurée du bas du menton au sommet du crâne, entre 1 pouce et 1 3/8 pouce (25 mm à 35 mm). Vos yeux doivent se situer entre 1 1/8 et 1 3/8 pouce au-dessus du bord inférieur.
  - q: Puis-je porter des lunettes ?
    a: Non. Les lunettes ne sont plus autorisées sur les photos de passeport américain depuis novembre 2016, sauf avec un certificat médical signé.
  - q: Puis-je faire imprimer cela en magasin ?
    a: Oui. Téléchargez la planche de 4x6 pouces, qui contient six exemplaires, faites-la imprimer comme une photo ordinaire à n’importe quel comptoir, puis coupez le long des lignes.
---

## Ce que le département d’État vérifie réellement

Une photo de passeport américain est un carré de 2 x 2 pouces, et deux mesures à l’intérieur de ce carré décident si elle passe. Votre tête, mesurée du bas du menton au sommet du crâne cheveux compris, doit faire entre 1 pouce et 1 3/8 pouce. Vos yeux doivent tomber entre 1 1/8 et 1 3/8 pouce au-dessus du bord inférieur.

Ces deux règles expliquent pourquoi tant de photos de passeport faites soi-même reviennent refusées. On recadre en carré de 2 x 2, ce qui est facile, puis on se trompe sur la taille de la tête, ce qui ne l’est pas. Une photo peut être parfaitement carrée, parfaitement éclairée, et échouer quand même parce que le visage remplit trop le cadre.

## Comment cet outil positionne votre photo

Chargez une photo et l’outil trouve votre menton, le sommet de votre crâne et votre ligne des yeux, puis raisonne à l’envers : il calcule le recadrage qui place votre tête au milieu de la plage de tailles autorisée et vos yeux au milieu de la bande autorisée. Viser le milieu plutôt que le bord laisse de la place pour les petites erreurs que commet toute mesure automatique.

Si votre photo d’origine manque d’espace autour de la tête pour permettre un recadrage conforme, l’outil le dit et indique le bord qui manque, au lieu de recadrer plus serré et de vous remettre discrètement quelque chose qui sera refusé au guichet. Dans ce cas, reculez et reprenez la photo.

Le fond est remplacé par du blanc uni. Tout s’exécute dans votre navigateur via WebAssembly : votre photo n’est jamais envoyée à un serveur et ne quitte pas votre appareil.

## Imprimer chez soi ou en magasin

La solution la moins chère est un tirage photo de 4 x 6 pouces. Une photo de 2 x 2 pouces se répète exactement trois fois en largeur et deux fois en hauteur sur 4 x 6 : un seul tirage donne donc six photos de passeport pour le prix d’un cliché. Téléchargez la planche, confiez-la à un comptoir photo ou imprimez-la sans marges chez vous, puis coupez le long des lignes.

Pour un renouvellement en ligne, vous n’avez rien à imprimer. Téléchargez le JPEG unique de 600 x 600 pixels et envoyez-le directement.
