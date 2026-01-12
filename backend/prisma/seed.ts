import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('í¼± Starting database seeding for Central University Miotso Campus...');

  // ============================================
  // 1. CREATE DEPARTMENTS
  // ============================================
  const departments = [
    { code: 'CS', name: 'Computer Science' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'SE', name: 'Software Engineering' },
    { code: 'CE', name: 'Civil Engineering' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'EE', name: 'Electrical & Electronic Engineering' },
    { code: 'CHE', name: 'Chemical Engineering' },
    { code: 'AE', name: 'Aerospace Engineering' },
    { code: 'BUS', name: 'Business Administration' },
    { code: 'ACC', name: 'Accounting' },
  ];

  for (const d of departments) {
    try {
      await prisma.department.upsert({
        where: { code: d.code },
        update: {},
        create: d,
      });
    } catch (e) {
      // ignore
    }
  }
  console.log('âœ… Departments seeded');

  // ============================================
  // 2. CREATE ADMIN USER
  // ============================================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@miotso.centraluniversity.edu.gh' },
    update: {},
    create: {
      email: 'admin@miotso.centraluniversity.edu.gh',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      indexNumber: 'ADMIN_MIOTSO_001',
      department: 'IT Department',
      phone: '+233 20 000 0001',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('âœ… Admin user created:', admin.email);

  // ============================================
  // 3. CREATE STAFF USERS
  // ============================================
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staffUsers = [
    {
      email: 'dr.mensah@miotso.centraluniversity.edu.gh',
      firstName: 'Dr. Joseph',
      lastName: 'Mensah',
      role: 'STAFF',
      indexNumber: 'STAFF_001',
      department: 'CS',
      phone: '+233 24 123 4567',
    },
    {
      email: 'prof.adjei@miotso.centraluniversity.edu.gh',
      firstName: 'Prof. Kwame',
      lastName: 'Adjei',
      role: 'STAFF',
      indexNumber: 'STAFF_002',
      department: 'IT',
      phone: '+233 24 234 5678',
    },
    {
      email: 'mr.boateng@miotso.centraluniversity.edu.gh',
      firstName: 'Mr. David',
      lastName: 'Boateng',
      role: 'STAFF',
      indexNumber: 'STAFF_003',
      department: 'SE',
      phone: '+233 24 345 6789',
    },
  ];

  for (const staff of staffUsers) {
    await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: {
        ...staff,
        password: staffPassword,
        isActive: true,
        emailVerified: true,
      },
    });
  }
  console.log('âœ… Staff users created');

  // ============================================
  // 4. CREATE STUDENT USERS (Sample)
  // ============================================
  const studentPassword = await bcrypt.hash('student123', 10);
  const students = [
    { indexNumber: 'INT/23/01/0001', firstName: 'John', lastName: 'Doe', department: 'CS' },
    { indexNumber: 'INT/23/01/0002', firstName: 'Jane', lastName: 'Smith', department: 'IT' },
    { indexNumber: 'INT/23/01/0003', firstName: 'Michael', lastName: 'Johnson', department: 'SE' },
    { indexNumber: 'INT/23/01/0004', firstName: 'Sarah', lastName: 'Williams', department: 'CS' },
    { indexNumber: 'INT/23/01/0005', firstName: 'Emmanuel', lastName: 'Owusu', department: 'IT' },
  ];

  for (const student of students) {
    await prisma.user.upsert({
      where: { email: `${student.indexNumber.toLowerCase()}@student.centraluniversity.edu.gh` },
      update: {},
      create: {
        email: `${student.indexNumber.toLowerCase()}@student.centraluniversity.edu.gh`,
        password: studentPassword,
        firstName: student.firstName,
        lastName: student.lastName,
        role: 'STUDENT',
        indexNumber: student.indexNumber,
        department: student.department,
        phone: '+233 20 000 0000',
        isActive: true,
        emailVerified: true,
      },
    });
  }
  console.log('âœ… Student users created');

  // ============================================
  // 5. CREATE ROOMS - BLOCKS A-G
  // ============================================
  const rooms: any[] = [];

  // Blocks A-G with 8 classrooms each
  for (let block = 0; block < 7; block++) {
    const blockLetter = String.fromCharCode(65 + block); // A-G
    for (let i = 1; i <= 8; i++) {
      rooms.push({
        name: `${blockLetter}${100 + i}`,
        capacity: 40 + (i % 3) * 10,
        building: `Block ${blockLetter}`,
        floor: `Floor ${Math.ceil(i / 4)}`,
        description: `Classroom ${blockLetter}${100 + i}`,
        equipment: ['projector', 'whiteboard', 'air-conditioning'],
      });
    }
  }

  // Libraries
  rooms.push({
    name: 'LIB-MAIN',
    capacity: 200,
    building: 'Main Library',
    floor: 'Ground Floor',
    description: 'Main Library - Central study area',
    equipment: ['wifi', 'reading-tables', 'air-conditioning', 'computers'],
  });

  rooms.push({
    name: 'LIB-REF',
    capacity: 100,
    building: 'Reference Library',
    floor: 'First Floor',
    description: 'Reference Library - Specialized collections',
    equipment: ['wifi', 'reading-tables', 'air-conditioning', 'computers'],
  });

  // Labs
  rooms.push({
    name: 'LAB-COMP-A',
    capacity: 50,
    building: 'Computer Lab A',
    floor: 'Ground Floor',
    description: 'Computer Laboratory A',
    equipment: ['computers', 'projector', 'whiteboard', 'air-conditioning', 'networking-equipment'],
  });

  rooms.push({
    name: 'LAB-COMP-B',
    capacity: 50,
    building: 'Computer Lab B',
    floor: 'First Floor',
    description: 'Computer Laboratory B',
    equipment: ['computers', 'projector', 'whiteboard', 'air-conditioning', 'networking-equipment'],
  });

  rooms.push({
    name: 'LAB-SCI',
    capacity: 40,
    building: 'Science Lab',
    floor: 'Second Floor',
    description: 'Science Laboratory',
    equipment: ['lab-equipment', 'projector', 'whiteboard', 'air-conditioning', 'safety-equipment'],
  });

  // Create all rooms
  for (const roomData of rooms) {
    const room = await prisma.room.upsert({
      where: { name: roomData.name },
      update: {},
      create: {
        ...roomData,
        equipment: Array.isArray(roomData.equipment) ? roomData.equipment.join(',') : roomData.equipment,
        isActive: true,
      },
    });
    console.log('âœ… Room created:', room.name);

    // Create time slots for each room
    const timeSlots = [];
    for (let day = 1; day <= 5; day++) {
      const slots = [
        { startTime: '08:00', endTime: '09:30' },
        { startTime: '09:45', endTime: '11:15' },
        { startTime: '11:30', endTime: '13:00' },
        { startTime: '14:00', endTime: '15:30' },
        { startTime: '15:45', endTime: '17:15' },
        { startTime: '17:30', endTime: '19:00' },
      ];

      for (const slot of slots) {
        timeSlots.push({
          roomId: room.id,
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
        });
      }
    }

    for (const slotData of timeSlots) {
      try {
        await prisma.timeSlot.create({ data: slotData });
      } catch (error) {
        // Skip if exists
      }
    }
  }
  console.log('âœ… Time slots created');

  console.log('í¾‰ Database seeding completed!');
  console.log('í³Š Summary: 56 classrooms (Blocks A-G) + 2 libraries + 3 labs = 61 spaces');
}

main()
  .catch((e) => {
    console.error('âŒ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
