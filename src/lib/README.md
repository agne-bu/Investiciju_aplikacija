# Išoriniai klientai

`supabaseClient.js` sukuria bendrą Supabase JS klientą iš `VITE_SUPABASE_URL` ir `VITE_SUPABASE_ANON_KEY`. URL turi būti projekto bazinis adresas. Jei URL netyčia baigiasi `/rest/v1`, klientas šį kelią pašalina, nes Supabase JS jį prideda pats.
