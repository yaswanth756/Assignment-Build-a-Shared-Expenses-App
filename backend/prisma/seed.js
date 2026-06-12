/**
 * Database Seed File — Creates test data for development.
 *
 * Run with: npm run prisma:seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  await prisma.expenseComment.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('password123', salt);

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      passwordHash,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      passwordHash,
    },
  });

  const diana = await prisma.user.create({
    data: {
      name: 'Diana Prince',
      email: 'diana@example.com',
      passwordHash,
    },
  });

  console.log('✅ Created 4 users (password: password123)');
  console.log(`   - Alice: ${alice.email}`);
  console.log(`   - Bob: ${bob.email}`);
  console.log(`   - Charlie: ${charlie.email}`);
  console.log(`   - Diana: ${diana.email}\n`);

  // Create groups
  const tripGroup = await prisma.group.create({
    data: {
      name: 'Goa Trip 2026',
      description: 'Expenses for our Goa trip in June 2026',
      createdBy: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const houseGroup = await prisma.group.create({
    data: {
      name: 'Apartment Expenses',
      description: 'Monthly shared apartment expenses',
      createdBy: bob.id,
      members: {
        create: [
          { userId: bob.id, role: 'ADMIN' },
          { userId: alice.id, role: 'MEMBER' },
          { userId: diana.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✅ Created 2 groups');
  console.log(`   - ${tripGroup.name} (Alice, Bob, Charlie)`);
  console.log(`   - ${houseGroup.name} (Bob, Alice, Diana)\n`);

  // Create expenses in Goa Trip group
  const dinner = await prisma.expense.create({
    data: {
      groupId: tripGroup.id,
      description: 'Beach dinner at Tito\'s',
      amount: 3000,
      paidBy: alice.id,
      splitType: 'EQUAL',
      createdBy: alice.id,
      splits: {
        create: [
          { userId: alice.id, amount: 1000 },
          { userId: bob.id, amount: 1000 },
          { userId: charlie.id, amount: 1000 },
        ],
      },
    },
  });

  const hotel = await prisma.expense.create({
    data: {
      groupId: tripGroup.id,
      description: 'Hotel booking (3 nights)',
      amount: 9000,
      paidBy: bob.id,
      splitType: 'EQUAL',
      createdBy: bob.id,
      splits: {
        create: [
          { userId: alice.id, amount: 3000 },
          { userId: bob.id, amount: 3000 },
          { userId: charlie.id, amount: 3000 },
        ],
      },
    },
  });

  const taxi = await prisma.expense.create({
    data: {
      groupId: tripGroup.id,
      description: 'Airport taxi',
      amount: 1500,
      paidBy: charlie.id,
      splitType: 'UNEQUAL',
      createdBy: charlie.id,
      splits: {
        create: [
          { userId: alice.id, amount: 600 },
          { userId: bob.id, amount: 400 },
          { userId: charlie.id, amount: 500 },
        ],
      },
    },
  });

  console.log('✅ Created 3 expenses in Goa Trip group');
  console.log(`   - Dinner: ₹3000 (Equal, paid by Alice)`);
  console.log(`   - Hotel: ₹9000 (Equal, paid by Bob)`);
  console.log(`   - Taxi: ₹1500 (Unequal, paid by Charlie)\n`);

  // Create expenses in Apartment group
  const rent = await prisma.expense.create({
    data: {
      groupId: houseGroup.id,
      description: 'June Rent',
      amount: 30000,
      paidBy: bob.id,
      splitType: 'EQUAL',
      createdBy: bob.id,
      splits: {
        create: [
          { userId: bob.id, amount: 10000 },
          { userId: alice.id, amount: 10000 },
          { userId: diana.id, amount: 10000 },
        ],
      },
    },
  });

  const groceries = await prisma.expense.create({
    data: {
      groupId: houseGroup.id,
      description: 'Weekly groceries',
      amount: 2400,
      paidBy: alice.id,
      splitType: 'PERCENTAGE',
      createdBy: alice.id,
      splits: {
        create: [
          { userId: bob.id, amount: 960, percentage: 40 },
          { userId: alice.id, amount: 720, percentage: 30 },
          { userId: diana.id, amount: 720, percentage: 30 },
        ],
      },
    },
  });

  console.log('✅ Created 2 expenses in Apartment group');
  console.log(`   - Rent: ₹30000 (Equal, paid by Bob)`);
  console.log(`   - Groceries: ₹2400 (Percentage, paid by Alice)\n`);

  // Create a settlement
  const settlement = await prisma.settlement.create({
    data: {
      groupId: tripGroup.id,
      paidBy: bob.id,
      paidTo: alice.id,
      amount: 1000,
    },
  });

  console.log('✅ Created 1 settlement');
  console.log(`   - Bob paid Alice ₹1000 in Goa Trip\n`);

  // Create some comments
  await prisma.expenseComment.createMany({
    data: [
      {
        expenseId: dinner.id,
        userId: bob.id,
        content: 'That was an amazing dinner! 🍽️',
      },
      {
        expenseId: dinner.id,
        userId: charlie.id,
        content: 'Agreed! The seafood was incredible.',
      },
      {
        expenseId: hotel.id,
        userId: alice.id,
        content: 'Great hotel pick, Bob! 🏨',
      },
    ],
  });

  console.log('✅ Created 3 expense comments\n');
  console.log('─────────────────────────────────────');
  console.log('🎉 Database seeded successfully!');
  console.log('─────────────────────────────────────');
  console.log('\nTest credentials:');
  console.log('  Email: alice@example.com');
  console.log('  Password: password123');
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
