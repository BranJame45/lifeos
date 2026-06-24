import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShoppingListService } from './shopping-list.service';

@Controller('shopping-list')
@UseGuards(AuthGuard('jwt'))
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Get('current')
  getCurrent(@Req() req: any) {
    return this.shoppingListService.getCurrent(req.user.id);
  }

  @Post('generate/:planId')
  generateFromPlan(@Req() req: any, @Param('planId') planId: string) {
    return this.shoppingListService.generateFromPlan(req.user.id, planId);
  }

  @Patch('item/:id')
  toggleItem(@Param('id') id: string) {
    return this.shoppingListService.toggleItem(id);
  }
}
