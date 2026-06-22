const { Activity } = require('../models');

module.exports = async ({ user, type, title, description, relatedToType, relatedToId, meta }) => {
  try {
    await Activity.create({
      user_id: user?.id || null,
      type, title, description,
      related_to_type: relatedToType, related_to_id: relatedToId,
      meta,
    });
  } catch (_) {}
};