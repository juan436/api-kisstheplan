import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebPageController } from './web-page.controller';
import { WebPageService } from './web-page.service';
import { WebPage, WebPageSchema } from './schemas/web-page.schema';
import { Guest, GuestSchema } from '../guest/schemas/guest.schema';
import { Wedding, WeddingSchema } from '../wedding/schemas/wedding.schema';
import { WeddingModule } from '../wedding/wedding.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebPage.name, schema: WebPageSchema },
      { name: Guest.name, schema: GuestSchema },
      { name: Wedding.name, schema: WeddingSchema },
    ]),
    WeddingModule,
  ],
  controllers: [WebPageController],
  providers: [WebPageService],
  exports: [WebPageService],
})
export class WebPageModule {}
