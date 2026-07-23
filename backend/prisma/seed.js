const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma Database Seed...');

  // Delete existing records to ensure a fresh Day 0 state with 0 bookings
  await prisma.unitReservation.deleteMany({});
  await prisma.unitPriceOverride.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.property.deleteMany({});

  // Seed 1 Property ("Seaside Cottage", base nightly rate £120)
  const property = await prisma.property.create({
    data: {
      name: 'Seaside Cottage',
      ownerName: 'PropertyFlow',
      baseRate: 120,
    },
  });

  // Seed 1 Bookable Unit ("Main Cottage Unit")
  const unit = await prisma.unit.create({
    data: {
      propertyId: property.id,
      name: 'Main Cottage Unit',
    },
  });

  console.log('✅ Seed completed successfully:');
  console.log(`   Property: ${property.name} (ID: ${property.id}, Base Rate: £${property.baseRate})`);
  console.log(`   Unit: ${unit.name} (ID: ${unit.id})`);
  console.log(`   Bookings: 0 (Fresh Day 0 state)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
