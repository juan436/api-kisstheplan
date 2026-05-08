import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../../user/user.service';
import { Wedding } from '../../wedding/schemas/wedding.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private userService: UserService,
    @InjectModel(Wedding.name) private weddingModel: Model<Wedding>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    // Buscar la boda del usuario de forma ligera
    const wedding = await this.weddingModel.findOne({ userId: user._id }).lean();

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      weddingId: wedding ? wedding._id.toString() : null,
    };
  }
}
