import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from '../user/user.module';
import { Wedding, WeddingSchema } from '../wedding/schemas/wedding.schema';
import { Collaborator, CollaboratorSchema } from '../collaborator/schemas/collaborator.schema';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Wedding.name, schema: WeddingSchema },
      { name: Collaborator.name, schema: CollaboratorSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
