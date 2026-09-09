---
country: ca
countryName: Canadá
document: passport
documentName: fotografia de passaporte canadiano
title: "Fotografia de passaporte canadiano grátis online: 50x70 mm"
description: Crie grátis online uma fotografia de passaporte canadiano de 50x70 mm. Altura do rosto 31-36 mm, fundo branco e folha imprimível. Tudo no navegador, nada é enviado.
output:
  kind: physical
  widthMm: 50
  heightMm: 70
  dpi: 300
headHeight:
  minMm: 31
  maxMm: 36
background:
  description: Branco simples, uniforme e sem sombras
  colors:
    - '#ffffff'
file:
  format: jpeg
sourceUrl: https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Altura do rosto fora do intervalo de 31 mm a 36 mm do queixo ao topo da cabeça
  - Fotografia não impressa em papel fotográfico comum com acabamento mate ou semimate
  - Falta o nome, o endereço e a data do fotógrafo no verso de uma das cópias
  - Um fundo que não seja uniformemente branco, ou uma sombra atrás da cabeça
  - Reflexo ou brilho nos óculos a tapar os olhos
  - Fotografia tirada mais de doze meses antes do pedido
faq:
  - q: Que tamanho tem uma fotografia de passaporte canadiano?
    a: 50 mm de largura por 70 mm de altura, bastante mais alta do que na maioria dos países. A 300 DPI são 591 x 827 píxeis.
  - q: Que altura deve ter o meu rosto?
    a: Entre 31 mm e 36 mm medidos da base do queixo ao topo da cabeça.
  - q: Preciso de duas fotografias?
    a: Sim. São exigidas duas fotografias idênticas, e o verso de uma delas tem de indicar o nome e o endereço do fotógrafo e a data em que a fotografia foi tirada.
  - q: Posso enviar uma fotografia digital em vez disso?
    a: Não. Os pedidos de passaporte canadiano exigem fotografias impressas, pelo que imprimir a folha não é evitável.
---

## Um tamanho invulgar, e por que isso importa

Uma fotografia de passaporte canadiano mede 50 mm de largura por 70 mm de altura. Essa proporção de 5:7 é claramente mais alta do que os 35 x 45 mm usados na maior parte da Europa e do que o quadrado de 2 x 2 polegadas dos Estados Unidos, e uma fotografia feita para qualquer um deles não serve aqui. Dentro do enquadramento, o rosto tem de medir de 31 mm a 36 mm da base do queixo ao topo da cabeça.

Como o enquadramento é alto, o recorte inclui mais dos seus ombros do que os outros formatos. Se a fotografia de origem estiver cortada ao nível do colarinho, não haverá imagem suficiente para trabalhar, e esta ferramenta di-lo em vez de a esticar.

## O requisito que quase todos deixam passar

O Canadá exige duas fotografias idênticas, e o verso de uma delas tem de mostrar o nome do fotógrafo, o endereço e a data em que a fotografia foi tirada. Numa fotografia que fez e mandou imprimir num balcão não está nada disso escrito. Escreva-o você mesmo no verso antes de submeter: o que se exige é a informação, não o carimbo de um estúdio comercial.

A submissão digital não é uma opção para os passaportes canadianos, pelo que imprimir é um passo obrigatório e não uma conveniência.

## Como esta ferramenta funciona

Carregue uma fotografia. A ferramenta localiza o queixo, o topo da cabeça e a linha dos olhos, e depois calcula o recorte que coloca o rosto em 33,5 mm, o meio do intervalo permitido, deixando a maior folga possível para o erro de medição. O fundo é substituído por branco uniforme, o que elimina os problemas de sombra que causam boa parte das rejeições.

O processamento acontece inteiramente no seu navegador através de WebAssembly. A sua fotografia não é carregada para nenhum lugar.

## Impressão

Uma fotografia de 50 x 70 mm cabe quatro vezes numa impressão de 4 x 6 polegadas se for rodada um quarto de volta, o que a ferramenta faz automaticamente. Descarregue a folha, mande imprimi-la em papel fotográfico mate ou semimate e corte pelas linhas. Ficam dois pares, o suficiente para este pedido e uma de reserva.
