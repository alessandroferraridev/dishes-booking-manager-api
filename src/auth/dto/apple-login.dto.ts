import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AppleLoginDto {
  @ApiProperty({
    description: 'Apple identity token returned by the client application',
  })
  @IsString()
  idToken!: string;

  @ApiProperty({
    required: false,
    description: 'First name returned by Apple on the first login only',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    required: false,
    description: 'Last name returned by Apple on the first login only',
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}
