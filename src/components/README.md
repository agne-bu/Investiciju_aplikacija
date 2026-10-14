# Sandorių komponentai

- `TransactionForm.jsx` kuria ir redaguoja įnašus, išmokėtas lėšas, pirkimus bei pardavimus. Išmokėjimui įvedama suma; ji negali viršyti tuo metu turimo pinigų likučio. Forma naudoja pinigų konvertavimo funkcijas, rodo įvesties klaidas ir tikrina sandorio bei portfelio validumą; nesėkmingai išsaugojus įvestis paliekamos formoje.
- `TransactionList.jsx` pateikia sandorius chronologine tvarka, rodo sumas eurais ir realizuotą pelną pardavimo eilutėse bei pateikia redagavimo ir trynimo veiksmus puslapiui. Išmokėtos lėšos pažymėtos atskiru tipu.

Komponentai naudoja esamą React aplinką ir neprideda naujų bibliotekų.
