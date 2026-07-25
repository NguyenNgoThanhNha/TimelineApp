require('dotenv/config');
require('ts-node/register');
require('tsconfig-paths/register');

const { PrismaClient } = require('@prisma/client');
const {
  TimelineSeederService,
} = require('../src/modules/timeline/services/timeline-seeder.service');

async function main() {
  const prisma = new PrismaClient();
  const seeder = new TimelineSeederService(prisma);

  try {
    await seeder.onModuleInit();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
