import { useState } from 'react';
import Router from 'next/router';

export default function Login() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed');
      // redirect to home
      Router.replace('/');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={submit}>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', width: '100%', marginBottom: 10 }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 16px' }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      {err && <p style={{ color: 'red' }}>{err}</p>}
      <p style={{ marginTop: 12, color: '#666' }}>
        Nota: la contraseña se configura en la variable de entorno APP_PASSWORD.
      </p>
    </div>
  );
}
