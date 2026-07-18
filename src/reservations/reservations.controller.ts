import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateReservationDto, UpdateReservationStatusDto } from './dto';
import { ReservationsService } from './reservations.service';

@ApiTags('Reservations')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('reservations')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List current customer reservations' })
  findMyReservations(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findMyReservations(user.id);
  }

  @Get('reservations/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get current customer reservation by id' })
  findMyReservationById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reservationsService.findMyReservationById(user.id, id);
  }

  @Post('reservations')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create reservation from current cart' })
  createFromCart(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createFromCart(user.id, dto);
  }

  @Get('admin/reservations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all reservations for admin' })
  findAllForAdmin() {
    return this.reservationsService.findAllForAdmin();
  }

  @Get('admin/reservations/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get reservation by id for admin' })
  findByIdForAdmin(@Param('id') id: string) {
    return this.reservationsService.findByIdForAdmin(id);
  }

  @Patch('admin/reservations/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update reservation status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto);
  }
}
