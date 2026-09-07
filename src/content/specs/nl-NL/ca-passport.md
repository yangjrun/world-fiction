---
country: ca
countryName: Canada
document: passport
documentName: Canadese pasfoto
title: "Canadese pasfoto: formaat en eisen (50x70 mm)"
description: Maak in je browser een Canadese pasfoto van 50x70 mm die aan de eisen voldoet. Juiste gezichtshoogte van 31 tot 36 mm, witte achtergrond en een printbaar vel.
output:
  kind: physical
  widthMm: 50
  heightMm: 70
  dpi: 300
headHeight:
  minMm: 31
  maxMm: 36
background:
  description: Effen wit, gelijkmatig en zonder schaduw
  colors:
    - '#ffffff'
file:
  format: jpeg
sourceUrl: https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html
sourceCheckedOn: 2026-09-03
status: verified
rejectionReasons:
  - Gezichtshoogte buiten het bereik van 31 mm tot 36 mm van kin tot kruin
  - Foto niet afgedrukt op gewoon fotopapier met matte of halfmatte afwerking
  - Op de achterkant van één afdruk ontbreken naam, adres en datum van de fotograaf
  - Een achtergrond die niet gelijkmatig wit is, of een schaduw achter het hoofd
  - Weerspiegeling of schittering op de bril die de ogen bedekt
  - Foto meer dan twaalf maanden voor de aanvraag gemaakt
faq:
  - q: Welk formaat heeft een Canadese pasfoto?
    a: 50 mm breed en 70 mm hoog, ongewoon hoog vergeleken met de meeste landen. Bij 300 DPI is dat 591 x 827 pixels.
  - q: Hoe hoog moet mijn gezicht zijn?
    a: Tussen 31 mm en 36 mm, gemeten van de onderkant van de kin tot de kruin.
  - q: Heb ik twee foto’s nodig?
    a: Ja. Er zijn twee identieke foto’s vereist, en op de achterkant van één moet de naam en het adres van de fotograaf staan, plus de datum waarop de foto is gemaakt.
  - q: Kan ik in plaats daarvan een digitale foto insturen?
    a: Nee. Canadese paspoortaanvragen vereisen afgedrukte foto’s, dus het afdrukken van het vel is niet te omzeilen.
---

## Een ongewoon formaat, en waarom dat uitmaakt

Een Canadese pasfoto is 50 mm breed en 70 mm hoog. Die verhouding van 5:7 is duidelijk hoger dan de 35 x 45 mm die het grootste deel van Europa gebruikt en dan het vierkant van 2 x 2 inch in de Verenigde Staten, en een foto die voor een van die twee is gemaakt werkt hier niet. Binnen het kader moet je gezicht van de onderkant van de kin tot de kruin 31 mm tot 36 mm meten.

Omdat het kader hoog is, valt er in de uitsnede meer van je schouders dan bij andere formaten. Is je bronfoto bij de kraag afgesneden, dan is er te weinig beeld om mee te werken, en dit hulpmiddel zegt dat in plaats van het uit te rekken.

## De eis die de meesten missen

Canada verlangt twee identieke foto’s, en op de achterkant van één moet de naam van de fotograaf, het adres en de datum van de opname staan. Op een foto die je zelf hebt gemaakt en bij een balie hebt laten afdrukken staat daar niets van. Schrijf het er zelf achterop voordat je hem inlevert: de eis is de informatie, niet het stempel van een commerciële studio.

Digitaal insturen kan niet bij Canadese paspoorten, dus afdrukken is een verplichte stap en geen gemak.

## Hoe dit hulpmiddel werkt

Upload een foto. Het hulpmiddel bepaalt je kin, kruin en ooglijn en berekent dan de uitsnede die je gezicht op 33,5 mm zet, het midden van het toegestane bereik, wat de grootste ruimte voor meetfouten overlaat. De achtergrond wordt vervangen door gelijkmatig wit, wat de schaduwproblemen wegneemt die een groot deel van de afkeuringen veroorzaken.

De verwerking gebeurt volledig in je browser via WebAssembly. Je foto wordt nergens geüpload.

## Afdrukken

Een foto van 50 x 70 mm past vier keer op een afdruk van 4 x 6 inch als je hem een kwartslag draait, wat het hulpmiddel automatisch doet. Download het vel, laat het op mat of halfmat fotopapier afdrukken en snijd langs de snijlijnen. Dat levert twee paar, genoeg voor deze aanvraag en één in reserve.
