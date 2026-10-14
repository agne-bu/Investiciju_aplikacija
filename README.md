# Mano portfelis

Vieno vartotojo investicijų portfelio programa, kurioje galima tvarkyti įnašus, akcijų pirkimus ir pardavimus. Sąsaja sukurta React ir Vite, o duomenys pasiekiami per Supabase.

## Reikalavimai

- Node.js 18 arba naujesnė versija
- npm
- Supabase projektas su `stocks` ir `transactions` lentelėmis

## Įdiegimas ir paleidimas

```sh
npm install
```

Nukopijuokite `.env.example` į `.env` ir įrašykite Supabase projekto reikšmes:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Paleiskite kūrimo aplinką:

```sh
npm run dev
```

Atidarius programą pirmiausia rodoma suvestinė su įnašais, portfelio verte (neparduotų akcijų FIFO savikaina ir pinigų likutis) bei realizuotu pelnu procentais nuo įnešto kapitalo. „Sandoriai“ puslapyje galima įrašyti įnašus, pirkimus ir pardavimus, peržiūrėti istoriją bei redaguoti arba ištrinti esamus įrašus. Prieš įrašymą tikrinama įvestis, pinigų likutis ir turimas akcijų kiekis.

## Komandos

- `npm run dev` – paleidžia Vite kūrimo serverį.
- `npm run build` – sukuria produkcinį build kataloge `dist/`.
- `npm run test` – paleidžia Vitest testus.
- `npm run lint` – patikrina JavaScript kodą su ESLint.
- `npm run format` – suformatuoja failus su Prettier.

## Aplankai

- `src/api/` – Supabase duomenų prieigos funkcijos ir laukų mapperiai.
- `src/components/` – sandorių forma ir sąrašas su pardavimų pelnu.
- `src/pages/` – sandorių ir suvestinės puslapiai.
- `src/lib/` – Supabase klientas.
- `src/services/profit/` – nuo duomenų bazės nepriklausoma pelno skaičiavimo logika.
- `src/services/validation/` – įvesties, portfelio ir hipotetinių pakeitimų validavimas.
- `src/utils/` – pinigų konvertavimo ir formatavimo funkcijos.
- `supabase/migrations/` – duomenų bazės SQL migracijos.
- `docs/decisions.md` – apskaitos ir pinigų apdorojimo sprendimai.
