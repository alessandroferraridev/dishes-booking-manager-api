import {
  Body,
  Controller,
  Delete,
  Get,
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
import { DishesService } from './dishes.service';
import { CreateDishDto, UpdateDishDto } from './dto';

@ApiTags('Dishes')
@Controller()
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get('dishes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List active dishes' })
  findActive() {
    return this.dishesService.findActive();
  }

  @Get('dishes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get active dish by id' })
  findActiveById(@Param('id') id: string) {
    return this.dishesService.findActiveById(id);
  }

  @Get('admin/dishes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all dishes for admin' })
  findAllForAdmin() {
    return this.dishesService.findAllForAdmin();
  }

  @Post('admin/dishes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create dish' })
  create(@Body() dto: CreateDishDto) {
    return this.dishesService.create(dto);
  }

  @Patch('admin/dishes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update dish' })
  update(@Param('id') id: string, @Body() dto: UpdateDishDto) {
    return this.dishesService.update(id, dto);
  }

  @Delete('admin/dishes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate dish' })
  softDelete(@Param('id') id: string) {
    return this.dishesService.softDelete(id);
  }
}
