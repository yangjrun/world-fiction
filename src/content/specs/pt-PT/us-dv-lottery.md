---
country: us
countryName: Estados Unidos
document: dv-lottery
documentName: fotografia para a lotaria DV
title: "Fotografia para a lotaria DV grátis online: 600x600 px"
description: Crie grátis online uma fotografia conforme para a lotaria DV. Exatamente 600x600 píxeis, sob 240 KB, com cabeça e olhos no lugar. Tudo no navegador, nada é enviado.
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
  description: Branco simples ou branco sujo
  colors:
    - '#ffffff'
file:
  format: jpeg
  maxBytes: 245760
sourceUrl: https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-entry/diversity-visa-submit-entry1/diversity-visa-photograph-requirements.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Ficheiro maior do que 240 KB, que o formulário de inscrição rejeita de imediato
  - Imagem que não tem exatamente 600 x 600 píxeis quadrados
  - Altura da cabeça fora dos 50% a 69% da altura da imagem
  - Olhos fora da faixa de 56% a 69% medida a partir da margem inferior
  - Reutilizar a fotografia de uma inscrição de um ano anterior, o que desqualifica automaticamente
  - Uma fotografia de uma fotografia, ou uma digitalização em que se vê a textura do papel
faq:
  - q: Que tamanho tem de ter uma fotografia para a lotaria DV?
    a: Exatamente 600 x 600 píxeis, quadrada, e o ficheiro não pode passar dos 240 KB.
  - q: Por que é que a minha fotografia é rejeitada pelo tamanho do ficheiro?
    a: O formulário aplica um limite rígido de 240 KB. Esta ferramenta procura a maior qualidade JPEG que ainda cabe abaixo desse limite, para que o ficheiro passe sem parecer demasiado comprimido.
  - q: Onde têm de estar os meus olhos?
    a: Entre 56% e 69% da altura da imagem acima da margem inferior, e a cabeça tem de ocupar entre 50% e 69% da altura.
  - q: Posso reutilizar a fotografia do ano passado?
    a: Não. Uma fotografia submetida na inscrição de um ano anterior desqualifica a nova inscrição. Precisa de uma fotografia tirada nos últimos seis meses.
---

## Dois limites rígidos, e um deles é um tamanho de ficheiro

O formulário de inscrição do visto de diversidade é mais exigente do que a maioria dos requisitos fotográficos porque impõe duas coisas de forma mecânica. A imagem tem de ter exatamente 600 x 600 píxeis, e o ficheiro não pode passar dos 240 KB. Falhe um dos dois e o formulário recusa o carregamento, sem explicar que regra quebrou.

É o limite de tamanho que faz tropeçar. Uma fotografia limpa de 600 x 600 guardada com a qualidade máxima na maioria dos editores fica entre 300 KB e 600 KB, muito acima do limite. Voltar a guardá-la com uma qualidade mais baixa escolhida a olho ou continua a passar, ou produz uma imagem visivelmente empastada.

Esta ferramenta procura a resposta em vez de adivinhar. Codifica a fotografia repetidamente, aproximando-se da maior qualidade JPEG que ainda fica abaixo dos 240 KB, o que lhe dá o ficheiro com melhor aspeto que o formulário vai aceitar.

## As regras de posicionamento

Dentro do quadrado, a cabeça tem de ocupar entre 50% e 69% da altura da imagem, medida da base do queixo ao topo da cabeça. Os olhos têm de ficar entre 56% e 69% da altura acima da margem inferior. São as mesmas proporções do requisito das fotografias de passaporte, expressas em percentagens e não em polegadas porque uma fotografia DV é apenas digital.

A ferramenta mede o seu rosto e depois calcula o recorte que coloca a cabeça e os olhos no centro das duas faixas permitidas.

## A desqualificação que quase ninguém conhece

Submeter uma fotografia que foi usada numa inscrição DV de um ano anterior desqualifica a inscrição. A fotografia tem de ter sido tirada nos últimos seis meses e não pode ter sido submetida antes. Se se inscreveu o ano passado, tire uma fotografia nova.

## Privacidade

Cada passo corre no seu navegador através de WebAssembly: deteção de rosto, substituição do fundo, recorte e codificação. A sua fotografia nunca é carregada para um servidor, o que aqui pesa mais do que o habitual, porque uma inscrição DV é exatamente o tipo de processo que atrai sites fraudulentos que imitam os oficiais.

Não há nada para imprimir. Descarregue o JPEG de 600 x 600 e anexe-o à sua inscrição.
