import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { NavigationModule } from './navigation/navigation.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ServicesModule } from './services/services.module.js';
import { ProvidersModule } from './providers/providers.module.js';
import { AvailabilityModule } from './availability/availability.module.js';
import { BookingHoldsModule } from './booking-holds/booking-holds.module.js';
import { BookingsModule } from './bookings/bookings.module.js';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    NavigationModule,
    CategoriesModule,
    ServicesModule,
    ProvidersModule,
    AvailabilityModule,
    BookingHoldsModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

