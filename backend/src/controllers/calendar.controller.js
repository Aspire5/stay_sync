const { getCalendarDays } = require('../services/availability.service');

async function getCalendar(req, res, next) {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const month = parseInt(req.query.month || new Date().getMonth());

    const days = await getCalendarDays(year, month);
    return res.json({ success: true, days });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCalendar,
};
