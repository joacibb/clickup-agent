import { getRecentTasks } from '../../lib/clickup';

export default async function handler(req, res) {
  const auth = req.cookies && req.cookies.auth;
  if (!auth) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  const { CLICKUP_TOKEN, USER_ID, TEAM_ID, DAYS_BACK = '30' } = process.env;

  if (!CLICKUP_TOKEN || !USER_ID || !TEAM_ID) {
    return res.status(500).json({ ok: false, error: 'Missing environment variables: CLICKUP_TOKEN, USER_ID, TEAM_ID' });
  }

  try {
    const tasks = await getRecentTasks({ CLICKUP_TOKEN, USER_ID, TEAM_ID, DAYS_BACK });
    return res.status(200).json({ ok: true, time: Date.now(), results: tasks });
  } catch (err) {
    console.error('Error in /api/tasks:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
  }
}
