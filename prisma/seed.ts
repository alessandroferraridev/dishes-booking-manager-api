import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

async function main() {
  const adapter = new PrismaPg({
    connectionString: getRequiredEnv('DATABASE_URL'),
  });

  const prisma = new PrismaClient({ adapter });

  const email = getRequiredEnv('ADMIN_EMAIL');
  const password = getRequiredEnv('ADMIN_PASSWORD');

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.$disconnect();

  console.log(`Admin user ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
