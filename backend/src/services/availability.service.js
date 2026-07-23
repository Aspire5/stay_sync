const prisma = require('../prisma');

function checkOverlap(checkIn1, checkOut1, checkIn2, checkOut2) {
  return checkIn1 < checkOut2 && checkOut1 > checkIn2;
}

function formatDateIso(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function getCalendarDays(year, month) {
  // Ensure default property exists
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
  const todayStr = formatDateIso(new Date());

  // Date range bounds for padding month calculation
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const startDate = new Date(year, month, 1 - startDayOfWeek);
  const endDate = new Date(year, month + 1, 42 - (lastDayOfMonth.getDate() + startDayOfWeek));

  const startIso = formatDateIso(startDate);
  const endIso = formatDateIso(endDate);

  // Fetch price overrides in range
  const overrides = await prisma.unitPriceOverride.findMany({
    where: {
      unitId: unit.id,
      date: {
        gte: new Date(startIso),
        lte: new Date(endIso),
      },
    },
  });

  const overrideMap = new Map();
  overrides.forEach((o) => {
    const iso = formatDateIso(new Date(o.date));
    overrideMap.set(iso, o);
  });

  // Fetch active reservations in range
  const reservations = await prisma.unitReservation.findMany({
    where: {
      unitId: unit.id,
      status: 'ACTIVE',
      checkIn: { lte: new Date(endIso) },
      checkOut: { gte: new Date(startIso) },
    },
  });

  const formattedReservations = reservations.map((r) => ({
    id: r.id,
    unitId: r.unitId,
    externalId: r.externalId,
    guestName: r.guestName,
    type: r.type,
    status: r.status,
    source: r.source,
    checkIn: formatDateIso(new Date(r.checkIn)),
    checkOut: formatDateIso(new Date(r.checkOut)),
  }));

  const days = [];

  // Generate 42-day calendar grid
  const curr = new Date(startDate);
  while (days.length < 42) {
    const dateStr = formatDateIso(curr);
    const dayNumber = curr.getDate();
    const isCurrentMonth = curr.getMonth() === month;

    const override = overrideMap.get(dateStr);
    const price = override ? override.price : property.baseRate;

    // Filter active reservations covering this date (checkIn <= dateStr < checkOut)
    const activeRes = formattedReservations.filter(
      (r) => r.checkIn <= dateStr && dateStr < r.checkOut
    );

    const totalUnits = property.units.length || 1;
    const bookedUnits = activeRes.length;
    const availableUnits = Math.max(0, totalUnits - bookedUnits);

    let status = 'AVAILABLE';
    if (activeRes.length > 0) {
      status = activeRes[0].type === 'BLOCK' ? 'BLOCKED' : 'BOOKED';
    }

    days.push({
      date: dateStr,
      dayNumber,
      isCurrentMonth,
      isToday: dateStr === todayStr,
      isSelected: false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
      price,
      hasPriceOverride: !!override,
      status,
      totalUnits,
      bookedUnits,
      availableUnits,
      reservation: activeRes[0],
      reservations: activeRes,
      priceOverride: override,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return days;
}

module.exports = {
  checkOverlap,
  formatDateIso,
  getCalendarDays,
};
