import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CreatePickupDto {
  @ApiProperty({ example: '2026-07-18T18:30:00.000Z' })
  @IsDateString()
  pickupAt!: string;
}
