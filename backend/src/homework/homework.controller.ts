import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkStatusDto } from './dto/update-homework-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('homework')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  @Post()
  @Roles('super_admin', 'admin', 'teacher')
  async create(@Body() dto: CreateHomeworkDto) {
    return this.homeworkService.create(dto);
  }

  @Get('student/:studentId')
  @Roles('super_admin', 'admin', 'teacher', 'student', 'parent')
  async findByStudent(@Param('studentId') studentId: string) {
    return this.homeworkService.findByStudent(studentId);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'admin', 'teacher', 'student')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateHomeworkStatusDto,
  ) {
    return this.homeworkService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin', 'teacher')
  async remove(@Param('id') id: string) {
    await this.homeworkService.remove(id);
    return { message: 'Homework deleted successfully' };
  }
}
