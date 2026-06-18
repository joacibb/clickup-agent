function parseDate(val) {
  if (val == null) return null;
  // If it's already a Date
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val;
  }

  // If it's a number (ms or seconds)
  if (typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    // maybe seconds
    const d2 = new Date(val * 1000);
    return isNaN(d2.getTime()) ? null : d2;
  }

  // If it's a string
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Pure digits -> could be seconds or ms
    if (/^\d+$/.test(trimmed)) {
      // pick milliseconds if length >=13, else seconds
      if (trimmed.length >= 13) {
        const d = new Date(Number(trimmed));
        return isNaN(d.getTime()) ? null : d;
      }
      // treat as seconds
      const d2 = new Date(Number(trimmed) * 1000);
      if (!isNaN(d2.getTime())) return d2;
      // fallback to ms
      const d3 = new Date(Number(trimmed));
      return isNaN(d3.getTime()) ? null : d3;
    }

    // Try ISO / RFC parsing
    const di = new Date(trimmed);
    if (!isNaN(di.getTime())) return di;

    // Try extracting digits inside string
    const digits = trimmed.match(/\d{10,13}/);
    if (digits) {
      const n = digits[0];
      const maybeMs = new Date(Number(n));
      if (!isNaN(maybeMs.getTime())) return maybeMs;
      const maybeSec = new Date(Number(n) * 1000);
      if (!isNaN(maybeSec.getTime())) return maybeSec;
    }
  }

  return null;
}

export async function getRecentUpdates({ CLICKUP_TOKEN, USER_ID, TEAM_ID, HOURS_BACK = 2 } = {}) {
  if (!CLICKUP_TOKEN) throw new Error('Missing CLICKUP_TOKEN');
  if (!USER_ID) throw new Error('Missing USER_ID');
  if (!TEAM_ID) throw new Error('Missing_TEAM_ID');

  const hoursBack = Number(HOURS_BACK) || 2;
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const dateGt = since.getTime(); // ms
  const headers = { Authorization: CLICKUP_TOKEN };

  // Fetch tasks assigned to the user updated since 'dateGt'
  const tasksUrl = `https://api.clickup.com/api/v2/team/${TEAM_ID}/task?assignees[]=${USER_ID}&date_updated_gt=${dateGt}&include_closed=false&subtasks=true`;
  const tasksRes = await fetch(tasksUrl, { headers });
  if (!tasksRes.ok) {
    const text = await tasksRes.text().catch(() => '');
    throw new Error(`Failed fetching tasks: ${tasksRes.status} ${tasksRes.statusText} ${text}`);
  }
  const tasksData = await tasksRes.json();
  const tasks = tasksData.tasks || [];

  const results = [];

  for (const task of tasks) {
    const taskId = task.id;
    const taskName = task.name;
    const taskUrl = task.url;

    // Fetch comments for the task
    try {
      const commentsUrl = `https://api.clickup.com/api/v2/task/${taskId}/comment`;
      const commentsRes = await fetch(commentsUrl, { headers });
      if (!commentsRes.ok) {
        // skip comments on error for this task but continue
        console.warn(`Comments fetch failed for task ${taskId}: ${commentsRes.status}`);
      } else {
        const commentsData = await commentsRes.json();
        const comments = commentsData.comments || [];
        for (const c of comments) {
          // Parse date robustly
          const rawDate = c.date ?? c.created_at ?? c.date_created ?? null;
          const cDateObj = parseDate(rawDate);
          const cUserId = c.user && (c.user.id || c.user.user_id);

          const commentText = c.comment_text || c.text || c.message || c.body || (c.client_message && c.client_message.message) || null;

          if (cDateObj && cDateObj > since && String(cUserId) !== String(USER_ID)) {
            results.push({
              type: 'comment',
              taskId,
              taskName,
              taskUrl,
              text: commentText,
              date: cDateObj.getTime(),
              author: c.user && (c.user.username || c.user.email || c.user.email_address || c.user.id) || null,
              rawDate,
            });
          } else if (!cDateObj) {
            // include as debug info if there's no parsable date but there's content
            results.push({
              type: 'comment',
              taskId,
              taskName,
              taskUrl,
              text: commentText,
              date: null,
              author: c.user && (c.user.username || c.user.email || c.user.email_address || c.user.id) || null,
              rawDate,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`Error fetching comments for task ${taskId}:`, err.message || err);
    }

    // You can add other checks (status changes, attachments, etc.) here
  }

  // Filter out items without date or keep them? We'll prefer ones with date and sort; items without date go last
  results.sort((a, b) => (b.date || 0) - (a.date || 0));

  return results;
}
