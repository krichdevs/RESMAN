import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Quick script to create or update an admin user with stricter password rules.
 * Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in env, or edit the defaults below.
 */

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@central.edu';
const ADMIN_INDEX = process.env.ADMIN_INDEX || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

function validateAdminPassword(pw: string) {
  if (pw.length < 11) throw new Error('Admin password must be at least 11 characters');
  if (!/[A-Z]/.test(pw)) throw new Error('Admin password must contain at least one uppercase letter');
  if (!/@/.test(pw)) throw new Error('Admin password must contain an @ symbol');
}

async function main() {
  console.log('Creating/updating admin:', ADMIN_EMAIL, 'index:', ADMIN_INDEX);
  validateAdminPassword(ADMIN_PASSWORD);

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashed,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      indexNumber: ADMIN_INDEX,
      department: 'IT Department',
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashed,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      indexNumber: ADMIN_INDEX,
      department: 'IT Department',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Admin upserted:', user.email, 'role:', user.role);
}

main()
  .catch((e) => {
    console.error('Failed to create admin:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

