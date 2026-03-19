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
import { UploadModule } from './upload/upload.module';
import { VendorModule } from './vendor/vendor.module';
import { CalendarModule } from './calendar/calendar.module';
import { ScriptModule } from './script/script.module';

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
    UploadModule,
    VendorModule,
    CalendarModule,
    ScriptModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
