import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteCmsService } from './website-cms.service';
import { WebsiteCmsPublicController } from './website-cms-public.controller';
import { WebsiteCmsAdminController } from './website-cms-admin.controller';
import { HomeMissionSection } from './entities/home-mission-section.entity';
import { HomeMissionCard } from './entities/home-mission-card.entity';
import { HomeProgramsSection } from './entities/home-programs-section.entity';
import { HomeProgram } from './entities/home-program.entity';
import { Testimonial } from './entities/testimonial.entity';
import { HomeTeacher } from './entities/home-teacher.entity';
import { User } from '../users/entities/user.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HomeMissionSection,
      HomeMissionCard,
      HomeProgramsSection,
      HomeProgram,
      Testimonial,
      HomeTeacher,
      User,
      Teacher,
    ]),
  ],
  controllers: [WebsiteCmsPublicController, WebsiteCmsAdminController],
  providers: [WebsiteCmsService],
  exports: [WebsiteCmsService],
})
export class WebsiteCmsModule {}
