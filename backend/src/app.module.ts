import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { WebhookModule } from './webhooks/webhook.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { SectionsModule } from './sections/sections.module';
import { RegulationsModule } from './regulations/regulations.module';
import { SubjectsModule } from './subjects/subjects.module';
import { CourseOfferingsModule } from './course-offerings/course-offerings.module';
import { TimetableModule } from './timetable/timetable.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExamModule } from './exam/exam.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { PlacementsModule } from './placements/placements.module';
import { OnlineClassesModule } from './online-classes/online-classes.module';
import { CodeArenaModule } from './code-arena/code-arena.module';
import { SkillCoursesModule } from './skill-courses/skill-courses.module';
import { AdminBotModule } from './admin-bot/admin-bot.module';
import { GroupsModule } from './groups/groups.module';
import { AcademicCalendarModule } from './academic-calendar/academic-calendar.module';
import { SemesterPromotionModule } from './semester-promotion/semester-promotion.module';
import { RequestsModule } from './requests/requests.module';
import { ClubsModule } from './clubs/clubs.module';
import { CollegeMagazineModule } from './college-magazine/college-magazine.module';
import { CollegeGalleryModule } from './college-gallery/college-gallery.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    WebhookModule,
    EmailModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    SectionsModule,
    RegulationsModule,
    SubjectsModule,
    CourseOfferingsModule,
    TimetableModule,
    AttendanceModule,
    ExamModule,
    AnnouncementsModule,
    PlacementsModule,
    OnlineClassesModule,
    CodeArenaModule,
    SkillCoursesModule,
    AdminBotModule,
    GroupsModule,
    AcademicCalendarModule,
    SemesterPromotionModule,
    RequestsModule,
    ClubsModule,
    CollegeMagazineModule,
    CollegeGalleryModule,
    EventsModule,
  ],
})
export class AppModule {}
