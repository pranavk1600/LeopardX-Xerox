import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing database payment records with real Cashfree transactions...');

  // 1. Update the ₹4.00 Cashfree transaction from 30 Sep 2026 (Order ORDER_61aaf763...)
  const p4 = await prisma.payment.findFirst({
    where: { orderId: { contains: '61aaf763-93f5-4ab9-b3e1-f7ba7b4e8d49' } },
  });

  if (p4) {
    await prisma.payment.update({
      where: { id: p4.id },
      data: {
        status: 'SUCCESS',
        paymentId: '6617659096',
        updatedAt: new Date('2026-09-30T05:33:31.118Z'),
      },
    });
    console.log('✅ Updated 30 Sep ₹4 payment to SUCCESS (paymentId: 6617659096)');
  }

  // 2. Mark old development mock test payments (from 21 Sep) as FAILED so only real Cashfree transactions display
  const mockCleaned = await prisma.payment.updateMany({
    where: {
      createdAt: { lt: new Date('2026-09-22T00:00:00.000Z') },
    },
    data: {
      status: 'FAILED',
    },
  });
  console.log(`✅ Cleaned up ${mockCleaned.count} mock test payments from 21 Sep.`);

  // 3. Print all current SUCCESS payments in DB
  const successPayments = await prisma.payment.findMany({
    where: { status: 'SUCCESS' },
    include: { printJob: true },
    orderBy: { updatedAt: 'desc' },
  });

  console.log('==================================================');
  console.log('Real SUCCESS Payments in DB:');
  successPayments.forEach((p) => {
    console.log(`- Amount: ₹${p.amount} | Payment ID: ${p.paymentId} | Transaction Date: ${p.updatedAt.toISOString()} | Job ID: ${p.printJobId}`);
  });
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('Error syncing payments:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
