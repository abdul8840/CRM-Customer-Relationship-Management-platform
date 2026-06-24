const cron = require('node-cron');
const { Op } = require('sequelize');
const { Task, User, Subscription, Plan } = require('../models');
const brevo = require('../services/brevo.service');
const notif = require('../modules/notification/notification.service');
const logger = require('../config/logger');

// Task reminders (every 5 minutes)
const taskReminders = () => cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const tasks = await Task.findAll({
    where: { reminder_sent: false, status: { [Op.in]: ['pending', 'in_progress'] }, reminder_at: { [Op.lte]: now, [Op.ne]: null } },
    include: [{ model: User, as: 'assignee' }],
  });
  for (const t of tasks) {
    const user = t.assignee || (await User.findByPk(t.owner_id));
    if (user?.email) await brevo.sendTaskReminder(user.email, { title: t.title, description: t.description, due_date: t.due_date });
    if (user) await notif.create({ userId: user.id, type: 'task.reminder', title: `⏰ ${t.title}`, message: t.description || 'Task reminder', data: { task_id: t.id } });
    await t.update({ reminder_sent: true });
  }
  if (tasks.length) logger.info(`Sent ${tasks.length} task reminders`);
});

// Subscription expiry check (daily 02:00)
const subscriptionExpiry = () => cron.schedule('0 2 * * *', async () => {
  const now = new Date();
  const expiring = await Subscription.findAll({
    where: { status: 'active', current_period_end: { [Op.lte]: now } },
    include: [{ model: Plan, as: 'plan' }, { model: User, as: 'user' }],
  });
  for (const s of expiring) {
    await s.update({ status: 'expired' });
    if (s.user) {
      await notif.create({ userId: s.user.id, type: 'subscription.expired', title: 'Subscription expired', message: `Your ${s.plan?.name} plan has expired. Renew to continue.` });
      brevo.sendSubscriptionUpdate(s.user.email, { action: 'expired', plan_name: s.plan?.name, status: 'expired' });
    }
  }
});

// Recurring task spawn (daily 01:00)
const recurringTasks = () => cron.schedule('0 1 * * *', async () => {
  const now = new Date();
  // find recurring completed tasks whose next spawn time has passed
  const list = await Task.findAll({
    where: {
      is_recurring: true, status: 'completed',
      recurrence_pattern: { [Op.in]: ['daily', 'weekly', 'monthly'] },
      completed_at: { [Op.ne]: null },
    },
  });

  let spawned = 0;
  for (const t of list) {
    const last = new Date(t.completed_at);
    const next = new Date(last);
    if (t.recurrence_pattern === 'daily') next.setDate(next.getDate() + 1);
    else if (t.recurrence_pattern === 'weekly') next.setDate(next.getDate() + 7);
    else if (t.recurrence_pattern === 'monthly') next.setMonth(next.getMonth() + 1);
    if (next > now) continue;

    // check no duplicate already spawned
    const exists = await Task.count({
      where: { owner_id: t.owner_id, title: t.title, due_date: next, is_recurring: true },
    });
    if (exists) continue;

    await Task.create({
      owner_id: t.owner_id, assigned_to: t.assigned_to,
      related_to_type: t.related_to_type, related_to_id: t.related_to_id,
      title: t.title, description: t.description, type: t.type, priority: t.priority,
      due_date: next, reminder_at: next,
      is_recurring: true, recurrence_pattern: t.recurrence_pattern,
    });
    spawned++;
  }
  if (spawned) logger.info(`🔁 Spawned ${spawned} recurring task occurrences`);
});

const cleanup = () => cron.schedule('0 3 * * *', async () => {  // daily 03:00
  const now = new Date();
  const oldNotif = new Date(Date.now() - 60 * 86400000); // 60 days
  const oldActivity = new Date(Date.now() - 180 * 86400000); // 180 days

  const [t, o, n, a] = await Promise.all([
    RefreshToken.destroy({ where: { [Op.or]: [{ expires_at: { [Op.lt]: now } }, { revoked_at: { [Op.lt]: oldNotif } }] } }),
    Otp.destroy({ where: { [Op.or]: [{ expires_at: { [Op.lt]: now } }, { consumed_at: { [Op.lt]: oldNotif } }] } }),
    Notification.destroy({ where: { created_at: { [Op.lt]: oldNotif }, read_at: { [Op.ne]: null } } }),
    Activity.destroy({ where: { created_at: { [Op.lt]: oldActivity } } }),
  ]);
  logger.info(`🧹 Cleanup: tokens=${t}, otps=${o}, notifications=${n}, activities=${a}`);
});

module.exports = { start: () => { taskReminders(); subscriptionExpiry(); recurringTasks(); cleanup(); logger.info('⏰ Cron jobs started'); } };