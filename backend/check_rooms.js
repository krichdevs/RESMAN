const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRooms() {
  try {
    const count = await prisma.room.count();
    console.log(`\n📊 Total rooms in database: ${count}\n`);

    if (count > 0) {
      const rooms = await prisma.room.findMany({ take: 3 });
      console.log('Sample rooms from database:');
      rooms.forEach(room => {
        console.log(`  - ${room.name}: ${room.building}, Floor ${room.floor}, Capacity: ${room.capacity}, Equipment: ${room.equipment}`);
      });
    } else {
      console.log('⚠️  No rooms found in database!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRooms();
