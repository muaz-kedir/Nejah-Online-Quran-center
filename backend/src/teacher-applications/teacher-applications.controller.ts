import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

import { TeacherApplicationsService } from './teacher-applications.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher-application.dto';
import { ReviewTeacherApplicationDto } from './dto/review-teacher-application.dto';
import { QueryTeacherApplicationDto } from './dto/query-teacher-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

// Ensure upload directory exists
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'applications');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('teacher-applications')
export class TeacherApplicationsController {
  constructor(
    private readonly applicationsService: TeacherApplicationsService,
  ) {}

  // ══════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS (no authentication required)
  // ══════════════════════════════════════════════════════════════════

  @Get('settings')
  getSettings() {
    return this.applicationsService.getSettings();
  }

  @Post()
  submit(@Body() dto: CreateTeacherApplicationDto) {
    return this.applicationsService.submit(dto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          const name = randomBytes(16).toString('hex');
          cb(null, `${name}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];
        if (!allowed.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Only PDF, JPG and PNG files are allowed',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return { url: `/uploads/applications/${file.filename}` };
  }

  @Get('track')
  trackApplication(
    @Query('email') email: string,
    @Query('applicationNumber') applicationNumber: string,
  ) {
    if (!email || !applicationNumber) {
      throw new BadRequestException(
        'Both email and application number are required',
      );
    }
    return this.applicationsService.trackApplication(email, applicationNumber);
  }

  // ══════════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS (JWT + role-based access)
  // ══════════════════════════════════════════════════════════════════

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getStats() {
    return this.applicationsService.getStats();
  }

  @Post('settings/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  toggleSettings(@Body() body: { isApplicationsOpen: boolean }) {
    return this.applicationsService.toggleApplicationsOpen(body.isApplicationsOpen);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(@Query() queryDto: QueryTeacherApplicationDto) {
    return this.applicationsService.findAll(queryDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  review(
    @Param('id') id: string,
    @Body() dto: ReviewTeacherApplicationDto,
    @Req() req: any,
  ) {
    const reviewerId = req.user?.id || 'unknown';
    return this.applicationsService.review(id, dto, reviewerId);
  }
}
