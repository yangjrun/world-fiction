---
country: us
countryName: États-Unis
document: dv-lottery
documentName: photo pour la loterie DV
title: "Photo pour la loterie DV gratuite en ligne : 600x600 px"
description: Créez gratuitement une photo conforme pour la loterie DV. Exactement 600x600 pixels, sous 240 Ko, tête et yeux bien placés. Tout dans votre navigateur, rien n'est envoyé.
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
  description: Blanc uni ou blanc cassé
  colors:
    - '#ffffff'
file:
  format: jpeg
  maxBytes: 245760
sourceUrl: https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-entry/diversity-visa-submit-entry1/diversity-visa-photograph-requirements.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Fichier de plus de 240 Ko, que le formulaire d’inscription rejette d’emblée
  - Image qui ne fait pas exactement 600 x 600 pixels carrés
  - Hauteur de tête hors de la plage de 50% à 69% de la hauteur de l’image
  - Yeux hors de la bande de 56% à 69% mesurée depuis le bord inférieur
  - Réutilisation de la photo d’une inscription d’une année précédente, ce qui disqualifie automatiquement
  - Une photo d’une photo, ou un scan laissant voir le grain du papier
faq:
  - q: Quelle taille doit avoir une photo pour la loterie DV ?
    a: Exactement 600 x 600 pixels, carrée, et le fichier ne doit pas dépasser 240 Ko.
  - q: Pourquoi ma photo est-elle refusée pour sa taille de fichier ?
    a: Le formulaire applique un plafond strict de 240 Ko. Cet outil cherche la plus haute qualité JPEG qui reste sous cette limite, pour que le fichier passe sans paraître trop compressé.
  - q: Où mes yeux doivent-ils se situer ?
    a: Entre 56% et 69% de la hauteur de l’image au-dessus du bord inférieur, et votre tête doit occuper entre 50% et 69% de la hauteur.
  - q: Puis-je réutiliser la photo de l’an dernier ?
    a: Non. Une photo déjà soumise lors d’une inscription précédente disqualifie la nouvelle. Il vous faut une photo prise dans les six derniers mois.
---

## Deux limites strictes, dont une taille de fichier

Le formulaire d’inscription à la loterie des visas de diversité est plus strict que la plupart des normes photo parce qu’il applique deux choses mécaniquement. L’image doit faire exactement 600 x 600 pixels, et le fichier ne doit pas dépasser 240 Ko. Manquez l’une des deux et le formulaire refuse l’envoi, sans dire quelle règle vous avez enfreinte.

C’est le plafond de taille qui fait trébucher. Une photo propre de 600 x 600 enregistrée en qualité maximale par la plupart des éditeurs se situe entre 300 Ko et 600 Ko, bien au-delà de la limite. La réenregistrer à une qualité inférieure choisie au hasard fait soit dépasser encore, soit produire une image visiblement pâteuse.

Cet outil cherche la réponse au lieu de la deviner. Il encode la photo à répétition en resserrant sur la plus haute qualité JPEG qui reste sous 240 Ko, ce qui vous donne le fichier le plus beau que le formulaire acceptera.

## Les règles de positionnement

Dans le carré, votre tête doit occuper entre 50% et 69% de la hauteur de l’image, mesurée du bas du menton au sommet du crâne. Vos yeux doivent se situer entre 56% et 69% de la hauteur au-dessus du bord inférieur. Ce sont les mêmes proportions que la norme des photos de passeport, exprimées en pourcentages plutôt qu’en pouces parce qu’une photo DV est uniquement numérique.

L’outil mesure votre visage, puis calcule le recadrage qui place votre tête et vos yeux au centre des deux bandes autorisées.

## Le motif de disqualification que presque personne ne connaît

Soumettre une photo utilisée lors d’une inscription DV d’une année précédente disqualifie l’inscription. La photo doit avoir été prise dans les six derniers mois et ne pas avoir été soumise auparavant. Si vous avez participé l’an dernier, prenez une nouvelle photo.

## Confidentialité

Chaque étape s’exécute dans votre navigateur via WebAssembly : détection du visage, remplacement du fond, recadrage et encodage. Votre photo n’est jamais envoyée à un serveur, ce qui compte ici plus que d’habitude, car une inscription DV est exactement le genre de démarche qui attire les sites frauduleux imitant les sites officiels.

Il n’y a rien à imprimer. Téléchargez le JPEG de 600 x 600 et joignez-le à votre inscription.
