import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Cleaning up seeded students...\n');
  console.log('⚠️  Deleting all seeded students (keeping manually created ones)\n');

  // Get count of students to delete (exclude mikebrown and macbills)
  const studentsToDelete = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      email: {
        notIn: ['mikebrown@central.edu', 'macbills@central.edu']
      }
    },
    select: { email: true }
  });

  console.log(`Found ${studentsToDelete.length} seeded students to delete...\n`);

  // Delete seeded students
  const deleted = await prisma.user.deleteMany({
    where: {
      role: 'STUDENT',
      email: {
        notIn: ['mikebrown@central.edu', 'macbills@central.edu']
      }
    }
  });

  console.log(`✅ Deleted ${deleted.count} seeded students\n`);

  // Get final database state
  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' }
  });

  const staffCount = await prisma.user.count({
    where: { role: 'STAFF' }
  });

  const studentCount = await prisma.user.count({
    where: { role: 'STUDENT' }
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('           📊 CLEAN DATABASE STATE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('✅ ADMIN (1):');
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  console.log(`   • admin@central.edu\n`);

  console.log('✅ STAFF (2):');
  const staffUsers = await prisma.user.findMany({
    where: { role: 'STAFF' }
  });
  staffUsers.forEach(s => {
    console.log(`   • ${s.email}`);
  });
  console.log();

  console.log('✅ TEST STUDENTS (2):');
  const testStudents = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      email: {
        in: ['mikebrown@central.edu', 'macbills@central.edu']
      }
    }
  });
  testStudents.forEach(s => {
    console.log(`   • ${s.email} (${s.department})`);
  });
  console.log();

  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total Users: ${adminCount + staffCount + studentCount}`);
  console.log('  - Admin: 1');
  console.log('  - Staff: 2');
  console.log(`  - Students: ${studentCount}`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🎉 Database cleaned!');
  console.log('📝 Students can now register through the portal');
  console.log('🔐 They will create their own passwords during registration\n');

  await prisma.$disconnect();
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
