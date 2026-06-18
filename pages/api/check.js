import { getRecentUpdates } from '../../lib/clickup';

export default async function handler(req, res) {
  const auth = req.cookies && req.cookies.auth;
  if (!auth) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  if (req.method !== 'POST') return res.status(405).end();

  const { clickupToken, userId, teamId, hoursBack } = req.body || {};

  if (!clickupToken || !userId || !teamId) {
    return res.status(400).json({ ok: false, error: 'Faltan credenciales ClickUp: clickupToken, userId, teamId' });
  }

  try {
    const updates = await getRecentUpdates({ CLICKUP_TOKEN: clickupToken, USER_ID: userId, TEAM_ID: teamId, HOURS_BACK: hoursBack });
    return res.status(200).json({ ok: true, time: Date.now(), results: updates });
  } catch (err) {
    console.error('Error in /api/check:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
  }
}
