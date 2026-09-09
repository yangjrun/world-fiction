---
country: us
countryName: Estados Unidos
document: passport
documentName: fotografia de passaporte dos EUA
title: "Fotografia de passaporte dos EUA grátis online: 2x2 pol."
description: Crie grátis online uma fotografia de passaporte dos EUA de 2x2 pol. Cabeça, olhos e fundo branco corretos, mais uma folha 4x6. Tudo no navegador, nada é enviado.
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
  description: Branco simples ou branco sujo
  colors:
    - '#ffffff'
    - '#fafafa'
file:
  format: jpeg
sourceUrl: https://travel.state.gov/content/travel/en/passports/how-apply/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Cabeça demasiado grande ou demasiado pequena, por si só o motivo de rejeição mais frequente
  - Sombras no rosto ou no fundo atrás da cabeça
  - Óculos usados na fotografia, o que deixou de ser aceite em 2016
  - Um fundo com padrão, com cor ou demasiado escuro
  - Sorriso visível com os dentes, em vez de uma expressão neutra
  - Uma fotografia com mais de seis meses, ou já usada num passaporte anterior
faq:
  - q: Que tamanho tem uma fotografia de passaporte dos EUA?
    a: Exatamente 2 x 2 polegadas, ou seja 51 x 51 mm. A 300 DPI são 600 x 600 píxeis.
  - q: Que altura deve ter a minha cabeça?
    a: Medida da base do queixo ao topo da cabeça, entre 1 polegada e 1 3/8 de polegada (25 mm a 35 mm). Os olhos devem ficar entre 1 1/8 e 1 3/8 de polegada acima da margem inferior.
  - q: Posso usar óculos?
    a: Não. Os óculos deixaram de ser permitidos nas fotografias de passaporte dos EUA em novembro de 2016, salvo com uma declaração médica assinada.
  - q: Posso imprimir isto numa loja?
    a: Sim. Descarregue a folha de 4x6 polegadas, que traz seis cópias, mande imprimi-la como uma fotografia normal em qualquer balcão e corte pelas linhas de corte.
---

## O que o Departamento de Estado verifica de facto

Uma fotografia de passaporte dos EUA é um quadrado de 2 x 2 polegadas, e são duas medidas dentro desse quadrado que decidem se passa. A sua cabeça, medida da base do queixo ao topo da cabeça incluindo o cabelo, tem de ficar entre 1 polegada e 1 3/8 de polegada. Os olhos têm de cair entre 1 1/8 e 1 3/8 de polegada acima da margem inferior.

São estas duas regras que explicam por que tantas fotografias de passaporte feitas em casa voltam rejeitadas. As pessoas recortam um quadrado de 2 x 2, o que é fácil, e depois erram no tamanho da cabeça, o que não é. Uma fotografia pode estar perfeitamente quadrada e perfeitamente iluminada e ainda assim chumbar, porque o rosto ocupa demasiado do enquadramento.

## Como esta ferramenta posiciona a sua fotografia

Carregue uma fotografia e a ferramenta localiza o seu queixo, o topo da cabeça e a linha dos olhos, e depois trabalha ao contrário: calcula o recorte que coloca a cabeça no meio do intervalo de tamanhos permitido e os olhos no meio da faixa permitida. Apontar ao meio em vez da margem deixa espaço para os pequenos erros que qualquer medição automática comete.

Se a sua fotografia original não tiver espaço suficiente em volta da cabeça para existir um recorte conforme, a ferramenta di-lo e indica que margem falta, em vez de recortar mais e entregar-lhe em silêncio algo que será recusado ao balcão. Nesse caso, afaste-se e volte a tirar a fotografia.

O fundo é substituído por branco simples. Tudo corre no seu navegador através de WebAssembly, pelo que a sua fotografia nunca é enviada para um servidor nem sai do seu dispositivo.

## Imprimir em casa ou numa loja

O caminho mais barato é uma impressão fotográfica de 4 x 6 polegadas. Uma fotografia de 2 x 2 polegadas encaixa exatamente três vezes na largura e duas na altura em 4 x 6, pelo que uma única impressão dá seis fotografias de passaporte pelo preço de uma normal. Descarregue a folha, entregue-a num balcão de fotografia ou imprima-a sem margens em casa, e corte pelas linhas.

Para uma renovação em linha não precisa de imprimir nada. Descarregue o JPEG único de 600 x 600 píxeis e carregue-o diretamente.
