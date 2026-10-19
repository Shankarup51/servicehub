import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProvidersController } from './providers.controller.js';
import { AdminVerificationsController } from './admin-verifications.controller.js';
import { ProvidersService } from './providers.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProvidersController, AdminVerificationsController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
