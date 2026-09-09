---
country: schengen
countryName: Espaço Schengen
document: visa
documentName: fotografia de visto Schengen
title: "Fotografia de visto Schengen grátis online: 35x45 mm"
description: Crie grátis online uma fotografia de visto Schengen de 35x45 mm. Rosto a 70-80% da altura, fundo claro e folha imprimível. Tudo no navegador, nada é enviado.
output:
  kind: physical
  widthMm: 35
  heightMm: 45
  dpi: 300
headHeight:
  minMm: 32
  maxMm: 36
background:
  description: Cinzento-claro ou creme simples, iluminado de forma uniforme
  colors:
    - '#f0f0f0'
    - '#f5f0e6'
file:
  format: jpeg
sourceUrl: https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - O rosto ocupa menos de 70% ou mais de 80% da altura do enquadramento
  - Um fundo branco puro, que vários consulados leem como sobre-exposto
  - Cabeça inclinada ou virada em vez de de frente para a câmara
  - Cabelo a cobrir os olhos ou o contorno do rosto
  - Reflexos ou armações grossas se usar óculos
  - Fotografia com mais de seis meses
faq:
  - q: Que tamanho tem uma fotografia de visto Schengen?
    a: 35 mm de largura por 45 mm de altura. A 300 DPI são 413 x 531 píxeis.
  - q: Quanto da fotografia deve o meu rosto ocupar?
    a: Entre 70% e 80% da altura, o que corresponde a uma cabeça de 32 mm a 36 mm do queixo ao topo da cabeça.
  - q: O fundo deve ser branco?
    a: Prefira cinzento-claro ou creme simples. O requisito é um fundo claro, uniforme e com contraste, e um branco puro pode ser lido como sobre-exposto.
  - q: Uma fotografia serve para todos os países Schengen?
    a: O formato 35x45 mm e a regra dos 70-80% são comuns a todos, mas cada consulado acrescenta as suas próprias notas. Verifique o consulado onde vai apresentar o pedido.
---

## A regra que decide: 70 a 80 por cento

Todos os consulados Schengen trabalham com o mesmo formato de fotografia, 35 mm de largura por 45 mm de altura, e com o mesmo requisito central: o seu rosto tem de ocupar 70% a 80% da altura do enquadramento. Em milímetros, isso é uma cabeça entre 32 mm e 36 mm medida da base do queixo ao topo da cabeça, cabelo incluído.

Essa faixa é mais estreita do que parece. Um recorte que a olho parece razoável cai frequentemente nos 60% ou nos 85%, e qualquer um deles é motivo de recusa. É a razão mais frequente para as fotografias Schengen voltarem para trás.

## Por que não um fundo branco

O requisito publicado é um fundo claro e uniforme que contraste com o rosto. O branco puro cumpre tecnicamente a palavra claro, mas na prática um fundo branco fotografado com um flash forte perde o contorno do cabelo claro e dos ombros, e vários consulados tratam isso como sobre-exposição. O cinzento-claro ou o creme é a leitura mais segura da mesma regra, pelo que esta ferramenta usa cinzento-claro por predefinição.

## Como esta ferramenta funciona

Carregue qualquer fotografia razoavelmente de frente. A ferramenta localiza o queixo, o topo da cabeça e a linha dos olhos, e depois calcula o recorte que coloca a cabeça em 34 mm, o meio do intervalo permitido, dando a folga mais ampla possível ao erro de medição. O fundo é substituído por um cinzento-claro uniforme.

Se a fotografia de origem estiver recortada de forma demasiado apertada para produzir um resultado conforme, a ferramenta diz-lhe que margem está curta em vez de recortar mais e entregar-lhe uma fotografia que vai chumbar. Volte a tirá-la mais longe da câmara.

Todo o processamento acontece no seu navegador através de WebAssembly. Nada é carregado.

## Impressão

Uma fotografia de 35 x 45 mm cabe oito vezes numa impressão de 4 x 6 polegadas, quatro na largura e duas na altura. Descarregue a folha, mande imprimi-la como uma fotografia comum e corte pelas linhas. A maioria dos consulados pede duas fotografias idênticas, pelo que uma folha cobre quatro pedidos.
