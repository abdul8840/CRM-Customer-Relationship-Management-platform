const { sequelize } = require('../config/database');

const Role = require('./role.model')(sequelize);
const Permission = require('./permission.model')(sequelize);
const User = require('./user.model')(sequelize);
const RefreshToken = require('./refreshToken.model')(sequelize);
const Otp = require('./otp.model')(sequelize);
const LoginHistory = require('./loginHistory.model')(sequelize);
const AuditLog = require('./auditLog.model')(sequelize);

const Company = require('./company.model')(sequelize);
const Contact = require('./contact.model')(sequelize);
const Lead = require('./lead.model')(sequelize);
const Deal = require('./deal.model')(sequelize);
const Task = require('./task.model')(sequelize);
const Note = require('./note.model')(sequelize);
const Activity = require('./activity.model')(sequelize);
const Attachment = require('./attachment.model')(sequelize);

const Plan = require('./plan.model')(sequelize);
const Subscription = require('./subscription.model')(sequelize);
const Invoice = require('./invoice.model')(sequelize);
const Payment = require('./payment.model')(sequelize);

const Notification = require('./notification.model')(sequelize);
const Ticket = require('./ticket.model')(sequelize);
const TicketMessage = require('./ticketMessage.model')(sequelize);
const Faq = require('./faq.model')(sequelize);
const Announcement = require('./announcement.model')(sequelize);
const Setting = require('./setting.model')(sequelize);

// ===== Existing Auth associations =====
Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id', otherKey: 'permission_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', otherKey: 'role_id', as: 'roles' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Otp, { foreignKey: 'user_id', as: 'otps', onDelete: 'CASCADE' });
User.hasMany(LoginHistory, { foreignKey: 'user_id', as: 'loginHistory' });
LoginHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

// ===== CRM associations =====
Company.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
User.hasMany(Company, { foreignKey: 'owner_id', as: 'companies' });

Contact.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Contact.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Contact, { foreignKey: 'company_id', as: 'contacts' });

Lead.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

Deal.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Deal.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Deal.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Deal.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
Deal.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

Task.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

Note.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Attachment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ===== Billing =====
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Subscription.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });
User.hasOne(Subscription, { foreignKey: 'user_id', as: 'subscription' });

Invoice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Invoice.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription' });
Subscription.hasMany(Invoice, { foreignKey: 'subscription_id', as: 'invoices' });

Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Payment.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });

// ===== Support =====
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Ticket.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Ticket.hasMany(TicketMessage, { foreignKey: 'ticket_id', as: 'messages' });
TicketMessage.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
TicketMessage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize, Role, Permission, User, RefreshToken, Otp, LoginHistory, AuditLog,
  Company, Contact, Lead, Deal, Task, Note, Activity, Attachment,
  Plan, Subscription, Invoice, Payment,
  Notification, Ticket, TicketMessage, Faq, Announcement, Setting,
};