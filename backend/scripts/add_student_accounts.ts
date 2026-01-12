import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for manually created student accounts...\n');

  // Search for the two accounts
  const mikeBrown = await prisma.user.findUnique({
    where: { email: 'mikebrown@central.edu' }
  });

  const macBills = await prisma.user.findUnique({
    where: { email: 'macbills@central.edu' }
  });

  console.log('=== SEARCHING FOR MANUALLY CREATED ACCOUNTS ===\n');

  if (!mikeBrown && !macBills) {
    console.log('❌ Neither account found. Creating them now...\n');

    // Hash the passwords
    const hashBrown = await bcrypt.hash('Blacksudo', 10);
    const hashBills = await bcrypt.hash('Chris@1124', 10);

    // Create mikebrown account
    const newMikeBrown = await prisma.user.create({
      data: {
        email: 'mikebrown@central.edu',
        password: hashBrown,
        firstName: 'Mike',
        lastName: 'Brown',
        role: 'STUDENT',
        indexNumber: 'STU_MIKE_001',
        department: 'Computer Science',
        isActive: true,
        emailVerified: true,
      }
    });
    console.log('✅ Created: Mike Brown');
    console.log(`   Email: mikebrown@central.edu`);
    console.log(`   Password: Blacksudo`);
    console.log(`   Department: Computer Science\n`);

    // Create macbills account
    const newMacBills = await prisma.user.create({
      data: {
        email: 'macbills@central.edu',
        password: hashBills,
        firstName: 'Mac',
        lastName: 'Bills',
        role: 'STUDENT',
        indexNumber: 'STU_MAC_001',
        department: 'Information Technology',
        isActive: true,
        emailVerified: true,
      }
    });
    console.log('✅ Created: Mac Bills');
    console.log(`   Email: macbills@central.edu`);
    console.log(`   Password: Chris@1124`);
    console.log(`   Department: Information Technology\n`);

  } else {
    console.log('✅ Accounts found!\n');
    if (mikeBrown) {
      console.log(`Mike Brown:`);
      console.log(`  Email: ${mikeBrown.email}`);
      console.log(`  Role: ${mikeBrown.role}`);
      console.log(`  Department: ${mikeBrown.department}`);
      console.log(`  Active: ${mikeBrown.isActive}\n`);
    }
    if (macBills) {
      console.log(`Mac Bills:`);
      console.log(`  Email: ${macBills.email}`);
      console.log(`  Role: ${macBills.role}`);
      console.log(`  Department: ${macBills.department}`);
      console.log(`  Active: ${macBills.isActive}\n`);
    }
  }

  // Get total student count
  const studentCount = await prisma.user.count({
    where: { role: 'STUDENT' }
  });

  console.log('═══════════════════════════════════════════');
  console.log(`📊 Total STUDENT users: ${studentCount}`);
  console.log('═══════════════════════════════════════════\n');

  // Show details about the 124 students
  console.log('ℹ️  The 124 students were seeded from the database seed script.');
  console.log('   They include students from Computer Science department');
  console.log('   with index numbers like INT/23/01/XXXX\n');

  await prisma.$disconnect();
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
