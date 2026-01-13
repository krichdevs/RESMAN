import { PrismaClient } from '@prisma/client';
// @ts-ignore
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing admin credentials to match latest CRED.md...');

  const adminPassword = await bcrypt.hash('Password123!', 10);

  // Update or create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@central.edu' },
    update: {
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      department: 'IT Department',
      phone: '+233 20 000 0001',
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: 'admin@central.edu',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      indexNumber: 'ADMIN_CENTRAL_NEW',
      department: 'IT Department',
      phone: '+233 20 000 0001',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Admin credentials updated:', admin.email);

  // Also add the other users from CRED.md if they don't exist
  const mikePassword = await bcrypt.hash('Blacksudo@1124', 10);
  const mike = await prisma.user.upsert({
    where: { email: 'mikebrown@central.edu' },
    update: { password: mikePassword },
    create: {
      email: 'mikebrown@central.edu',
      password: mikePassword,
      firstName: 'Mike',
      lastName: 'Brown',
      role: 'STAFF',
      indexNumber: 'STAFF_MIKE_001',
      department: 'IT',
      isActive: true,
      emailVerified: true,
    },
  });

  const macPassword = await bcrypt.hash('Chris@1124', 10);
  const mac = await prisma.user.upsert({
    where: { email: 'macbills@central.edu' },
    update: { password: macPassword },
    create: {
      email: 'macbills@central.edu',
      password: macPassword,
      firstName: 'Mac',
      lastName: 'Bills',
      role: 'STAFF',
      indexNumber: 'STAFF_MAC_001',
      department: 'CS',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Additional users updated:', mike.email, mac.email);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });