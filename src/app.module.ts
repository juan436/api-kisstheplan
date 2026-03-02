import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WeddingModule } from './wedding/wedding.module';
import { GuestModule } from './guest/guest.module';
import { BudgetModule } from './budget/budget.module';
import { TaskModule } from './task/task.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebPageModule } from './web-page/web-page.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/kisstheplan'),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    AuthModule,
    UserModule,
    WeddingModule,
    GuestModule,
    BudgetModule,
    TaskModule,
    DashboardModule,
    WebPageModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
