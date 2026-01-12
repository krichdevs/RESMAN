import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Cleaning up and creating new admin & staff users...\n');

  // Delete all existing ADMIN and STAFF
  const deletedAdmins = await prisma.user.deleteMany({
    where: { role: 'ADMIN' }
  });
  console.log(`✓ Deleted ${deletedAdmins.count} admin users`);

  const deletedStaff = await prisma.user.deleteMany({
    where: { role: 'STAFF' }
  });
  console.log(`✓ Deleted ${deletedStaff.count} staff users\n`);

  // Create new credentials
  const adminPassword = 'Admin@2026Secure';
  const staff1Password = 'Staff1@2026Pass';
  const staff2Password = 'Staff2@2026Pass';

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const hashedStaff1Password = await bcrypt.hash(staff1Password, 10);
  const hashedStaff2Password = await bcrypt.hash(staff2Password, 10);

  // Create ADMIN
  const admin = await prisma.user.create({
    data: {
      email: 'admin@central.edu',
      password: hashedAdminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      indexNumber: 'ADMIN_001',
      department: 'IT Department',
      phone: '+233 200 000 001',
      isActive: true,
      emailVerified: true,
    }
  });
  console.log('✅ Admin user created\n');

  // Create STAFF 1
  const staff1 = await prisma.user.create({
    data: {
      email: 'dr.mensah@central.edu',
      password: hashedStaff1Password,
      firstName: 'Dr. Joseph',
      lastName: 'Mensah',
      role: 'STAFF',
      indexNumber: 'STAFF_001',
      department: 'Computer Science',
      phone: '+233 24 123 4567',
      isActive: true,
      emailVerified: true,
    }
  });
  console.log('✅ Staff user 1 created\n');

  // Create STAFF 2
  const staff2 = await prisma.user.create({
    data: {
      email: 'mr.boateng@central.edu',
      password: hashedStaff2Password,
      firstName: 'Mr. David',
      lastName: 'Boateng',
      role: 'STAFF',
      indexNumber: 'STAFF_002',
      department: 'Information Technology',
      phone: '+233 24 234 5678',
      isActive: true,
      emailVerified: true,
    }
  });
  console.log('✅ Staff user 2 created\n');

  // Display credentials
  console.log('═══════════════════════════════════════════════════════');
  console.log('            📋 LOGIN CREDENTIALS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('👤 ADMINISTRATOR:');
  console.log(`   Email:    admin@central.edu`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role:     ADMIN\n`);

  console.log('👨‍💼 STAFF 1:');
  console.log(`   Email:    dr.mensah@central.edu`);
  console.log(`   Password: ${staff1Password}`);
  console.log(`   Role:     STAFF\n`);

  console.log('👨‍💼 STAFF 2:');
  console.log(`   Email:    mr.boateng@central.edu`);
  console.log(`   Password: ${staff2Password}`);
  console.log(`   Role:     STAFF\n`);

  console.log('═══════════════════════════════════════════════════════\n');

  console.log('✨ Setup complete! Users can login with the credentials above.');
  console.log('⚠️  Keep these credentials secure and change passwords on first login.\n');

  await prisma.$disconnect();
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
