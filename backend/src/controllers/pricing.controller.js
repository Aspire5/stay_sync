const prisma = require('../prisma');
const { formatDateIso } = require('../services/availability.service');

async function setPriceOverride(req, res, next) {
  try {
    const { startDate, endDate, price } = req.body;

    if (!startDate || !endDate || !price) {
      return res.status(400).json({
        success: false,
        error: 'startDate, endDate, and price are required.',
      });
    }

    const priceInt = parseInt(price);
    if (isNaN(priceInt) || priceInt <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive integer.',
      });
    }

    let unit = await prisma.unit.findFirst();

    let curr = new Date(startDate);
    const end = new Date(endDate);

    while (curr <= end) {
      const dateStr = formatDateIso(curr);
      const dateObj = new Date(dateStr);

      await prisma.unitPriceOverride.upsert({
        where: {
          unitId_date: {
            unitId: unit.id,
            date: dateObj,
          },
        },
        update: {
          price: priceInt,
          source: 'MANUAL',
        },
        create: {
          unitId: unit.id,
          date: dateObj,
          price: priceInt,
          source: 'MANUAL',
        },
      });

      curr.setDate(curr.getDate() + 1);
    }

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  setPriceOverride,
};
