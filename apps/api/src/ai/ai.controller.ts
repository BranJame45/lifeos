import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('chat')
  async getHistory(@Req() req: any) {
    return this.aiService.getHistory(req.user.id);
  }

  @Post('chat')
  async chat(@Req() req: any, @Body() body: { message: string; locale?: string }) {
    return this.aiService.chat(req.user.id, body.message, body.locale || 'es');
  }
}
