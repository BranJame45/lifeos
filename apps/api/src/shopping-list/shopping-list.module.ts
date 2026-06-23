import { Module } from '@nestjs/common';
import { ShoppingListController } from './shopping-list.controller';
import { ShoppingListService } from './shopping-list.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ShoppingListController],
  providers: [ShoppingListService, PrismaService],
})
export class ShoppingListModule {}
