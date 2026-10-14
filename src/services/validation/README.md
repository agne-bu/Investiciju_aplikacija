# Sandorių validavimas

`transactionValidation.js` pateikia grynas JavaScript funkcijas sandorių laukams ir viso portfelio operacijų sekai tikrinti. Modulis neturi React, Supabase ar kitų išorinių priklausomybių.

## Funkcijos

- `validateTransactionInput(input)` tikrina datą, sandorio tipą, įnašo ar išmokėtos sumos lauką arba pirkimo ir pardavimo laukus. Išmokėta suma turi būti teigiama. Komisinis gali nebūti nurodytas; tokiu atveju laikoma, kad jis lygus nuliui. Grąžina `{ valid, errors }`, kur `errors` yra objektas su lauko pavadinimais ir lietuviškais pranešimais.
- `validatePortfolio(transactions)` chronologiškai pagal datą ir ID tikrina, kad pinigų likutis nebūtų neigiamas po pirkimo ar lėšų išmokėjimo, pardavimas neviršytų turimo kiekio ir akcija būtų pirkta iki pardavimo. `errors` yra lietuviškų pranešimų masyvas.
- Naujo sandorio validavimo pranešime vietoj laikino techninio ID rodomas įvestas akcijos simbolis; išsaugotų sandorių klaidose rodomas jų ID.
- `canAddTransaction(existing, newTransaction)`, `canEditTransaction(existing, id, updated)` ir `canDeleteTransaction(existing, id)` įvertina hipotetinį pakeitimą pagal visą portfelio istoriją. Grąžina `{ valid, errors }`.

Sandoriai naudoja bendrą programos formatą: `id`, `type`, `date`, `symbol`, `quantity`, `priceCents`, `feeCents` ir `amountCents`. Piniginės sumos pateikiamos sveikais centais. Įnašo ir išmokėjimo suma turi būti teigiama; pirkimo suma lygi kiekiui × kainai + komisiniui, pardavimo suma – kiekiui × kainai − komisiniui.

## Testai

`transactionValidation.test.js` apima laukų taisykles, chronologinius portfelio apribojimus ir hipotetinius įrašų pakeitimus. Paleidžiama projekto komanda `npm run test`.
