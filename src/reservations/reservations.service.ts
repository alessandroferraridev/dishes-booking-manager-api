import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto, UpdateReservationStatusDto } from './dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  findMyReservations(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: this.reservationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMyReservationById(userId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        userId,
      },
      include: this.reservationInclude,
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  findAllForAdmin() {
    return this.prisma.reservation.findMany({
      include: this.reservationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByIdForAdmin(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: this.reservationInclude,
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async createFromCart(userId: string, dto: CreateReservationDto) {
    return this.prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: {
          dish: true,
        },
      });

      if (!cartItems.length) {
        throw new BadRequestException('Cart is empty');
      }

      const reservation = await tx.reservation.create({
        data: {
          userId,
          notes: dto.notes,
          status: ReservationStatus.PENDING,
          dishes: {
            create: cartItems.map((item) => ({
              dishId: item.dishId,
              quantity: item.quantity,
              priceCents: item.dish.priceCents,
            })),
          },
        },
        include: this.reservationInclude,
      });

      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return reservation;
    });
  }

  async updateStatus(reservationId: string, dto: UpdateReservationStatusDto) {
    if (dto.status === ReservationStatus.PENDING) {
      throw new BadRequestException('Cannot set reservation back to PENDING');
    }

    await this.ensureExists(reservationId);

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: dto.status,
      },
      include: this.reservationInclude,
    });
  }

  private async ensureExists(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  private readonly reservationInclude = {
    user: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    },
    dishes: {
      include: {
        dish: true,
      },
    },
    pickup: true,
  };
}
