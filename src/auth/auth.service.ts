import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userService.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
    });

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
    );
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return {
      user: { id: user._id.toString(), email: user.email, name: user.name },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
    );
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.userService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException();
    }

    const tokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!tokenValid) {
      throw new UnauthorizedException();
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
    );
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET')!,
        expiresIn: 900, // 15 minutes
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: 604800, // 7 days
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 12);
    await this.userService.updateRefreshToken(userId, hash);
  }
}
