import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CreateCurrencyRateDto } from './dto/create-currency-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly service: CurrencyService) {}

  @Get('rates')
  @UseGuards(JwtAuthGuard)
  getRates() {
    return this.service.findAll();
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  refreshRates() {
    return this.service.refreshRates();
  }

  @Get('convert')
  @UseGuards(JwtAuthGuard)
  convert(@Query('from') from: string, @Query('to') to: string, @Query('amount') amount: string) {
    return this.service.convert(from?.toUpperCase(), to?.toUpperCase(), parseFloat(amount || '1'));
  }

  @Post('rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  createRate(@Body() dto: CreateCurrencyRateDto) {
    return this.service.create(dto);
  }

  @Delete('rates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  removeRate(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
