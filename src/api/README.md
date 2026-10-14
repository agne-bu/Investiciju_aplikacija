# Duomenų prieigos API

`stocks.js` ir `transactions.js` naudoja bendrą `src/lib/supabaseClient.js` klientą. Šie moduliai apima duomenų bazės prieigą; UI logikos juose nėra.

## Akcijos

- `getOrCreateStock(symbol)` pašalina tarpinius tarpus, paverčia simbolį didžiosiomis raidėmis ir randa arba sukuria akciją.
- `listStocks()` grąžina akcijų sąrašą pagal simbolį.

## Sandoriai

- `listTransactions()` grąžina sandorius su susieta akcija, surikiuotus pagal datą ir ID mažėjančia tvarka.
- `createTransaction(input)` ir `updateTransaction(id, input)` apskaičiuoja `amountCents`; įnašams ir išmokėtoms lėšoms įrašo tik datą bei sumą, o pirkimams ir pardavimams taip pat suranda arba sukuria akciją ir įrašo `stockId` bei normalizuotą simbolį.
- `deleteTransaction(id)` ištrina sandorį.

Duomenų bazės `snake_case` stulpeliai atvaizduojami aplikacijos `camelCase` savybėmis eksportuotais `mapStockFromDb`, `mapStockToDb`, `mapTransactionFromDb` ir `mapTransactionToDb` mapperiais. Mapperių testai yra `mappers.test.js` ir nenaudoja gyvo Supabase projekto.

Supabase atsakymo klaidos pateikiamos lietuviškais `Error` pranešimais.
