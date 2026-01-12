import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating student accounts with proper departments...\n');

  // Update mikebrown
  const updatedMike = await prisma.user.update({
    where: { email: 'mikebrown@central.edu' },
    data: {
      department: 'Computer Science'
    }
  });
  console.log('✅ Updated: Mike Brown');
  console.log(`   Email: ${updatedMike.email}`);
  console.log(`   Department: ${updatedMike.department}`);
  console.log(`   Role: ${updatedMike.role}\n`);

  // Update macbills
  const updatedMac = await prisma.user.update({
    where: { email: 'macbills@central.edu' },
    data: {
      department: 'Information Technology'
    }
  });
  console.log('✅ Updated: Mac Bills');
  console.log(`   Email: ${updatedMac.email}`);
  console.log(`   Department: ${updatedMac.department}`);
  console.log(`   Role: ${updatedMac.role}\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('            📋 STUDENT ACCOUNTS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('👤 STUDENT 1:');
  console.log(`   Email:      mikebrown@central.edu`);
  console.log(`   Password:   Blacksudo`);
  console.log(`   Department: Computer Science`);
  console.log(`   Portal:     Student Portal\n`);

  console.log('👤 STUDENT 2:');
  console.log(`   Email:      macbills@central.edu`);
  console.log(`   Password:   Chris@1124`);
  console.log(`   Department: Information Technology`);
  console.log(`   Portal:     Student Portal\n`);

  console.log('═══════════════════════════════════════════════════════\n');

  // Get total counts
  const studentCount = await prisma.user.count({
    where: { role: 'STUDENT' }
  });
  const staffCount = await prisma.user.count({
    where: { role: 'STAFF' }
  });
  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' }
  });

  console.log('📊 DATABASE SUMMARY:');
  console.log(`   Total Students: ${studentCount}`);
  console.log(`   Total Staff: ${staffCount}`);
  console.log(`   Total Admin: ${adminCount}`);
  console.log(`   TOTAL USERS: ${studentCount + staffCount + adminCount}\n`);

  console.log('ℹ️  The 124 seeded students were imported with index numbers');
  console.log('   (INT/23/01/XXXX format) from the seed script.\n');

  await prisma.$disconnect();
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
