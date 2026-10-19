import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BookingHoldsController } from './booking-holds.controller.js';
import { BookingHoldsService } from './booking-holds.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BookingHoldsController],
  providers: [BookingHoldsService],
  exports: [BookingHoldsService],
})
export class BookingHoldsModule {}
