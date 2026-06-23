import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
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

  @Patch('item/:id')
  toggleItem(@Param('id') id: string) {
    return this.shoppingListService.toggleItem(id);
  }
}
