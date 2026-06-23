import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async get(@Req() req: any) {
    return this.profileService.get(req.user.id);
  }

  @Put()
  async update(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(req.user.id, dto);
  }
}
