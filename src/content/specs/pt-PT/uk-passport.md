---
country: uk
countryName: Reino Unido
document: passport
documentName: fotografia de passaporte britânico
title: "Fotografia de passaporte britânico grátis online: 35x45 mm"
description: Crie grátis online uma fotografia de passaporte britânico de 35x45 mm. Altura da cabeça 29-34 mm, fundo claro e folha imprimível. Tudo no navegador, nada é enviado.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 29
  maxMm: 34
background:
  description: Creme ou cinzento-claro simples, sem sombras
  colors:
    - '#f5f0e6'
    - '#f0f0f0'
file:
  format: jpeg
sourceUrl: https://www.gov.uk/photos-for-passports
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Cabeça fora do intervalo de 29 mm a 34 mm do queixo ao topo da cabeça
  - Qualquer sombra no rosto ou atrás da cabeça
  - Cobertura da cabeça usada sem motivo religioso ou médico
  - Olhos tapados pelo cabelo, pela armação dos óculos ou por um brilho nas lentes
  - Qualquer outra coisa visível no enquadramento, incluindo uma segunda pessoa ou as costas de uma cadeira
  - Fotografia tirada mais de um mês antes do pedido, se a sua aparência mudou
faq:
  - q: Que tamanho tem uma fotografia de passaporte britânico?
    a: 35 mm de largura por 45 mm de altura. A 300 DPI são 413 x 531 píxeis.
  - q: Que altura deve ter a minha cabeça na fotografia?
    a: Entre 29 mm e 34 mm da base do queixo ao topo da cabeça, cabelo incluído.
  - q: Posso sorrir?
    a: Não. O HM Passport Office exige uma expressão neutra com a boca fechada.
  - q: Posso usar esta fotografia no pedido em linha?
    a: Sim. A via digital precisa de pelo menos 600 x 750 píxeis, e o ficheiro que esta ferramenta produz ultrapassa esse mínimo.
---

## O que o HM Passport Office mede

Uma fotografia de passaporte britânico tem 35 mm de largura e 45 mm de altura, e a medida que conta lá dentro é a altura da cabeça: de 29 mm a 34 mm da base do queixo ao topo da cabeça, cabelo incluído. É uma janela de 5 mm numa fotografia de 45 mm, pelo que um recorte que a olho parece próximo muitas vezes não está próximo o suficiente.

Note que esta faixa é mais estreita e mais baixa do que a do visto Schengen, ainda que ambos usem o mesmo tamanho exterior de 35 x 45 mm. Uma fotografia feita para um visto Schengen é normalmente recusada para um passaporte britânico, e o contrário também é verdade. Se está a pedir os dois, faça duas fotografias.

## Fundo e iluminação

O requisito é um fundo simples creme ou cinzento-claro sem sombras. As sombras são a segunda causa de chumbo mais comum depois do tamanho da cabeça, e vêm quase sempre de estar demasiado perto de uma parede. Fique a pelo menos meio metro do fundo e volte-se para uma janela em vez de uma luz de teto.

Esta ferramenta substitui o fundo por um preenchimento uniforme, o que elimina os problemas de sombra atrás da cabeça. Não consegue remover uma sombra projetada no seu rosto, por isso ilumine-se de frente ao tirar a fotografia original.

## Como esta ferramenta funciona

Carregue uma fotografia. A ferramenta encontra o queixo, o topo da cabeça e a linha dos olhos, e depois calcula o recorte que coloca a cabeça em 31,5 mm, o centro do intervalo permitido. Se à sua fotografia faltar margem para um recorte conforme, indica que margem está curta em vez de recortar mais e produzir uma fotografia que vai chumbar.

Cada passo corre localmente no seu navegador através de WebAssembly. A sua fotografia nunca é carregada.

## Imprimir ou pedir em linha

Para um pedido em papel, descarregue a folha de 4 x 6 polegadas, que leva oito cópias de uma fotografia de 35 x 45 mm, e mande imprimi-la em qualquer balcão de fotografia. Para o pedido em linha, descarregue o JPEG único e carregue-o diretamente; ultrapassa com folga o mínimo de 600 x 750 píxeis.
