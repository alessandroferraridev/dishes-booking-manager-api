import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @ApiPropertyOptional({ example: 'Please prepare it for 8 PM' })
  @IsOptional()
  @IsString()
  notes?: string;
}
