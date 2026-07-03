import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { WebsiteCmsService } from './website-cms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { UpdateHomeMissionSectionDto } from './dto/update-home-mission-section.dto';
import {
  CreateHomeMissionCardDto,
  UpdateHomeMissionCardDto,
} from './dto/home-mission-card.dto';
import { UpdateHomeProgramsSectionDto } from './dto/update-home-programs-section.dto';
import {
  CreateHomeProgramDto,
  UpdateHomeProgramDto,
} from './dto/home-program.dto';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('website/admin/home')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class WebsiteCmsAdminController {
  constructor(private readonly cmsService: WebsiteCmsService) {}

  @Get('mission')
  getMission() {
    return this.cmsService.getAdminMissionContent();
  }

  @Put('mission')
  updateMission(@Body() dto: UpdateHomeMissionSectionDto) {
    return this.cmsService.updateMissionSection(dto);
  }

  @Post('mission/cards')
  createMissionCard(@Body() dto: CreateHomeMissionCardDto) {
    return this.cmsService.createMissionCard(dto);
  }

  @Patch('mission/cards/:id')
  updateMissionCard(@Param('id') id: string, @Body() dto: UpdateHomeMissionCardDto) {
    return this.cmsService.updateMissionCard(id, dto);
  }

  @Delete('mission/cards/:id')
  deleteMissionCard(@Param('id') id: string) {
    return this.cmsService.deleteMissionCard(id);
  }

  @Post('mission/cards/reorder')
  reorderMissionCards(@Body() dto: ReorderDto) {
    return this.cmsService.reorderMissionCards(dto.ids);
  }

  @Get('programs')
  getPrograms() {
    return this.cmsService.getAdminProgramsContent();
  }

  @Put('programs')
  updateProgramsSection(@Body() dto: UpdateHomeProgramsSectionDto) {
    return this.cmsService.updateProgramsSection(dto);
  }

  @Post('programs/items')
  createProgram(@Body() dto: CreateHomeProgramDto) {
    return this.cmsService.createProgram(dto);
  }

  @Patch('programs/items/:id')
  updateProgram(@Param('id') id: string, @Body() dto: UpdateHomeProgramDto) {
    return this.cmsService.updateProgram(id, dto);
  }

  @Delete('programs/items/:id')
  deleteProgram(@Param('id') id: string) {
    return this.cmsService.deleteProgram(id);
  }

  @Post('programs/items/reorder')
  reorderPrograms(@Body() dto: ReorderDto) {
    return this.cmsService.reorderPrograms(dto.ids);
  }

  // --- Testimonials ---

  @Get('testimonials')
  getTestimonials() {
    return this.cmsService.getAdminTestimonials();
  }

  @Post('testimonials')
  createTestimonial(@Body() dto: CreateTestimonialDto) {
    return this.cmsService.createTestimonial(dto);
  }

  @Patch('testimonials/:id')
  updateTestimonial(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.cmsService.updateTestimonial(id, dto);
  }

  @Delete('testimonials/:id')
  deleteTestimonial(@Param('id') id: string) {
    return this.cmsService.deleteTestimonial(id);
  }

  @Post('testimonials/reorder')
  reorderTestimonials(@Body() dto: ReorderDto) {
    return this.cmsService.reorderTestimonials(dto.ids);
  }
}
