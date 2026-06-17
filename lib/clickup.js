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
          // ClickUp returns date as string/number (ms) in c.date in some APIs
          const cDate = c.date ? new Date(Number(c.date)) : null;
          const cUserId = c.user && (c.user.id || c.user.user_id);

          const commentText = c.comment_text || c.text || c.message || c.body || (c.client_message && c.client_message.message) || null;

          if (cDate && cDate > since && String(cUserId) !== String(USER_ID)) {
            results.push({
              type: 'comment',
              taskId,
              taskName,
              taskUrl,
              text: commentText,
              date: cDate.getTime(),
              author: c.user && (c.user.username || c.user.email || c.user.email_address || c.user.id) || null,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`Error fetching comments for task ${taskId}:`, err.message || err);
    }

    // You can add other checks (status changes, attachments, etc.) here
  }

  // Sort newest first
  results.sort((a, b) => (b.date || 0) - (a.date || 0));

  return results;
}
