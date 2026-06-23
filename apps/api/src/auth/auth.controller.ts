import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refresh(@Req() req: any) {
    return this.authService.refresh(req.user.id);
  }
}
