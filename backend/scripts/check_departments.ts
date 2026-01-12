import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking department distribution...\n');

  // Check departments table
  const departments = await prisma.department.findMany();
  console.log('Departments in database:');
  departments.forEach(d => console.log(`  ${d.code}: ${d.name}`));
  console.log();

  // Check user department distribution
  const userDepts = await prisma.user.groupBy({
    by: ['department'],
    _count: { department: true },
    orderBy: { _count: { department: 'desc' } },
  });

  console.log('User department distribution:');
  userDepts.forEach(d => console.log(`  "${d.department}": ${d._count.department} users`));
  console.log();

  // Check system users (non-students)
  const systemUsers = await prisma.user.findMany({
    where: { role: { not: 'STUDENT' } },
    select: { email: true, role: true, department: true },
    orderBy: { role: 'asc' },
  });

  console.log('System users:');
  systemUsers.forEach(u => console.log(`  ${u.role}: ${u.email} (${u.department})`));
  console.log();

  // Check student department distribution
  const studentDepts = await prisma.user.groupBy({
    by: ['department'],
    where: { role: 'STUDENT' },
    _count: { department: true },
    orderBy: { _count: { department: 'desc' } },
  });

  console.log('Student department distribution:');
  studentDepts.forEach(d => console.log(`  "${d.department}": ${d._count.department} students`));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });