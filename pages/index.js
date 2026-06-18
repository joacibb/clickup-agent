import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const seen = useRef(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }

    let mounted = true;

    const fetchUpdates = async () => {
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

    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setTasks(json.results || []);
      } catch (e) {
        console.error('Error fetching tasks:', e);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchUpdates();
    fetchTasks();
    const timer = setInterval(fetchUpdates, 60 * 1000);
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
          onClick={() => {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              setTimeout(() => {
                new Notification('ClickUp Agent (TEST)', {
                  body: 'Esta es una notificación de prueba 5 segundos después.',
                });
              }, 5000);
            } else {
              alert('Primero permití las notificaciones con el botón de arriba.');
            }
          }}
          style={{ padding: '10px 14px', marginRight: 8 }}
        >
          TEST notificación (5s)
        </button>
        <button
          onClick={async () => {
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

      <hr style={{ margin: '24px 0' }} />

      <h2>Tareas recientes</h2>
      <p style={{ color: '#666' }}>Últimas tareas que te fueron asignadas (incluye cerradas).</p>

      {tasksLoading && <p>Cargando tareas...</p>}
      {tasks.length === 0 ? (
        !tasksLoading && <p>No se encontraron tareas en los últimos días.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map(t => (
            <li key={t.id} style={{ padding: 12, borderRadius: 8, background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.05)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                display: 'inline-block',
                width: 10, height: 10,
                borderRadius: '50%',
                background: t.closed ? '#999' : `#${t.statusColor}`,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <a href={t.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, textDecoration: t.closed ? 'line-through' : 'none', color: t.closed ? '#999' : '#000' }}>
                  {t.name}
                </a>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                  {t.closed ? 'Cerrada' : t.status}
                </span>
                <div style={{ marginTop: 4, fontSize: 12, color: '#aaa' }}>
                  {t.dateUpdated ? new Date(t.dateUpdated).toLocaleString() : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
