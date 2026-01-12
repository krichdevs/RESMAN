import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('Starting user role fix...');

    // Define which emails should be ADMIN
    const adminEmails = [
      'admin@centraluniversity.edu',
      'superadmin@centraluniversity.edu',
    ];

    // Define which emails should be STAFF
    const staffEmails = [
      'staff@centraluniversity.edu',
      'support@centraluniversity.edu',
    ];

    // Update admin users
    const adminsUpdated = await prisma.user.updateMany({
      where: {
        email: { in: adminEmails },
      },
      data: {
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log(`Updated ${adminsUpdated.count} users to ADMIN role`);

    // Update staff users
    const staffUpdated = await prisma.user.updateMany({
      where: {
        email: { in: staffEmails },
      },
      data: {
        role: 'STAFF',
        isActive: true,
      },
    });

    console.log(`Updated ${staffUpdated.count} users to STAFF role`);

    // List all system users
    const systemUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'STAFF'] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    console.log('Current system users:', systemUsers);
    console.log('User role fix completed successfully!');
  } catch (error) {
    console.error('Error fixing user roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
