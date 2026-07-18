import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        dish: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalCents = items.reduce((total, item) => {
      return total + item.dish.priceCents * item.quantity;
    }, 0);

    return {
      items,
      totalCents,
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const dish = await this.prisma.dish.findFirst({
      where: {
        id: dto.dishId,
        active: true,
      },
    });

    if (!dish) {
      throw new BadRequestException('Dish is not available');
    }

    return this.prisma.cartItem.upsert({
      where: {
        userId_dishId: {
          userId,
          dishId: dto.dishId,
        },
      },
      update: {
        quantity: {
          increment: dto.quantity,
        },
      },
      create: {
        userId,
        dishId: dto.dishId,
        quantity: dto.quantity,
      },
      include: {
        dish: true,
      },
    });
  }

  async updateItem(userId: string, cartItemId: string, dto: UpdateCartItemDto) {
    const cartItem = await this.findOwnedCartItem(userId, cartItemId);

    return this.prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity: dto.quantity,
      },
      include: {
        dish: true,
      },
    });
  }

  async removeItem(userId: string, cartItemId: string) {
    const cartItem = await this.findOwnedCartItem(userId, cartItemId);

    await this.prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return {
      success: true,
    };
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });

    return {
      success: true,
    };
  }

  private async findOwnedCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return cartItem;
  }
}
