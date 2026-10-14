# Architektūros sprendimai

Šiame dokumente fiksuojami projekto apskaitos ir pinigų apdorojimo sprendimai.

## Apskaitos metodas (FIFO)

Naudojamas FIFO metodas: parduodant pirmiausia nurašomos seniausio pirkimo akcijos. Kiekvienas pirkimas sudaro atskirą savikainos partiją, į kurią įskaičiuojamas pirkimo komisinis. Jei parduodama tik dalis partijos, jos savikaina ir komisinis paskirstomi proporcingai parduotam kiekiui. Pardavimas negali viršyti tuo metu turimo kiekio.

## Pinigų saugojimas

Visos piniginės sumos skaičiavimo moduliuose saugomos sveikaisiais skaičiais, išreikštais euro centais. Skaičiavimuose nenaudojami slankiojo kablelio pinigų dydžiai. Sandorio `amountCents` įnašui ir išmokėjimui yra teigiama operacijos suma; pirkimui apima komisinį, o pardavimui jau yra atėmus komisinį. Išmokėjimas mažina pinigų likutį ir įneštą kapitalą. Jis leidžiamas tik tada, kai pinigų likučio pakanka.

## Apvalinimas

Dalies FIFO partijos savikaina apvalinama iki artimiausio cento; tiksliai per pusę atsidūrusi reikšmė apvalinama aukštyn. Apvalinta suma atimama iš likusios tos partijos savikainos. Išpardavus visą partiją panaudojama visa likusi jos savikaina, todėl apvalinimo likutis nepersikelia į kitas partijas ar vėlesnius pirkimus. Tarpiniams sandaugos ir dalybos veiksmams naudojama sveikųjų skaičių aritmetika; viešų rezultatų reikšmės turi tilpti į saugų JavaScript sveikųjų skaičių intervalą.
