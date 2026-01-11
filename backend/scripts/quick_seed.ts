import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  // Create admin
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      indexNumber: 'admin001',
      department: 'ADMIN',
    },
  });

  // Create student
  await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password,
      firstName: 'Student',
      lastName: 'User',
      role: 'STUDENT',
      indexNumber: 's0001',
      department: 'CS',
    },
  });

  // Create a sample room
  await prisma.room.upsert({
    where: { name: 'Room 101' },
    update: {},
    create: {
      name: 'Room 101',
      capacity: 30,
      building: 'Main',
      floor: '1',
      description: 'Lecture hall with projector',
      equipment: 'projector,whiteboard',
      isActive: true,
    },
  });

  console.log('Quick seed completed: admin@student@example.com (Password123!), student@example.com (Password123!), Room 101');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
