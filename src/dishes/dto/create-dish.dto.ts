import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDishDto {
  @ApiProperty({ example: 'Lasagna' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Homemade lasagna with meat sauce' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1200, description: 'Price in cents' })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
