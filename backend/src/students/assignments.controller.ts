import { Controller, Get, Post, Body, UseGuards, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { StudentsService } from './students.service';
import { SchedulesService } from '../schedules/schedules.service';
import { AssignStudentDto, UnassignStudentDto } from './dto/assign-student.dto';

@Controller('students/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AssignmentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly schedulesService: SchedulesService,
  ) {}

  @Get('unassigned')
  async getUnassignedStudents() {
    return this.studentsService.findAllUnassigned();
  }

  @Post('assign')
  async assignStudent(@Body() dto: AssignStudentDto) {
    const { studentId, teacherId, schedules } = dto;

    // 1. Validate student exists
    const student = await this.studentsService.findOne(studentId);
    if (!student) throw new NotFoundException('Student not found');

    // 2. Clear old schedules if any
    await this.schedulesService.clearStudentSchedules(studentId);

    // 3. Update student mapping
    await this.studentsService.update(studentId, { 
      teacherId, 
      isAssigned: true 
    });

    // 4. Create schedules only when explicitly provided (recurring schedules are set from Faculty profile)
    const results = [];
    if (schedules?.length) {
      for (const slot of schedules) {
        const schedule = await this.schedulesService.createSchedule({
          studentId,
          teacherId,
          ...slot,
        });
        results.push(schedule);
      }
    }

    return {
      message: 'Student assigned successfully',
      schedules: results,
    };
  }

  @Post('unassign')
  async unassignStudent(@Body() dto: UnassignStudentDto) {
    const { studentId } = dto;
    
    await this.studentsService.unassignFromTeacher(studentId);
    
    await this.schedulesService.clearStudentSchedules(studentId);
    
    return { message: 'Student unassigned successfully' };
  }
}
