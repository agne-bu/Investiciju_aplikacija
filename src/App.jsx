import { isSupabaseConfigured } from './lib/supabaseClient.js';

export default function App() {
  const configured = isSupabaseConfigured();

  return (
    <main className="app-shell">
      <section className="status-card" aria-labelledby="app-title">
        <p className="eyebrow">Asmeninių investicijų apskaita</p>
        <h1 id="app-title">Investicijų portfelis</h1>
        <p className="status-line">
          <span
            className={`status-indicator ${configured ? 'is-ready' : ''}`}
            aria-hidden="true"
          />
          Supabase ryšys:{' '}
          <strong>{configured ? 'sukonfigūruotas' : 'nesukonfigūruotas'}</strong>
        </p>
        {!configured && (
          <p className="hint">
            Nukopijuokite <code>.env.example</code> į <code>.env</code> ir įrašykite
            Supabase prisijungimo reikšmes.
          </p>
        )}
      </section>
    </main>
  );
}
