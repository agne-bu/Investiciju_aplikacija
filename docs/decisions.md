# Architektūros sprendimai

Šiame dokumente bus fiksuojami projekto sprendimai. Kol kas visi punktai yra TODO.

## Apskaitos metodas (FIFO / svertinis vidurkis)

Naudojamas svertinis vidurkis. Kiekvieno simbolio pozicija saugo turimą kiekį ir bendrą savikainą. Pirkimas padidina kiekį ir savikainą pirkimo verte kartu su komisiniu. Pardavimo savikaina apskaičiuojama proporcingai: bendra savikaina dauginama iš parduodamo kiekio ir dalijama iš turimo kiekio. Pardavimas negali viršyti tuo metu turimo kiekio.

## Pinigų saugojimas

Visos piniginės sumos skaičiavimo moduliuose saugomos sveikaisiais skaičiais, išreikštais euro centais. Skaičiavimuose nenaudojami slankiojo kablelio pinigų dydžiai. Sandorio `amountCents` pirkimui apima komisinį, o pardavimui jau yra atėmus komisinį.

## Apvalinimas

Parduotos dalies savikaina apvalinama iki artimiausio cento; tiksliai per pusę atsidūrusi reikšmė apvalinama aukštyn. Apvalinta suma atimama iš bendros likusios savikainos, todėl apvalinimo likutis nepersikelia į vėlesnius pardavimus. Tarpiniams sandaugos ir dalybos veiksmams naudojama sveikųjų skaičių aritmetika; viešų rezultatų reikšmės turi tilpti į saugų JavaScript sveikųjų skaičių intervalą.
