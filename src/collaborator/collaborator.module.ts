import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Collaborator, CollaboratorSchema } from './schemas/collaborator.schema';
import { Wedding, WeddingSchema } from '../wedding/schemas/wedding.schema';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorController, CollaboratorPublicController } from './collaborator.controller';
import { WeddingModule } from '../wedding/wedding.module';
import { KtpMailerModule } from '../mailer/ktp-mailer.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collaborator.name, schema: CollaboratorSchema },
      { name: Wedding.name, schema: WeddingSchema },
    ]),
    WeddingModule,
    KtpMailerModule,
    UserModule,
  ],
  controllers: [CollaboratorController, CollaboratorPublicController],
  providers: [CollaboratorService],
  exports: [CollaboratorService, MongooseModule],
})
export class CollaboratorModule {}
