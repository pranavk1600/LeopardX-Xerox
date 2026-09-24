import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with initial kiosk machine...');

  const machineCode = 'PUNE-COLLEGE-001';
  // Generate a secure 256-bit machine authentication token
  const token = crypto.randomBytes(32).toString('hex');

  const machine = await prisma.machine.upsert({
    where: { machineCode },
    update: {
      status: 'ONLINE',
      token,
    },
    create: {
      machineCode,
      name: 'Pune College Kiosk #1',
      location: 'Main Library Ground Floor',
      status: 'ONLINE',
      token,
    },
  });

  console.log('==================================================');
  console.log('✅ Machine Registered Successfully in Database:');
  console.log('Machine ID   :', machine.id);
  console.log('Machine Code :', machine.machineCode);
  console.log('Secure Token :', machine.token);
  console.log('==================================================');

  // Automatically update print-agent/.env with the generated token
  const printAgentEnvPath = path.resolve(__dirname, '../../print-agent/.env');
  if (fs.existsSync(printAgentEnvPath)) {
    let envContent = fs.readFileSync(printAgentEnvPath, 'utf-8');
    if (envContent.includes('MACHINE_TOKEN=')) {
      envContent = envContent.replace(/MACHINE_TOKEN=.*/, `MACHINE_TOKEN="${token}"`);
    } else {
      envContent += `\nMACHINE_TOKEN="${token}"\n`;
    }
    fs.writeFileSync(printAgentEnvPath, envContent, 'utf-8');
    console.log('✅ Updated print-agent/.env with the registered secure MACHINE_TOKEN.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
