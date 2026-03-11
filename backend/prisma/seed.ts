import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding V-Connect 2.0 database...\n');

  // ── Create Admin User ──
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vignan.edu' },
    update: { passwordHash: adminPassword },
    create: {
      name: 'Super Admin',
      email: 'admin@vignan.edu',
      phone: '9000000001',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin created:', admin.email);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Admin:     admin@vignan.edu     / Admin@123');
  console.log('─────────────────────────────────────');
  console.log('\n📝 When you create users via the Admin dashboard:');
  console.log('   - You set their email and password during creation');
  console.log('   - Students: email + password + roll no + section + department');
  console.log('   - Faculty:  email + password + emp ID + department');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });