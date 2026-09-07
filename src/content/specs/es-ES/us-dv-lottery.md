---
country: us
countryName: Estados Unidos
document: dv-lottery
documentName: foto para la lotería DV
title: "Lotería DV: requisitos de la foto (600x600 px, bajo 240 KB)"
description: Crea en tu navegador una foto válida para la lotería de visados de diversidad. Exactamente 600x600 píxeles, bajo el límite de 240 KB, con cabeza y ojos bien situados.
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
  description: Blanco liso o blanco roto
  colors:
    - '#ffffff'
file:
  format: jpeg
  maxBytes: 245760
sourceUrl: https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-entry/diversity-visa-submit-entry1/diversity-visa-photograph-requirements.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Archivo de más de 240 KB, que el formulario de inscripción rechaza de plano
  - Imagen que no mide exactamente 600 x 600 píxeles cuadrados
  - Altura de la cabeza fuera del 50% al 69% de la altura de la imagen
  - Ojos fuera de la banda del 56% al 69% medida desde el borde inferior
  - Reutilizar la foto de la inscripción de un año anterior, lo que descalifica automáticamente
  - Una foto de una foto, o un escaneo en el que se ve la textura del papel
faq:
  - q: ¿Qué tamaño necesita una foto para la lotería DV?
    a: Exactamente 600 x 600 píxeles, cuadrada, y el archivo no puede pasar de 240 KB.
  - q: ¿Por qué rechazan mi foto por el tamaño del archivo?
    a: El formulario aplica un techo estricto de 240 KB. Esta herramienta busca la máxima calidad JPEG que sigue cabiendo por debajo, así que el archivo pasa sin parecer demasiado comprimido.
  - q: ¿Dónde deben estar mis ojos?
    a: Entre el 56% y el 69% de la altura de la imagen sobre el borde inferior, y la cabeza debe ocupar entre el 50% y el 69% de la altura.
  - q: ¿Puedo reutilizar la foto del año pasado?
    a: No. Una foto presentada en la inscripción de un año anterior descalifica la nueva inscripción. Necesitas una foto tomada en los últimos seis meses.
---

## Dos límites estrictos, y uno de ellos es un tamaño de archivo

El formulario de inscripción del visado de diversidad es más estricto que la mayoría de los requisitos fotográficos porque impone dos cosas de forma mecánica. La imagen debe medir exactamente 600 x 600 píxeles y el archivo no puede pasar de 240 KB. Si fallas en cualquiera de las dos, el formulario rechaza la subida sin explicar qué regla has incumplido.

El techo de tamaño es lo que hace tropezar a la gente. Una foto limpia de 600 x 600 guardada con la máxima calidad en la mayoría de los editores acaba entre 300 KB y 600 KB, muy por encima del límite. Volver a guardarla con una calidad menor elegida a ojo o se pasa otra vez o produce una imagen visiblemente pastosa.

Esta herramienta busca la respuesta en lugar de adivinarla. Codifica la foto repetidamente, acotando la máxima calidad JPEG que sigue cabiendo por debajo de 240 KB, lo que te da el archivo con mejor aspecto que el formulario aceptará.

## Las reglas de posición

Dentro del cuadrado, tu cabeza debe ocupar entre el 50% y el 69% de la altura de la imagen, medida desde la base del mentón hasta la coronilla. Tus ojos deben quedar entre el 56% y el 69% de la altura sobre el borde inferior. Son las mismas proporciones que usa el requisito de las fotos de pasaporte, expresadas en porcentajes en vez de en pulgadas porque una foto DV es solo digital.

La herramienta mide tu cara y calcula el recorte que sitúa cabeza y ojos en el centro de las dos bandas permitidas.

## La descalificación que casi nadie conoce

Presentar una foto que se usó en la inscripción DV de un año anterior descalifica la inscripción. La foto tiene que haberse tomado en los últimos seis meses y no puede haberse presentado antes. Si participaste el año pasado, hazte una foto nueva.

## Privacidad

Cada paso se ejecuta dentro de tu navegador mediante WebAssembly: detección facial, sustitución del fondo, recorte y codificación. Tu fotografía nunca se sube a un servidor, lo que aquí importa más que de costumbre, porque una inscripción DV es exactamente el tipo de trámite que atrae a webs fraudulentas que imitan a las oficiales.

No hay nada que imprimir. Descarga el JPEG de 600 x 600 y adjúntalo a tu inscripción.
