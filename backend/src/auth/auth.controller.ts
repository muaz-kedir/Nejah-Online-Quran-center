import { Controller, Post, Body, Get, UseGuards, HttpCode, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ParentLookupDto, ParentDuplicateCheckDto, CheckEmailDto } from './dto/parent-lookup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Public availability check for the student email before submission.
  @Post('check-email')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkStudentEmail(dto.email);
  }

  // Public, registration-scoped parent search (limited projection).
  @Post('parent-lookup')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  parentLookup(@Body() dto: ParentLookupDto) {
    return this.authService.lookupParentsForRegistration(dto.query);
  }

  // Public duplicate detection by exact email/phone for the parent form.
  @Post('parent-duplicate-check')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  parentDuplicateCheck(@Body() dto: ParentDuplicateCheckDto) {
    return this.authService.checkParentDuplicate(dto.email, dto.phoneNumber);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body.email);
    return {
      message: 'If this email is registered, a reset link has been sent.',
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { message: 'Password reset successfully. You can now log in.' };
  }

  @Get('validate-reset-token')
  async validateResetToken(@Query('token') token: string) {
    const isValid = await this.authService.validateResetToken(token);
    return { valid: isValid };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
