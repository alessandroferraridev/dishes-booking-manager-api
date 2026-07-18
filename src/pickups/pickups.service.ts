import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePickupDto, UpdatePickupDto } from './dto';

@Injectable()
export class PickupsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForReservation(reservationId: string, dto: CreatePickupDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        pickup: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Pickup can only be created for confirmed reservations',
      );
    }

    if (reservation.pickup) {
      throw new BadRequestException('Reservation already has a pickup');
    }

    return this.prisma.pickup.create({
      data: {
        reservationId,
        pickupAt: new Date(dto.pickupAt),
      },
      include: {
        reservation: true,
      },
    });
  }

  async update(pickupId: string, dto: UpdatePickupDto) {
    await this.ensureExists(pickupId);

    return this.prisma.pickup.update({
      where: { id: pickupId },
      data: {
        pickupAt: dto.pickupAt ? new Date(dto.pickupAt) : undefined,
      },
      include: {
        reservation: true,
      },
    });
  }

  private async ensureExists(pickupId: string) {
    const pickup = await this.prisma.pickup.findUnique({
      where: { id: pickupId },
      select: { id: true },
    });

    if (!pickup) {
      throw new NotFoundException('Pickup not found');
    }

    return pickup;
  }
}
