import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { NavigationController } from './navigation.controller.js';
import { NavigationService } from './navigation.service.js';

@Module({
  imports: [AuthModule],
  controllers: [NavigationController],
  providers: [NavigationService],
  exports: [NavigationService],
})
export class NavigationModule {}
