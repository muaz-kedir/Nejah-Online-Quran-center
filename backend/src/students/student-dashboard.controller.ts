import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { StudentPortalService } from './student-portal.service';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentDashboardController {
  constructor(private readonly portal: StudentPortalService) {}

  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.portal.getDashboard(req.user.id);
  }

  @Get('dashboard/classes')
  getClasses(@Request() req) {
    return this.portal.getClasses(req.user.id);
  }

  @Get('dashboard/progress')
  getProgress(@Request() req) {
    return this.portal.getProgressDetail(req.user.id);
  }

  @Get('dashboard/homework')
  getHomework(@Request() req) {
    return this.portal.getHomeworkList(req.user.id);
  }

  @Post('dashboard/homework/:id/submit')
  submitHomework(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { submissionNotes?: string },
  ) {
    return this.portal.submitHomework(req.user.id, id, body.submissionNotes);
  }

  @Get('dashboard/notifications')
  getNotifications(@Request() req) {
    return this.portal.getNotifications(req.user.id);
  }

  @Patch('dashboard/notifications/:id/read')
  markNotificationRead(@Request() req, @Param('id') id: string) {
    return this.portal.markNotificationRead(req.user.id, id);
  }

  @Patch('dashboard/notifications/read-all')
  markAllNotificationsRead(@Request() req) {
    return this.portal.markAllNotificationsRead(req.user.id);
  }

  @Get('dashboard/feedback')
  getFeedback(@Request() req) {
    return this.portal.getFeedback(req.user.id);
  }

  @Get('dashboard/attendance')
  getAttendance(@Request() req) {
    return this.portal.getAttendanceDetail(req.user.id);
  }

  @Get('dashboard/resources')
  getResources(@Query('search') search?: string, @Query('category') category?: string) {
    return this.portal.getResources(search, category);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.portal.getProfile(req.user.id);
  }
}
