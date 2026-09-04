// modules/auth/interface/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { LoginDto } from '../application/dto/login.dto';
import { ChangePasswordDto } from '../application/dto/change-password.dto';
import { JwtAuthGuard } from '../../../shared/application/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/application/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser('id') userId: number) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@CurrentUser('id') userId: number, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }
}