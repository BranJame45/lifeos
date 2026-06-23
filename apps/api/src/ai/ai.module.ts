import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ContextBuilder } from './context.builder';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AiController],
  providers: [AiService, ContextBuilder, PrismaService],
})
export class AiModule {}
