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

  // ── Create default regulation if not exists ──
  let regulation = await prisma.regulation.findFirst({ where: { code: 'R22' } });
  if (!regulation) {
    regulation = await prisma.regulation.create({
      data: {
        code: 'R22',
        activeFrom: new Date('2022-06-01'),
        rulesJson: '{}',
      },
    });
    console.log('✅ Regulation R22 created');
  }

  // ── Create default department (CSE) if not exists ──
  let cse = await prisma.department.findFirst({ where: { code: 'CSE' } });
  if (!cse) {
    cse = await prisma.department.create({
      data: { name: 'Computer Science & Engineering', code: 'CSE' },
    });
    console.log('✅ CSE Department created');
  }

  // ── Create Semesters 1-8 for CSE + R22 ──
  for (let sem = 1; sem <= 8; sem++) {
    const existing = await prisma.semester.findFirst({
      where: { number: sem, regulationId: regulation.id, departmentId: cse.id },
    });
    if (!existing) {
      await prisma.semester.create({
        data: { number: sem, regulationId: regulation.id, departmentId: cse.id },
      });
    }
  }
  console.log('✅ Semesters 1-8 created for CSE/R22');

  // ── Create Exam Cell user if not exists ──
  const examCellPassword = await bcrypt.hash('Examcell@123', 12);
  await prisma.user.upsert({
    where: { email: 'examcell@vignan.edu' },
    update: {},
    create: {
      name: 'Exam Cell Officer',
      email: 'examcell@vignan.edu',
      phone: '9000000002',
      passwordHash: examCellPassword,
      role: UserRole.EXAM_CELL,
    },
  });
  console.log('✅ Exam Cell user created: examcell@vignan.edu');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Admin:      admin@vignan.edu      / Admin@123');
  console.log('Exam Cell:  examcell@vignan.edu   / Examcell@123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });