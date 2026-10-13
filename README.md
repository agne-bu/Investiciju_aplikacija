# Investicijų portfelis

Pradinis React + Vite karkasas vieno vartotojo investicijų portfelio programai. Šiame etape nėra verslo logikos, ekranų ar duomenų bazės schemos.

## Reikalavimai

- Node.js 18 arba naujesnė versija
- npm

## Įdiegimas ir paleidimas

```sh
npm install
```

Nukopijuokite `.env.example` į `.env` ir įrašykite Supabase projekto reikšmes:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Paleiskite vietinę kūrimo aplinką:

```sh
npm run dev
```

Programa tik patikrina, ar Supabase klientą galima sukurti. Ji neatlieka užklausų į duomenų bazę.

## Komandos

- `npm run dev` – paleidžia Vite kūrimo serverį.
- `npm run build` – sukuria produkcinį build kataloge `dist/`.
- `npm run test` – paleidžia Vitest pavyzdinį testą.
- `npm run lint` – patikrina JavaScript kodą su ESLint.
- `npm run format` – suformatuoja failus su Prettier.

## Aplankai

- `src/api/` – būsimos funkcijos darbui su sandoriais.
- `src/components/` ir `src/pages/` – būsimi bendri komponentai ir puslapiai.
- `src/lib/` – išorinės bibliotekos, įskaitant Supabase klientą.
- `src/services/profit/` – būsima nuo duomenų bazės nepriklausoma pelno skaičiavimo logika.
- `src/utils/` – būsimos bendros pagalbinės funkcijos, įskaitant pinigų formatavimą.
- `supabase/migrations/` – vėliau kuriamos SQL migracijos.
- `docs/decisions.md` – dar nepriimtų apskaitos ir pinigų apdorojimo sprendimų šablonas.
