import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { NavigationModule } from './navigation/navigation.module.js';

@Module({
  imports: [UsersModule, AuthModule, NavigationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
