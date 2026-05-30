import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryTeacherDto) {
    return this.teachersService.findAll(queryDto);
  }

  @Get('stats')
  getOverallStats() {
    return this.teachersService.getOverallStats();
  }

  @Get('my-dashboard-stats')
  async getMyDashboardStats(@Req() req: any) {
    // req.user has { sub: userId, email, role } from JwtAuthGuard
    const teacher = await this.teachersService.findByUserId(req.user.sub);
    return this.teachersService.getTeacherDashboardStats(teacher.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Get(':id/analytics')
  getAnalytics(@Param('id') id: string) {
    return this.teachersService.getTeacherAnalytics(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  @Post(':id/assign-students')
  assignStudents(
    @Param('id') id: string,
    @Body('studentIds') studentIds: string[],
  ) {
    return this.teachersService.assignStudents(id, studentIds);
  }
}
