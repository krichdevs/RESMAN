import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creating staff users with admin password policy...\n');

  // Delete existing STAFF only (keep ADMIN)
  const deletedStaff = await prisma.user.deleteMany({
    where: { role: 'STAFF' }
  });
  console.log(`✓ Deleted ${deletedStaff.count} staff users\n`);

  // Create staff passwords: minimum 8 chars, uppercase, @
  const staff1Password = 'Joseph@26';
  const staff2Password = 'David@2026';

  const hashedStaff1Password = await bcrypt.hash(staff1Password, 10);
  const hashedStaff2Password = await bcrypt.hash(staff2Password, 10);

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
  console.log('            📋 STAFF LOGIN CREDENTIALS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('👨‍💼 STAFF 1:');
  console.log(`   Email:    dr.mensah@central.edu`);
  console.log(`   Password: ${staff1Password}`);
  console.log(`   Portal:   Student Portal`);
  console.log(`   Dashboard: Staff Dashboard\n`);

  console.log('👨‍💼 STAFF 2:');
  console.log(`   Email:    mr.boateng@central.edu`);
  console.log(`   Password: ${staff2Password}`);
  console.log(`   Portal:   Student Portal`);
  console.log(`   Dashboard: Staff Dashboard\n`);

  console.log('═══════════════════════════════════════════════════════\n');

  console.log('✨ Staff setup complete!');
  console.log('   - Login via student portal');
  console.log('   - Access staff-specific dashboard');
  console.log('   - Staff password policy: minimum 8 chars, uppercase, @ sign');
  console.log('   - Admin password policy: minimum 11 chars, uppercase, @ sign\n');

  await prisma.$disconnect();
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
