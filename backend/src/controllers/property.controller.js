const prisma = require('../prisma');

async function getDefaultProperty(req, res, next) {
  try {
    let property = await prisma.property.findFirst({
      include: { units: true },
    });

    if (!property || property.units.length === 0) {
      property = await prisma.property.create({
        data: {
          name: 'Seaside Cottage',
          ownerName: 'PropertyFlow',
          baseRate: 120,
          units: {
            create: { name: 'Main Cottage Unit' },
          },
        },
        include: { units: true },
      });
    }

    const unit = property.units[0];

    return res.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
        ownerName: property.ownerName,
        baseRate: property.baseRate,
        totalUnits: property.units.length,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
      unit: {
        id: unit.id,
        propertyId: unit.propertyId,
        name: unit.name,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDefaultProperty,
};
