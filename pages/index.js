import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const seen = useRef(new Set());

  useEffect(() => {
    // Request notification permission once
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }

    let mounted = true;
    const fetchOnce = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/check');
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`API error ${res.status}: ${txt}`);
        }
        const json = await res.json();
        const newItems = json.results || [];
        if (!mounted) return;
        setItems(newItems);

        // Show notifications for new items
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          for (const it of newItems) {
            const id = `${it.taskId}::${it.date}`;
            if (!seen.current.has(id)) {
              seen.current.add(id);
              new Notification(it.taskName || 'ClickUp', {
                body: it.text || 'Nueva actualización',
                tag: id,
              });
            }
          }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOnce();
    const timer = setInterval(fetchOnce, 60 * 1000); // every minute
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <Head>
        <title>ClickUp Agent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <h1>🔔 Agente ClickUp</h1>
      <p>Recibe novedades de tus tareas asignadas.</p>

      <div style={{ margin: '12px 0' }}>
        <button
          onClick={() => {
            if (typeof Notification !== 'undefined') {
              Notification.requestPermission().then(() => window.location.reload());
            }
          }}
          style={{ padding: '10px 14px', marginRight: 8 }}
        >
          Permitir notificaciones
        </button>
        <button
          onClick={async () => {
            // simple logout: clear cookie by setting expired cookie
            document.cookie = 'auth=; Path=/; Max-Age=0';
            window.location.href = '/login';
          }}
          style={{ padding: '10px 14px' }}
        >
          Logout
        </button>
      </div>

      {loading && <p>Revisando novedades...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {items.length === 0 ? (
        <p>No hay novedades en las últimas horas.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((it, i) => (
            <li key={i} style={{ padding: 12, borderRadius: 8, background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.05)', marginBottom: 10 }}>
              <a href={it.taskUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{it.taskName}</a>
              <div style={{ marginTop: 6 }}>{it.text}</div>
              <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>{new Date(it.date).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
