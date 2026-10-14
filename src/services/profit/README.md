# Pelno skaičiavimo funkcijos

`profit.js` pateikia grynas JavaScript funkcijas investicijų pelnui, pinigų srautui ir turimoms pozicijoms apskaičiuoti. Modulis neturi React, Supabase ar kitų išorinių priklausomybių.

Sandoriai apdorojami pagal datą ir tada pagal ID. Realizuoto pelno savikaina skaičiuojama FIFO metodu: pardavimas pirmiausia nurašo seniausios pirkimo partijos akcijas. Pinigų sumos perduodamos sveikais centais; pardavimas be pakankamo ankstesnių pirkimų kiekio laikomas klaida.

- `calculateSellProfits` – kiekvieno pardavimo `{ transactionId, symbol, proceedsCents, costCents, profitCents }` rezultatas.
- `calculateSellDetails` – pardavimo rezultatas ir FIFO pirkimo partijų dalys, priskirtos tam pardavimui.
- `calculateProfitBySymbol` – parduotas kiekis ir realizuotos sumos pagal simbolį.
- `calculateTotalProfit` – bendras realizuotas pelnas.
- `calculateCashSummary` – įnašai atėmus išmokėtas lėšas, pirkimai, grynosios pardavimo įplaukos, komisiniai ir pinigų likutis. Išmokėjimai taip pat mažina pinigų likutį.
- `calculateHoldings` – likusios pozicijos ir jų savikaina.

Testai taip pat tikrina, kad bendras realizuotas pelnas sutaptų su pelnų pagal akciją suma.
