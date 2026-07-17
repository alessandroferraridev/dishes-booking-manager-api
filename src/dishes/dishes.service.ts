import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDishDto, UpdateDishDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DishesService {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    return this.prisma.dish.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findActiveById(id: string) {
    const dish = await this.prisma.dish.findFirst({
      where: {
        id,
        active: true,
      },
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    return dish;
  }

  findAllForAdmin() {
    return this.prisma.dish.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  create(dto: CreateDishDto) {
    return this.prisma.dish.create({
      data: {
        name: dto.name,
        description: dto.description,
        priceCents: dto.priceCents,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateDishDto) {
    await this.ensureExists(id);

    return this.prisma.dish.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    await this.ensureExists(id);

    return this.prisma.dish.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  private async ensureExists(id: string) {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    return dish;
  }
}
