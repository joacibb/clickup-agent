// pages/api/check-debug.js
// Temporary debug endpoint that returns raw ClickUp task and comment data for debugging date parsing.
// Protect this endpoint by setting DEBUG_SECRET in your environment and passing ?secret=YOUR_SECRET.

export default async function handler(req, res) {
  const { DEBUG_SECRET, CLICKUP_TOKEN, USER_ID, TEAM_ID, HOURS_BACK = '2' } = process.env;

  const secret = req.query?.secret || req.url?.split('?secret=')[1] || null;
  if (!DEBUG_SECRET || String(secret) !== String(DEBUG_SECRET)) {
    return res.status(403).json({ ok: false, error: 'Forbidden: invalid or missing debug secret' });
  }

  if (!CLICKUP_TOKEN || !USER_ID || !TEAM_ID) {
    return res.status(500).json({ ok: false, error: 'Missing environment variables: CLICKUP_TOKEN, USER_ID, TEAM_ID' });
  }

  try {
    const hoursBack = Number(HOURS_BACK) || 2;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const dateGt = since.getTime();
    const headers = { Authorization: CLICKUP_TOKEN };

    const tasksUrl = `https://api.clickup.com/api/v2/team/${TEAM_ID}/task?assignees[]=${USER_ID}&date_updated_gt=${dateGt}&include_closed=false&subtasks=true`;
    const tasksRes = await fetch(tasksUrl, { headers });
    if (!tasksRes.ok) {
      const text = await tasksRes.text().catch(() => '');
      return res.status(502).json({ ok: false, error: `Failed fetching tasks: ${tasksRes.status} ${tasksRes.statusText} ${text}` });
    }

    const tasksData = await tasksRes.json();
    const tasks = tasksData.tasks || [];

    // For each task, fetch comments raw
    const out = [];
    for (const task of tasks) {
      const taskId = task.id;
      const commentsUrl = `https://api.clickup.com/api/v2/task/${taskId}/comment`;
      let commentsData = null;
      try {
        const commentsRes = await fetch(commentsUrl, { headers });
        if (commentsRes.ok) {
          commentsData = await commentsRes.json();
        } else {
          commentsData = { error: `comments fetch failed ${commentsRes.status}` };
        }
      } catch (e) {
        commentsData = { error: String(e.message || e) };
      }

      // Extract raw date candidates from each comment if available
      let comments = commentsData && commentsData.comments ? commentsData.comments.map(c => {
        return {
          raw: c,
          rawDate: c.date ?? c.created_at ?? c.date_created ?? null,
        };
      }) : commentsData;

      out.push({ taskId: task.id, taskName: task.name, taskUrl: task.url, rawTask: task, comments });
    }

    return res.status(200).json({ ok: true, time: Date.now(), since: since.toISOString(), results: out });
  } catch (err) {
    console.error('Debug endpoint error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
}
