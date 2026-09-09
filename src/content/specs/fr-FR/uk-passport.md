---
country: uk
countryName: Royaume-Uni
document: passport
documentName: photo de passeport britannique
title: "Photo passeport UK gratuite en ligne : 35x45 mm, exigences"
description: Créez gratuitement une photo passeport UK 35x45 mm. Hauteur de tête de 29 à 34 mm, fond clair et planche imprimable. Tout dans votre navigateur, rien n'est envoyé.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 29
  maxMm: 34
background:
  description: Crème ou gris clair uni, sans ombre
  colors:
    - '#f5f0e6'
    - '#f0f0f0'
file:
  format: jpeg
sourceUrl: https://www.gov.uk/photos-for-passports
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Tête hors de la plage de 29 mm à 34 mm du menton au sommet du crâne
  - Toute ombre sur le visage ou derrière la tête
  - Couvre-chef porté sans motif religieux ou médical
  - Yeux masqués par les cheveux, la monture des lunettes ou un reflet sur les verres
  - Tout autre élément visible dans le cadre, y compris une deuxième personne ou un dossier de chaise
  - Photo prise plus d’un mois avant la demande, si votre apparence a changé
faq:
  - q: Quelle est la taille d’une photo de passeport britannique ?
    a: 35 mm de large sur 45 mm de haut. À 300 DPI cela fait 413 x 531 pixels.
  - q: Quelle hauteur ma tête doit-elle avoir sur la photo ?
    a: Entre 29 mm et 34 mm du bas du menton au sommet du crâne, cheveux compris.
  - q: Puis-je sourire ?
    a: Non. Le HM Passport Office exige une expression neutre, bouche fermée.
  - q: Puis-je utiliser cette photo pour la demande en ligne ?
    a: Oui. La voie numérique demande au moins 600 x 750 pixels, et le fichier produit par cet outil dépasse ce minimum.
---

## Ce que mesure le HM Passport Office

Une photo de passeport britannique mesure 35 mm de large et 45 mm de haut, et la mesure qui compte à l’intérieur est la hauteur de tête : de 29 mm à 34 mm du bas du menton au sommet du crâne, cheveux compris. C’est une fenêtre de 5 mm sur une photo de 45 mm, donc un recadrage qui paraît juste à l’œil ne l’est souvent pas assez.

Notez que cette bande est plus étroite et plus basse que pour le visa Schengen, même si les deux utilisent le même format extérieur de 35 x 45 mm. Une photo faite pour un visa Schengen sera généralement refusée pour un passeport britannique, et l’inverse est vrai aussi. Si vous demandez les deux, faites deux photos.

## Fond et éclairage

L’exigence est un fond uni crème ou gris clair sans ombre. Les ombres sont la deuxième cause d’échec après la taille de la tête, et elles viennent presque toujours d’une position trop proche du mur. Tenez-vous à au moins un demi-mètre du fond et tournez-vous vers une fenêtre plutôt que vers un plafonnier.

Cet outil remplace le fond par un remplissage uniforme, ce qui supprime les problèmes d’ombre derrière la tête. Il ne peut pas retirer une ombre projetée sur votre visage : éclairez-vous de face au moment de la prise de vue.

## Comment cet outil fonctionne

Chargez une photo. L’outil trouve votre menton, le sommet de votre crâne et votre ligne des yeux, puis calcule le recadrage qui place votre tête à 31,5 mm, le centre de la plage autorisée. Si votre photo manque de marge pour un recadrage conforme, il signale le bord trop court plutôt que de recadrer plus serré et de produire une photo qui échoue.

Chaque étape s’exécute localement dans votre navigateur via WebAssembly. Votre photo n’est jamais envoyée.

## Imprimer ou faire la demande en ligne

Pour une demande papier, téléchargez la planche de 4 x 6 pouces, qui contient huit exemplaires d’une photo de 35 x 45 mm, et faites-la imprimer à n’importe quel comptoir photo. Pour la demande en ligne, téléchargez le JPEG unique et envoyez-le directement : il dépasse largement le minimum de 600 x 750 pixels.
