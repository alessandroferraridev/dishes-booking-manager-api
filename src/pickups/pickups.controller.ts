import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreatePickupDto, UpdatePickupDto } from './dto';
import { PickupsService } from './pickups.service';

@ApiTags('Pickups')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PickupsController {
  constructor(private readonly pickupsService: PickupsService) {}

  @Post('admin/reservations/:reservationId/pickup')
  @ApiOperation({ summary: 'Create pickup for reservation' })
  createForReservation(
    @Param('reservationId') reservationId: string,
    @Body() dto: CreatePickupDto,
  ) {
    return this.pickupsService.createForReservation(reservationId, dto);
  }

  @Patch('admin/pickups/:id')
  @ApiOperation({ summary: 'Update pickup' })
  update(@Param('id') id: string, @Body() dto: UpdatePickupDto) {
    return this.pickupsService.update(id, dto);
  }
}
