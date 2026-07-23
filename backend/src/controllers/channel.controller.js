const { importChannelFeed } = require('../services/reconciliation.service');

async function importFeed(req, res, next) {
  try {
    const summary = await importChannelFeed();
    return res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  importFeed,
};
