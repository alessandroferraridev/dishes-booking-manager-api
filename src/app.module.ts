import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DishesModule } from './dishes/dishes.module';
import { CartModule } from './cart/cart.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PickupsModule } from './pickups/pickups.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DishesModule,
    CartModule,
    ReservationsModule,
    PickupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
