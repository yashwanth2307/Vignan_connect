const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Starting database cleanup ===\n');

  // 1. Clear all attendance data
  console.log('1. Deleting all AttendanceRecord entries...');
  const delRecords = await prisma.attendanceRecord.deleteMany({});
  console.log(`   Deleted ${delRecords.count} attendance records.`);

  console.log('2. Deleting all AttendanceSession entries...');
  const delSessions = await prisma.attendanceSession.deleteMany({});
  console.log(`   Deleted ${delSessions.count} attendance sessions.\n`);

  // 2. Update all students to 3rd year / 6th semester
  console.log('3. Updating all students to currentYear=3, currentSemester=6...');
  const updStudents = await prisma.student.updateMany({
    data: {
      currentYear: 3,
      currentSemester: 6,
    },
  });
  console.log(`   Updated ${updStudents.count} students.\n`);

  console.log('=== Done! ===');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
