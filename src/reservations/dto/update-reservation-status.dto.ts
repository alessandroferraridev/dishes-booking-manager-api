import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateReservationStatusDto {
  @ApiProperty({
    enum: [ReservationStatus.CONFIRMED, ReservationStatus.REJECTED],
    example: ReservationStatus.CONFIRMED,
  })
  @IsEnum(ReservationStatus)
  status!: ReservationStatus;
}
