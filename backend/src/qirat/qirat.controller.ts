import { Controller, Get, UseGuards } from '@nestjs/common';
import { QiratService } from './qirat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('qirat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QiratController {
  constructor(private readonly qiratService: QiratService) {}

  @Get('dashboard')
  @Roles(UserRole.QIRAT_MANAGER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getDashboard() {
    return this.qiratService.getDashboard();
  }
}
