const prisma = require('../prisma');
const { checkOverlap, formatDateIso } = require('./availability.service');

const mockChannelFeed = [
  {
    id: '1001',
    guest: 'John D.',
    checkIn: '2026-08-10',
    checkOut: '2026-08-15',
  },
  {
    id: '1002',
    guest: 'Maria S.',
    checkIn: '2026-08-15',
    checkOut: '2026-08-20',
  },
  {
    id: '1001',
    guest: 'John D.',
    checkIn: '2026-08-10',
    checkOut: '2026-08-15',
  },
  {
    id: '0999',
    guest: '—',
    checkIn: '2026-08-01',
    checkOut: '2026-08-04',
  },
  {
    id: '1003',
    guest: 'Sam P.',
    checkIn: '2026-08-13',
    checkOut: '2026-08-17',
  },
];

async function importChannelFeed() {
  let unit = await prisma.unit.findFirst();
  if (!unit) {
    const property = await prisma.property.create({
      data: {
        name: 'Seaside Cottage',
        ownerName: 'PropertyFlow',
        baseRate: 120,
        units: { create: { name: 'Main Cottage Unit' } },
      },
      include: { units: true },
    });
    unit = property.units[0];
  }

  const existingReservations = await prisma.unitReservation.findMany({
    where: { unitId: unit.id, status: 'ACTIVE' },
  });

  const activeResFormatted = existingReservations.map((r) => ({
    ...r,
    checkIn: formatDateIso(new Date(r.checkIn)),
    checkOut: formatDateIso(new Date(r.checkOut)),
  }));

  const details = [];
  let importedCount = 0;
  let duplicatesSkipped = 0;
  let cancellationsProcessed = 0;
  let conflictsDetected = 0;

  const seenExternalIds = new Set();

  for (const item of mockChannelFeed) {
    // 1. Cancellation / Blank Guest handling
    if (!item.guest || item.guest === '—' || item.guest.trim() === '') {
      cancellationsProcessed++;
      details.push({
        feedId: item.id,
        guestName: item.guest || '—',
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        status: 'CANCELLED_IGNORED',
        reason: 'Feed entry represents a cancellation or unassigned block. Ignored.',
      });
      continue;
    }

    // 2. Deduplication check
    const existingInDb = activeResFormatted.find(
      (r) => r.externalId === item.id && r.status === 'ACTIVE'
    );

    if (existingInDb || seenExternalIds.has(item.id)) {
      duplicatesSkipped++;
      details.push({
        feedId: item.id,
        guestName: item.guest,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        status: 'DUPLICATE_SKIPPED',
        reason: `External reservation #${item.id} already ingested or duplicated in feed batch.`,
      });
      continue;
    }

    // 3. Exclusive Check-out Overlap Validation
    const conflictingRes = activeResFormatted.find((r) =>
      checkOverlap(item.checkIn, item.checkOut, r.checkIn, r.checkOut)
    );

    if (conflictingRes) {
      conflictsDetected++;
      details.push({
        feedId: item.id,
        guestName: item.guest,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        status: 'CONFLICT_DETECTED',
        reason: `Conflict: Range ${item.checkIn} to ${item.checkOut} clashes with existing ${conflictingRes.type.toLowerCase()} for ${conflictingRes.guestName} (${conflictingRes.checkIn} to ${conflictingRes.checkOut}).`,
      });
      continue;
    }

    // 4. Valid Import
    seenExternalIds.add(item.id);
    importedCount++;

    const newRes = await prisma.unitReservation.create({
      data: {
        unitId: unit.id,
        externalId: item.id,
        guestName: item.guest,
        type: 'BOOKING',
        status: 'ACTIVE',
        source: 'CHANNEL',
        checkIn: new Date(item.checkIn),
        checkOut: new Date(item.checkOut),
      },
    });

    activeResFormatted.push({
      ...newRes,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
    });

    details.push({
      feedId: item.id,
      guestName: item.guest,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      status: 'IMPORTED',
      reason: `Successfully reconciled as channel booking #${item.id}.`,
    });
  }

  return {
    importedCount,
    duplicatesSkipped,
    cancellationsProcessed,
    conflictsDetected,
    details,
  };
}

module.exports = {
  importChannelFeed,
};
