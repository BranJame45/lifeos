import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Req() req: any, @Body() body: { message: string }) {
    return this.aiService.chat(req.user.id, body.message);
  }
}
