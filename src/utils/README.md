# Pagalbinės funkcijos

`money.js` pateikia pinigų formatavimo ir įvesties funkcijas be išorinių priklausomybių.

- `eurosToCents(value)` priima kablelį arba tašką kaip dešimtainį skirtuką ir grąžina sveikus centus, nenaudodama slankiojo kablelio aritmetikos.
- `formatCents(cents)` pateikia sumą lietuvišku formatu, pavyzdžiui, `1250` → `12,50 €`.

Funkcijų testai yra `money.test.js`.
