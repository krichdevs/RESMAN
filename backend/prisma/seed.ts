import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@centraluniversity.edu.gh' },
    update: {},
    create: {
      email: 'admin@centraluniversity.edu.gh',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      indexNumber: 'admin_seed_001',
      department: 'IT Department',
      phone: '+233 20 000 0001',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create student users from Excel data
  const studentPassword = await bcrypt.hash('student123', 10);
  const students = [
    { indexNumber: 'INT/22/01/0527', firstName: 'OWUSU-ANSAH', lastName: 'PRINCE', groupName: null },
    { indexNumber: 'INT/22/01/1421', firstName: 'SUSUAWU JOJO', lastName: 'ASAMOAH', groupName: null },
    { indexNumber: 'INT/22/01/1800', firstName: 'ERSKINE ISAAC KOJO', lastName: 'AFINI', groupName: 'Alpha' },
    { indexNumber: 'INT/23/01/0092', firstName: 'QUAYE', lastName: 'EMMANUEL SIAW', groupName: null },
    { indexNumber: 'INT/23/01/0095', firstName: 'TWUMASI EUGENE', lastName: 'ADJEI', groupName: null },
    { indexNumber: 'INT/23/01/0124', firstName: 'QUAINOO', lastName: 'BERNICE', groupName: null },
    { indexNumber: 'INT/23/01/0129', firstName: 'AHENKORA ANGELA', lastName: 'ADOMAA', groupName: null },
    { indexNumber: 'INT/23/01/0132', firstName: 'DZAMESI NUNYA', lastName: 'AKU', groupName: null },
    { indexNumber: 'INT/23/01/0133', firstName: 'NYANFUL DANIEL', lastName: 'KOFI', groupName: null },
    { indexNumber: 'INT/23/01/0154', firstName: 'FIANKO ABENA', lastName: 'ADUBEA', groupName: null },
    { indexNumber: 'INT/23/01/0170', firstName: 'Obeng', lastName: 'Darrel', groupName: null },
    { indexNumber: 'INT/23/01/0178', firstName: 'LAMPTEY FRANCIS', lastName: 'ASARE', groupName: 'Beta' },
    { indexNumber: 'INT/23/01/0241', firstName: 'WILLIAMS', lastName: 'STEPHANIE', groupName: null },
    { indexNumber: 'INT/23/01/0360', firstName: 'YEVU', lastName: 'ROONEY', groupName: null },
    { indexNumber: 'INT/23/01/0392', firstName: 'Cisse Ghaniye Soumaye', lastName: 'Stella', groupName: null },
    { indexNumber: 'INT/23/01/0419', firstName: 'OBIRI EBENEZER', lastName: 'ANSAH', groupName: null },
    { indexNumber: 'INT/23/01/0433', firstName: 'TEYE LAURA KORKOR', lastName: 'SIKA', groupName: null },
    { indexNumber: 'INT/23/01/0436', firstName: 'ONYEKWERE MICHAEL', lastName: 'KOJO', groupName: null },
    { indexNumber: 'INT/23/01/0485', firstName: 'Adonteng Caleb', lastName: 'Kweku', groupName: null },
    { indexNumber: 'INT/23/01/0487', firstName: 'FRIMPONG', lastName: 'PRISCILLA', groupName: null },
    { indexNumber: 'INT/23/01/0577', firstName: 'LANE THOMAS OWUSU', lastName: 'JUNIOR', groupName: 'Gamma' },
    { indexNumber: 'INT/23/01/0599', firstName: 'ATTIPOE JOHN MAWULI', lastName: 'KOFI', groupName: null },
    { indexNumber: 'INT/23/01/0621', firstName: 'MIFETOO WENDY MAAME', lastName: 'SERWAA', groupName: null },
    { indexNumber: 'INT/23/01/0669', firstName: 'ESHUN', lastName: 'ISAIAH EBO', groupName: null },
    { indexNumber: 'INT/23/01/0670', firstName: 'ANTWI EUGENE', lastName: 'BOASIAKO', groupName: null },
    { indexNumber: 'INT/23/01/0765', firstName: 'POMARY MANUEL', lastName: 'KOBLA', groupName: null },
    { indexNumber: 'INT/23/01/0767', firstName: 'ANANI CHRIS', lastName: 'SELOM', groupName: null },
    { indexNumber: 'INT/23/01/0768', firstName: 'ACQUAH HERBERT', lastName: 'ANTWI-BEEKO', groupName: null },
    { indexNumber: 'INT/23/01/0775', firstName: 'ALIFO JOSHUA GATOR', lastName: 'AMEN', groupName: null },
    { indexNumber: 'INT/23/01/0798', firstName: 'ANNAN CYRIL CAPTAIN KWABENA', lastName: '', groupName: 'Delta' },
    { indexNumber: 'INT/23/01/0917', firstName: 'ELSON ANTHONY', lastName: 'GEORGE', groupName: null },
    { indexNumber: 'INT/23/01/0920', firstName: 'ARCHER', lastName: 'KELVIN YAW', groupName: null },
    { indexNumber: 'INT/23/01/0945', firstName: 'SAMSEDEEN', lastName: 'MUSHARAF', groupName: null },
    { indexNumber: 'INT/23/01/0949', firstName: 'ASEFUAH EZEKIEL', lastName: 'EKOW', groupName: null },
    { indexNumber: 'INT/23/01/0963', firstName: 'AWUKU', lastName: 'JOSEPH DOE', groupName: null },
    { indexNumber: 'INT/23/01/1011', firstName: 'FORSON NANA KWESI', lastName: 'OFFOH', groupName: null },
    { indexNumber: 'INT/23/01/1014', firstName: 'ESHUN', lastName: 'EMMANUELLA', groupName: null },
    { indexNumber: 'INT/23/01/1036', firstName: 'LARKOTEY LARTEY', lastName: 'FRANK', groupName: null },
    { indexNumber: 'INT/23/01/1044', firstName: 'ASHIE VICTORIA NAA', lastName: 'DEI', groupName: 'Epsilon' },
    { indexNumber: 'INT/23/01/1145', firstName: 'ARTHUR', lastName: 'CHRISTIAN', groupName: null },
    { indexNumber: 'INT/23/01/1184', firstName: 'ACHEAMPONG CALEB', lastName: 'KWESI TAWIAH', groupName: null },
    { indexNumber: 'INT/23/01/1225', firstName: 'Boakye', lastName: 'Samuel', groupName: null },
    { indexNumber: 'INT/23/01/1281', firstName: 'ONUMAH', lastName: 'SAMUEL NARH', groupName: null },
    { indexNumber: 'INT/23/01/1308', firstName: 'ACQUAYE', lastName: 'DANIEL', groupName: null },
    { indexNumber: 'INT/23/01/1312', firstName: 'ACHEAMPONG-OKYERE', lastName: 'JESSE', groupName: null },
    { indexNumber: 'INT/23/01/1313', firstName: 'ACHEAMPONG-OKYERE', lastName: 'JOSHUA', groupName: null },
    { indexNumber: 'INT/23/01/1343', firstName: 'Akorli Diana', lastName: 'Adamu', groupName: null },
    { indexNumber: 'INT/23/01/1351', firstName: 'WEMAKOR PANDIT', lastName: 'KORKU', groupName: 'Zeta' },
    { indexNumber: 'INT/23/01/1352', firstName: 'AMETEPEY DERRICK', lastName: 'DELALI', groupName: null },
    { indexNumber: 'INT/23/01/1359', firstName: 'Ampofo Joycelyn', lastName: 'Twumasi', groupName: null },
    { indexNumber: 'INT/23/01/1361', firstName: 'BOAMPONG', lastName: 'FREDA SERWAA', groupName: null },
    { indexNumber: 'INT/23/01/1368', firstName: 'SENOO', lastName: 'DENNIS YAO', groupName: null },
    { indexNumber: 'INT/23/01/1389', firstName: 'HAYFORD EKOW ODEI', lastName: 'ARTHUR', groupName: null },
    { indexNumber: 'INT/23/01/1392', firstName: 'KUSAH', lastName: 'ISRAEL TETTEY', groupName: null },
    { indexNumber: 'INT/23/01/1396', firstName: 'OKORIE', lastName: 'PRINCE KELECHI', groupName: null },
    { indexNumber: 'INT/23/01/1402', firstName: 'OFOSU', lastName: 'FRANK', groupName: 'Phi' },
    { indexNumber: 'INT/23/01/1407', firstName: 'SARPONG', lastName: 'ERIC OSEI', groupName: null },
    { indexNumber: 'INT/23/01/1413', firstName: 'Botchway Borketey Edward', lastName: '', groupName: null },
    { indexNumber: 'INT/23/01/1414', firstName: 'SAM', lastName: 'KENDREW', groupName: null },
    { indexNumber: 'INT/23/01/1419', firstName: 'AMOO BRENDA BERYL NAA', lastName: 'OFEIBEA', groupName: null },
    { indexNumber: 'INT/23/01/1420', firstName: 'MILLS', lastName: 'KARL LANTE', groupName: null },
    { indexNumber: 'INT/23/01/1423', firstName: 'MIFETU BLESSING ELIKEM', lastName: 'AFIA', groupName: null },
    { indexNumber: 'INT/23/01/1426', firstName: 'DZRADOSI FREDRICK ADAMS NANA YAW', lastName: '', groupName: null },
    { indexNumber: 'INT/23/01/1435', firstName: 'AMOSAH EBENEZER KOFI ANYIMIAH ONSONYAMEYE', lastName: '', groupName: 'Theta' },
    { indexNumber: 'INT/23/01/1440', firstName: 'OBENG ABOAGYE', lastName: 'STEPHEN', groupName: null },
    { indexNumber: 'INT/23/01/1446', firstName: 'HARRISON', lastName: 'CALEB NYAMEYIE', groupName: null },
    { indexNumber: 'INT/23/01/1453', firstName: 'MARTEY', lastName: 'SAMUEL', groupName: null },
    { indexNumber: 'INT/23/01/1476', firstName: 'Osei Abenaa', lastName: 'Vera', groupName: null },
    { indexNumber: 'INT/23/01/1484', firstName: 'OWUSU-DANQUAH', lastName: 'KENNETH', groupName: null },
    { indexNumber: 'INT/23/01/1485', firstName: 'MOHAMMED', lastName: 'FAHD', groupName: null },
    { indexNumber: 'INT/23/01/1501', firstName: 'ANUKEM BENAIAH', lastName: 'OKWUKWE', groupName: null },
    { indexNumber: 'INT/23/01/1504', firstName: 'ABIBU', lastName: 'ANGELO', groupName: 'Iota' },
    { indexNumber: 'INT/23/01/1508', firstName: 'SOWAH', lastName: 'HELLEN ALAPINI', groupName: null },
    { indexNumber: 'INT/23/01/1509', firstName: 'NARH ANDY', lastName: 'ASARE', groupName: null },
    { indexNumber: 'INT/23/01/1513', firstName: 'ANKUDE', lastName: 'COLLINS', groupName: null },
    { indexNumber: 'INT/23/01/1514', firstName: 'MENSAH', lastName: 'MAURICE', groupName: null },
    { indexNumber: 'INT/23/01/1517', firstName: 'KANAMITIE LOUIS', lastName: 'BATSA', groupName: null },
    { indexNumber: 'INT/23/01/1521', firstName: 'NTI', lastName: 'MICHAEL KOFI', groupName: null },
    { indexNumber: 'INT/23/01/1528', firstName: 'TEYE JOSEPH MARTEY', lastName: 'SACKEY', groupName: null },
    { indexNumber: 'INT/23/01/1531', firstName: 'OBENG-MANFUL LEONARD', lastName: 'DANIEL', groupName: 'Lambda' },
    { indexNumber: 'INT/23/01/1542', firstName: 'HAMMOND', lastName: 'EMMANUELLA NANA ADJOA', groupName: null },
    { indexNumber: 'INT/23/01/1552', firstName: 'OLERTEY EMMANUEL NYAMEKYE', lastName: 'WUSSAH', groupName: null },
    { indexNumber: 'INT/23/01/1554', firstName: 'ABROKWAH NANA', lastName: 'YAW', groupName: null },
    { indexNumber: 'INT/23/01/1562', firstName: 'AKUSIKA', lastName: 'MARY', groupName: null },
    { indexNumber: 'INT/23/01/1563', firstName: 'DOTSEY BEDI', lastName: 'PRINCE', groupName: null },
    { indexNumber: 'INT/23/01/1565', firstName: 'BOATENG', lastName: 'EDWIN NANA', groupName: null },
    { indexNumber: 'INT/23/01/1566', firstName: 'OTU', lastName: 'RANSFORD', groupName: null },
    { indexNumber: 'INT/23/01/1567', firstName: 'AKOWONJO JONATHAN', lastName: 'ADEOLA', groupName: 'Mu' },
    { indexNumber: 'INT/23/01/1575', firstName: 'APEESI', lastName: 'LEADSON', groupName: null },
    { indexNumber: 'INT/23/01/1580', firstName: 'MINTAH', lastName: 'ANDREWS', groupName: null },
    { indexNumber: 'INT/23/01/1590', firstName: 'FIADOWU GIDEON', lastName: 'NORKPLIM', groupName: null },
    { indexNumber: 'INT/23/01/1615', firstName: 'ANTWI', lastName: 'PAAPA KOJO', groupName: null },
    { indexNumber: 'INT/23/01/1617', firstName: 'BAMFO', lastName: 'SAMUEL ODAME', groupName: null },
    { indexNumber: 'INT/23/01/1622', firstName: 'Asante', lastName: 'Michael', groupName: null },
    { indexNumber: 'INT/23/01/1627', firstName: 'ADJEI', lastName: 'DERRICK NANA', groupName: null },
    { indexNumber: 'INT/23/01/1632', firstName: 'MOCHIA-ACKAH JAMES', lastName: 'BENYENNA', groupName: 'Psi' },
    { indexNumber: 'INT/23/01/1660', firstName: 'DOWUONA', lastName: 'GABRIEL OKWEI', groupName: null },
    { indexNumber: 'INT/23/01/1668', firstName: 'Amoako Beverly', lastName: 'Chloe', groupName: null },
    { indexNumber: 'INT/23/01/1699', firstName: 'ADU', lastName: 'GODFRED', groupName: null },
    { indexNumber: 'INT/23/01/1700', firstName: 'NGORGBEY-KLU', lastName: 'RICHARD', groupName: null },
    { indexNumber: 'INT/23/01/1711', firstName: 'Bortey Borketey', lastName: 'Edward', groupName: null },
    { indexNumber: 'INT/23/01/1736', firstName: 'COLEMAN', lastName: 'BAABA', groupName: null },
    { indexNumber: 'INT/23/01/1756', firstName: 'MANORTEY', lastName: 'MANNASEH', groupName: null },
    { indexNumber: 'INT/23/01/1773', firstName: 'ADAMS', lastName: 'KELVIN AMIDU', groupName: 'Omicron' },
    { indexNumber: 'INT/23/01/1779', firstName: 'BAFFU', lastName: 'SOLOMON JUNIOR', groupName: null },
    { indexNumber: 'INT/23/01/1783', firstName: 'Wataklasu Joseph', lastName: 'Alavi', groupName: null },
    { indexNumber: 'INT/23/01/1786', firstName: 'KOTEY', lastName: 'PRECIOUS', groupName: null },
    { indexNumber: 'INT/23/01/1802', firstName: 'Commey Elizabeth', lastName: 'Adubi', groupName: null },
    { indexNumber: 'INT/23/01/1826', firstName: 'SOWU', lastName: 'ISAAC KOKU', groupName: null },
    { indexNumber: 'INT/23/01/1833', firstName: 'AMORIN', lastName: 'MICHAEL', groupName: null },
    { indexNumber: 'INT/23/01/1841', firstName: 'Alhassan Bless', lastName: 'Tahima', groupName: null },
    { indexNumber: 'INT/23/01/1843', firstName: 'TAMAKLOE', lastName: 'MICHAEL WISE', groupName: 'Omega' },
    { indexNumber: 'INT/23/01/1859', firstName: 'DZIKOE-AGBODJAH', lastName: 'STEVE SELORM', groupName: null },
    { indexNumber: 'INT/23/01/1966', firstName: 'ADIMAZOYA', lastName: 'FABIAN', groupName: null },
    { indexNumber: 'INT/23/01/1988', firstName: 'AGYAPONG', lastName: 'BENEDICTA AMA', groupName: null },
    { indexNumber: 'INT/23/01/1997', firstName: 'AHIALEY', lastName: 'SAMUEL', groupName: null },
    { indexNumber: 'INT/23/01/2051', firstName: 'YEBOAH', lastName: 'GREG', groupName: null },
  ];

  for (const student of students) {
    const email = `${student.indexNumber.toLowerCase().replace(/\//g, '')}@centraluniversity.edu.gh`;
    const user = await prisma.user.upsert({
      where: { indexNumber: student.indexNumber },
      update: {},
      create: {
        indexNumber: student.indexNumber,
        email: email,
        password: studentPassword,
        firstName: student.firstName,
        lastName: student.lastName,
        role: 'STUDENT',
        department: 'Computer Science',
        groupName: student.groupName,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log('✅ Student created:', user.indexNumber, '-', user.firstName, user.lastName);
  }

  // Create rooms for Central University Sowutuom Campus
  const rooms = [
    {
      name: 'SC-B101',
      capacity: 50,
      building: 'Science Block',
      floor: 'Ground Floor',
      description: 'Large lecture hall with tiered seating',
      equipment: ['projector', 'whiteboard', 'air-conditioning', 'sound-system'],
    },
    {
      name: 'SC-B102',
      capacity: 30,
      building: 'Science Block',
      floor: 'Ground Floor',
      description: 'Medium-sized classroom',
      equipment: ['projector', 'whiteboard', 'air-conditioning'],
    },
    {
      name: 'SC-B201',
      capacity: 30,
      building: 'Science Block',
      floor: 'Second Floor',
      description: 'Computer laboratory',
      equipment: ['projector', 'smartboard', 'computers', 'air-conditioning'],
    },
    {
      name: 'SC-B202',
      capacity: 25,
      building: 'Science Block',
      floor: 'Second Floor',
      description: 'Science laboratory',
      equipment: ['projector', 'whiteboard', 'lab-equipment', 'air-conditioning'],
    },
    {
      name: 'AB-LT1',
      capacity: 150,
      building: 'Administration Block',
      floor: 'First Floor',
      description: 'Main lecture theatre',
      equipment: ['projector', 'sound-system', 'microphone', 'air-conditioning', 'recording-equipment'],
    },
    {
      name: 'AB-LT2',
      capacity: 100,
      building: 'Administration Block',
      floor: 'First Floor',
      description: 'Secondary lecture theatre',
      equipment: ['projector', 'sound-system', 'microphone', 'air-conditioning'],
    },
    {
      name: 'AB-303',
      capacity: 25,
      building: 'Administration Block',
      floor: 'Third Floor',
      description: 'Seminar room',
      equipment: ['whiteboard', 'air-conditioning'],
    },
    {
      name: 'AB-304',
      capacity: 20,
      building: 'Administration Block',
      floor: 'Third Floor',
      description: 'Meeting room',
      equipment: ['projector', 'whiteboard', 'video-conferencing', 'air-conditioning'],
    },
    {
      name: 'LIB-SR1',
      capacity: 15,
      building: 'Library',
      floor: 'Second Floor',
      description: 'Library study room 1',
      equipment: ['whiteboard', 'air-conditioning'],
    },
    {
      name: 'LIB-SR2',
      capacity: 15,
      building: 'Library',
      floor: 'Second Floor',
      description: 'Library study room 2',
      equipment: ['whiteboard', 'air-conditioning'],
    },
  ];

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
    console.log('✅ Room created:', room.name);

    // Create default time slots for each room (Monday to Friday, 8am to 6pm)
    const timeSlots = [];
    for (let day = 1; day <= 5; day++) {
      // Monday (1) to Friday (5)
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

    // Create time slots (skip if already exists)
    for (const slotData of timeSlots) {
      try {
        await prisma.timeSlot.create({
          data: slotData,
        });
      } catch (error) {
        // Skip if already exists (unique constraint)
      }
    }
  }
  console.log('✅ Time slots created for all rooms');

  // Seed common departments / courses (sample list)
  const departments = [
    { code: 'CS', name: 'Computer Science' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'SE', name: 'Software Engineering' },
    { code: 'CE', name: 'Civil Engineering' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'EE', name: 'Electrical & Electronic Engineering' },
    { code: 'CHE', name: 'Chemical Engineering' },
    { code: 'AE', name: 'Aerospace Engineering' },
    { code: 'ARCH', name: 'Architecture' },
    { code: 'BUS', name: 'Business Administration' },
    { code: 'ACC', name: 'Accounting' },
    { code: 'FIN', name: 'Finance' },
    { code: 'ECO', name: 'Economics' },
    { code: 'LAW', name: 'Law' },
    { code: 'MED', name: 'Medicine' },
    { code: 'NUR', name: 'Nursing' },
    { code: 'PHARM', name: 'Pharmacy' },
    { code: 'ARCHA', name: 'Archaeology' },
    { code: 'AGRI', name: 'Agriculture' },
    { code: 'ENV', name: 'Environmental Science' },
    { code: 'BIO', name: 'Biology' },
    { code: 'CHEM', name: 'Chemistry' },
    { code: 'PHYS', name: 'Physics' },
    { code: 'MATH', name: 'Mathematics & Statistics' },
    { code: 'EDU', name: 'Education' },
    { code: 'SOC', name: 'Sociology' },
    { code: 'PSY', name: 'Psychology' },
    { code: 'HUM', name: 'Humanities' },
  ];

  for (const d of departments) {
    try {
      await prisma.department.upsert({ where: { code: d.code }, update: {}, create: d });
    } catch (e) {
      // ignore
    }
  }
  console.log('✅ Departments seeded');

  // Create sample bookings
  const johnDoe = await prisma.user.findUnique({
    where: { email: 'john.doe@centraluniversity.edu.gh' },
  });

  const scB101 = await prisma.room.findUnique({
    where: { name: 'SC-B101' },
  });

  if (johnDoe && scB101) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sampleBookings = [
      {
        roomId: scB101.id,
        userId: johnDoe.id,
        title: 'Introduction to Programming',
        description: 'CS101 - First year programming lecture',
        date: tomorrow.toISOString().slice(0, 10),
        startTime: '09:45',
        endTime: '11:15',
        status: 'CONFIRMED',
      },
      {
        roomId: scB101.id,
        userId: johnDoe.id,
        title: 'Data Structures',
        description: 'CS201 - Second year data structures lecture',
        date: tomorrow.toISOString().slice(0, 10),
        startTime: '14:00',
        endTime: '15:30',
        status: 'PENDING',
      },
    ];

    for (const bookingData of sampleBookings) {
      try {
        const booking = await prisma.booking.create({
          data: bookingData,
        });
        console.log('✅ Sample booking created:', booking.title);
      } catch (error) {
        console.log('⚠️ Booking already exists, skipping...');
      }
    }
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
