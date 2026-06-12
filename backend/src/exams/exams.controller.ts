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
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  findAll(@Query() query: any) {
    return this.examsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }

  @Post(':id/grade')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  gradeExam(
    @Param('id') id: string,
    @Body('score') score: number,
    @Body('maxScore') maxScore: number,
    @Body('feedback') feedback: string,
  ) {
    return this.examsService.gradeExam(id, score, maxScore, feedback);
  }

  @Patch(':id/grade')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  gradeExamDirect(
    @Param('id') id: string,
    @Body() gradeData: { score: number; maxScore: number; feedback: string },
  ) {
    return this.examsService.gradeExam(id, gradeData.score, gradeData.maxScore, gradeData.feedback);
  }
}
