import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create system user for non-authenticated tickets
  const systemUser = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'System User',
      email: 'system@example.com',
      password: await bcrypt.hash('system123', 10),
      role: 'ADMIN',
      department: 'System'
    },
  });

  console.log('System user created:', systemUser);

  // Create department users
  const departments = [
    'Information and Communications Technology Unit',
    'Administrative Service - Personnel Unit',
    'Administrative Service - Records Unit',
    'Administrative Service - Cash Unit',
    'Administrative Service - Proper',
    'Finance Services - Budget Unit',
    'Finance Services - Accounting Unit',
    'Legal Services Unit',
    'Curriculum Implementation Division (CID) - ALS',
    'Curriculum Implementation Division (CID) - Proper',
    'Curriculum Implementation Division (CID) - Learning Resources',
    'School Governance and Operations Division (SGOD) - Planning and Research Section',
    'School Governance and Operations Division (SGOD) - Human Resource Development',
    'School Governance and Operations Division (SGOD) - Social Mobilization and Networking',
    'School Governance and Operations Division (SGOD) - School Management Monitoring and Evaluation',
    'School Governance and Operations Division (SGOD) - Education Facilities',
    'School Governance and Operations Division (SGOD) - DRRM',
    'School Governance and Operations Division (SGOD) - YFD',
    'School Governance and Operations Division (SGOD) - Main',
    'Office of the Schools Division Superintendent (OSDS)',
    'Office of the Assistant Schools Division Superintendent (OASDS)'
  ];

  for (const department of departments) {
    const email = department.toLowerCase().replace(/[^a-z0-9]/g, '') + '@example.com';
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: department,
        email,
        password: await bcrypt.hash('password123', 10),
        role: 'USER',
        department
      },
    });
    console.log('Created user:', user);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 