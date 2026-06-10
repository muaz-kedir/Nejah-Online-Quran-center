import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ParentLookupDto, ParentDuplicateCheckDto, CheckEmailDto } from './dto/parent-lookup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Public availability check for the student email before submission.
  @Post('check-email')
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkStudentEmail(dto.email);
  }

  // Public, registration-scoped parent search (limited projection).
  @Post('parent-lookup')
  parentLookup(@Body() dto: ParentLookupDto) {
    return this.authService.lookupParentsForRegistration(dto.query);
  }

  // Public duplicate detection by exact email/phone for the parent form.
  @Post('parent-duplicate-check')
  parentDuplicateCheck(@Body() dto: ParentDuplicateCheckDto) {
    return this.authService.checkParentDuplicate(dto.email, dto.phoneNumber);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
