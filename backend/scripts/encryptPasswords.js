import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

async function encryptPasswords() {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    
    // Update each user's password with encrypted version
    for (const user of users) {
      // Only encrypt if password isn't already hashed
      if (!user.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log(`Password encrypted for user: ${user.email}`);
      }
    }
    
    console.log('All passwords have been encrypted successfully');
  } catch (error) {
    console.error('Error encrypting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the encryption
encryptPasswords(); 