import { getRecentUpdates } from '../../lib/clickup';

export default async function handler(req, res) {
  const { CLICKUP_TOKEN, USER_ID, TEAM_ID, HOURS_BACK } = process.env;

  if (!CLICKUP_TOKEN || !USER_ID || !TEAM_ID) {
    return res.status(500).json({ ok: false, error: 'Missing environment variables: CLICKUP_TOKEN, USER_ID, TEAM_ID' });
  }

  try {
    const updates = await getRecentUpdates({ CLICKUP_TOKEN, USER_ID, TEAM_ID, HOURS_BACK });
    return res.status(200).json({ ok: true, time: Date.now(), results: updates });
  } catch (err) {
    console.error('Error in /api/check:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
  }
}
