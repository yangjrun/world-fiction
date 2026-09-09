---
country: schengen
countryName: Espacio Schengen
document: visa
documentName: foto de visado Schengen
title: "Foto de visado Schengen gratis online: 35x45 mm"
description: "Crea gratis online una foto de visado Schengen de 35x45 mm. Cara al 70-80% de la altura, fondo claro y hoja imprimible. Todo en tu navegador: no se sube nada."
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 32
  maxMm: 36
background:
  description: Gris claro o crema liso, con iluminación uniforme
  colors:
    - '#f0f0f0'
    - '#f5f0e6'
file:
  format: jpeg
sourceUrl: https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - La cara ocupa menos del 70% o más del 80% de la altura del encuadre
  - Un fondo blanco puro, que varios consulados interpretan como sobreexpuesto
  - Cabeza inclinada o girada en lugar de frontal a la cámara
  - Pelo que tapa los ojos o el contorno de la cara
  - Reflejos o monturas gruesas si se llevan gafas
  - Foto de más de seis meses
faq:
  - q: ¿Qué tamaño tiene una foto de visado Schengen?
    a: 35 mm de ancho por 45 mm de alto. A 300 DPI son 413 x 531 píxeles.
  - q: ¿Cuánto de la foto debe ocupar mi cara?
    a: Entre el 70% y el 80% de la altura, lo que equivale a una cabeza de 32 mm a 36 mm del mentón a la coronilla.
  - q: ¿El fondo debe ser blanco?
    a: Mejor gris claro o crema liso. El requisito es un fondo claro, uniforme y con contraste, y uno blanco puro puede leerse como sobreexpuesto.
  - q: ¿Sirve una sola foto para todos los países Schengen?
    a: El formato 35x45 mm y la regla del 70-80% son comunes a todos, pero cada consulado añade sus propias notas. Consulta el consulado donde vas a solicitar.
---

## La regla que lo decide: del 70 al 80 por ciento

Todos los consulados Schengen trabajan con el mismo formato de foto, 35 mm de ancho por 45 mm de alto, y el mismo requisito central: tu cara debe ocupar entre el 70% y el 80% de la altura del encuadre. En milímetros eso es una cabeza de entre 32 mm y 36 mm medida desde la base del mentón hasta la coronilla, pelo incluido.

Esa banda es más estrecha de lo que parece. Un recorte que a ojo resulta razonable acaba muchas veces en el 60% o en el 85%, y cualquiera de los dos es motivo de rechazo. Es la razón más frecuente por la que las fotos Schengen vuelven rechazadas.

## Por qué no un fondo blanco

El requisito publicado es un fondo claro y uniforme que contraste con la cara. El blanco puro cumple técnicamente con claro, pero en la práctica un fondo blanco fotografiado con flash intenso pierde el contorno del pelo claro y de los hombros, y varios consulados lo tratan como sobreexpuesto. El gris claro o el crema es la lectura más segura de la misma regla, así que esta herramienta usa gris claro por defecto.

## Cómo funciona esta herramienta

Sube cualquier foto razonablemente frontal. La herramienta localiza tu mentón, tu coronilla y tu línea de los ojos, y luego calcula el recorte que deja tu cabeza en 34 mm, el centro del rango permitido, con el margen más amplio posible para el error de medición. El fondo se sustituye por un gris claro uniforme.

Si tu foto de partida está recortada demasiado ajustada para dar un resultado válido, la herramienta te dice qué borde se queda corto en lugar de recortar más y entregarte una foto que va a fallar. Vuelve a hacerla alejándote de la cámara.

Todo el procesamiento ocurre en tu navegador mediante WebAssembly. No se sube nada.

## Impresión

Una foto de 35 x 45 mm se repite ocho veces en una copia de 4 x 6 pulgadas, cuatro a lo ancho y dos a lo alto. Descarga la hoja, pide que la impriman como una foto normal y corta por las líneas de guía. La mayoría de los consulados piden dos fotos idénticas, así que una hoja cubre cuatro solicitudes.
