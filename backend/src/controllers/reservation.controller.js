const prisma = require('../prisma');
const { checkOverlap, formatDateIso } = require('../services/availability.service');

async function createBooking(req, res, next) {
  try {
    const { guestName, checkIn, checkOut } = req.body;

    if (!guestName || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'guestName, checkIn, and checkOut are required.',
      });
    }

    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Check-out date must be after check-in date.',
      });
    }

    let unit = await prisma.unit.findFirst();
    if (!unit) {
      const property = await prisma.property.findFirst({ include: { units: true } });
      unit = property.units[0];
    }

    // Exclusive Check-out Overlap Validation against active bookings/blocks
    const existing = await prisma.unitReservation.findMany({
      where: {
        unitId: unit.id,
        status: 'ACTIVE',
      },
    });

    const activeResFormatted = existing.map((r) => ({
      ...r,
      checkIn: formatDateIso(new Date(r.checkIn)),
      checkOut: formatDateIso(new Date(r.checkOut)),
    }));

    const conflict = activeResFormatted.find((r) =>
      checkOverlap(checkIn, checkOut, r.checkIn, r.checkOut)
    );

    if (conflict) {
      const typeLabel = conflict.type === 'BLOCK' ? 'blocked period' : 'existing booking';
      return res.status(400).json({
        success: false,
        error: `Date range (${checkIn} to ${checkOut}) clashes with a ${typeLabel} (${conflict.guestName}: ${conflict.checkIn} to ${conflict.checkOut}).`,
      });
    }

    const reservation = await prisma.unitReservation.create({
      data: {
        unitId: unit.id,
        guestName,
        type: 'BOOKING',
        status: 'ACTIVE',
        source: 'MANUAL',
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
      },
    });

    return res.status(201).json({
      success: true,
      reservation: {
        ...reservation,
        checkIn: formatDateIso(new Date(reservation.checkIn)),
        checkOut: formatDateIso(new Date(reservation.checkOut)),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function blockDates(req, res, next) {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required.',
      });
    }

    let unit = await prisma.unit.findFirst();

    const existing = await prisma.unitReservation.findMany({
      where: {
        unitId: unit.id,
        status: 'ACTIVE',
        type: 'BOOKING',
      },
    });

    const activeBookingsFormatted = existing.map((r) => ({
      ...r,
      checkIn: formatDateIso(new Date(r.checkIn)),
      checkOut: formatDateIso(new Date(r.checkOut)),
    }));

    const conflict = activeBookingsFormatted.find((r) =>
      checkOverlap(startDate, endDate, r.checkIn, r.checkOut)
    );

    if (conflict) {
      return res.status(400).json({
        success: false,
        error: `Cannot block range (${startDate} to ${endDate}) because it overlaps with active booking for ${conflict.guestName}.`,
      });
    }

    const blockRes = await prisma.unitReservation.create({
      data: {
        unitId: unit.id,
        guestName: reason || 'Owner Block',
        type: 'BLOCK',
        status: 'ACTIVE',
        source: 'MANUAL',
        checkIn: new Date(startDate),
        checkOut: new Date(endDate),
      },
    });

    return res.status(201).json({ success: true, reservation: blockRes });
  } catch (error) {
    next(error);
  }
}

async function unblockDates(req, res, next) {
  try {
    const { startDate, endDate } = req.body;

    let unit = await prisma.unit.findFirst();

    const activeBlocks = await prisma.unitReservation.findMany({
      where: {
        unitId: unit.id,
        status: 'ACTIVE',
        type: 'BLOCK',
      },
    });

    for (const block of activeBlocks) {
      const bCheckIn = formatDateIso(new Date(block.checkIn));
      const bCheckOut = formatDateIso(new Date(block.checkOut));
      if (checkOverlap(startDate, endDate, bCheckIn, bCheckOut)) {
        await prisma.unitReservation.update({
          where: { id: block.id },
          data: { status: 'CANCELLED' },
        });
      }
    }

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const { id } = req.params;

    const reservation = await prisma.unitReservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return res.json({ success: true, reservation });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  blockDates,
  unblockDates,
  cancelReservation,
};
