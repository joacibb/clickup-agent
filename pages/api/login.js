export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  const APP_PASSWORD = process.env.APP_PASSWORD;

  if (!APP_PASSWORD) {
    return res.status(500).json({ ok: false, error: 'APP_PASSWORD no configurada' });
  }

  if (String(password) !== String(APP_PASSWORD)) {
    return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
  }

  // Set a simple HttpOnly cookie to mark the session
  const token = '1';
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  // Build cookie string
  const cookie = `auth=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}
