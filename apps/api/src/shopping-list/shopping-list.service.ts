import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShoppingListService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const now = new Date();
    return this.prisma.shoppingList.findFirst({
      where: { userId, weekStart: { lte: now } },
      include: { items: { orderBy: { category: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleItem(id: string) {
    const item = await this.prisma.shoppingItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return this.prisma.shoppingItem.update({
      where: { id },
      data: { purchased: !item.purchased },
    });
  }
}
