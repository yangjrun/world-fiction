---
country: schengen
countryName: Espace Schengen
document: visa
documentName: photo de visa Schengen
title: "Photo de visa Schengen : taille et normes (35x45 mm)"
description: Créez une photo de visa Schengen conforme de 35x45 mm dans votre navigateur. Visage occupant 70 à 80% de la hauteur, fond clair et une planche imprimable.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 32
  maxMm: 36
background:
  description: Gris clair ou crème uni, éclairé uniformément
  colors:
    - '#f0f0f0'
    - '#f5f0e6'
file:
  format: jpeg
sourceUrl: https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Le visage occupe moins de 70% ou plus de 80% de la hauteur du cadre
  - Un fond blanc pur, que plusieurs consulats lisent comme surexposé
  - Tête inclinée ou tournée au lieu d’être face à l’objectif
  - Cheveux couvrant les yeux ou le contour du visage
  - Reflets ou montures épaisses si des lunettes sont portées
  - Photo de plus de six mois
faq:
  - q: Quelle est la taille d’une photo de visa Schengen ?
    a: 35 mm de large sur 45 mm de haut. À 300 DPI cela fait 413 x 531 pixels.
  - q: Quelle part de la photo mon visage doit-il occuper ?
    a: Entre 70% et 80% de la hauteur, ce qui correspond à une tête de 32 mm à 36 mm du menton au sommet du crâne.
  - q: Le fond doit-il être blanc ?
    a: Préférez un gris clair ou un crème uni. L’exigence est un fond clair, uniforme et contrasté, et un fond blanc pur peut être lu comme surexposé.
  - q: Une seule photo convient-elle à tous les pays Schengen ?
    a: Le format 35x45 mm et la règle des 70-80% sont communs à tous, mais chaque consulat ajoute ses propres notes. Vérifiez auprès du consulat où vous déposez.
---

## La règle qui décide : 70 à 80 pour cent

Tous les consulats Schengen travaillent avec le même format de photo, 35 mm de large sur 45 mm de haut, et la même exigence centrale : votre visage doit occuper 70% à 80% de la hauteur du cadre. En millimètres, cela donne une tête de 32 mm à 36 mm mesurée du bas du menton au sommet du crâne, cheveux compris.

Cette bande est plus étroite qu’il n’y paraît. Un recadrage qui semble raisonnable à l’œil tombe fréquemment à 60% ou 85%, et l’un comme l’autre est un motif de refus. C’est la raison la plus fréquente du retour des photos Schengen.

## Pourquoi pas un fond blanc

L’exigence publiée est un fond clair et uniforme qui contraste avec le visage. Le blanc pur satisfait techniquement à clair, mais en pratique un fond blanc photographié avec un flash vif perd le contour des cheveux clairs et des épaules, et plusieurs consulats traitent cela comme une surexposition. Le gris clair ou le crème est la lecture la plus sûre de la même règle : cet outil utilise donc le gris clair par défaut.

## Comment cet outil fonctionne

Chargez n’importe quelle photo raisonnablement de face. L’outil repère votre menton, le sommet de votre crâne et votre ligne des yeux, puis calcule le recadrage qui amène votre tête à 34 mm, le milieu de la plage autorisée, en laissant la marge la plus large possible pour l’erreur de mesure. Le fond est remplacé par un gris clair uniforme.

Si votre photo source est recadrée trop serré pour produire un résultat conforme, l’outil vous dit quel bord est trop court plutôt que de recadrer davantage et de vous remettre une photo qui échoue. Reprenez-la en vous éloignant de l’objectif.

Tout le traitement a lieu dans votre navigateur via WebAssembly. Rien n’est envoyé.

## Impression

Une photo de 35 x 45 mm se répète huit fois sur un tirage de 4 x 6 pouces, quatre en largeur et deux en hauteur. Téléchargez la planche, faites-la imprimer comme une photo ordinaire et coupez le long des lignes. La plupart des consulats demandent deux photos identiques : une planche couvre donc quatre demandes.
