import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { GoogleProfile } from './strategies/google.strategy';
import { Wedding } from '../wedding/schemas/wedding.schema';
import { Collaborator } from '../collaborator/schemas/collaborator.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectModel(Wedding.name) private weddingModel: Model<Wedding>,
    @InjectModel(Collaborator.name) private collaboratorModel: Model<Collaborator>,
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

    const tokens = await this.generateTokens(user._id.toString(), user.email, null, null);
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return {
      user: { id: user._id.toString(), email: user.email, name: user.name },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');
    if (!user.passwordHash) throw new UnauthorizedException('Esta cuenta usa Google. Inicia sesión con Google.');

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Credenciales incorrectas');

    const userId = user._id.toString();
    const { weddingId, role } = await this.resolveWeddingContext(userId);
    const weddings = user.role !== 'admin' ? await this.resolveAllWeddings(userId) : [];
    const tokens = await this.generateTokens(userId, user.email, weddingId, role);
    await this.updateRefreshTokenHash(userId, tokens.refreshToken);

    return {
      user: { id: userId, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role },
      weddings,
      ...tokens,
    };
  }

  async refresh(userId: string, refreshToken: string, currentWeddingId: string | null) {
    const user = await this.userService.findById(userId);
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException();

    const tokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenValid) throw new UnauthorizedException();

    let weddingId: string | null = null;
    let role: 'owner' | 'collaborator' | 'admin' | null = null;

    if (user.role === 'admin') {
      role = 'admin';
    } else {
      const allWeddings = await this.resolveAllWeddings(userId);
      const current = allWeddings.find(w => w.weddingId === currentWeddingId);
      const active = current ?? allWeddings[0];
      weddingId = active?.weddingId ?? null;
      role = active?.role ?? 'owner';
    }

    const tokens = await this.generateTokens(userId, user.email, weddingId, role);
    await this.updateRefreshTokenHash(userId, tokens.refreshToken);
    return tokens;
  }

  async switchWedding(userId: string, email: string, targetWeddingId: string) {
    const accessible = await this.resolveAllWeddings(userId);
    const target = accessible.find(w => w.weddingId === targetWeddingId);
    if (!target) throw new ForbiddenException('No tienes acceso a esta boda');

    const tokens = await this.generateTokens(userId, email, target.weddingId, target.role);
    await this.updateRefreshTokenHash(userId, tokens.refreshToken);
    return { ...tokens, role: target.role, weddingId: target.weddingId };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (!user.passwordHash) throw new ForbiddenException('Esta cuenta usa Google. No puedes cambiar la contraseña.');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('La contraseña actual no es correcta');

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.userService.updatePasswordHash(userId, newHash);
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
      onboardingComplete: user.onboardingComplete ?? false,
      role: user.role ?? 'user',
    };
  }

  async validateGoogleUser(profile: GoogleProfile) {
    let user = await this.userService.findByGoogleId(profile.googleId);

    if (!user) {
      const existing = await this.userService.findByEmail(profile.email);
      if (existing) {
        await this.userService.linkGoogleId(existing._id.toString(), profile.googleId, profile.avatarUrl);
        user = await this.userService.findById(existing._id.toString());
      } else {
        user = await this.userService.createGoogleUser(profile);
      }
    }

    const userId = user!._id.toString();
    const { weddingId, role } = await this.resolveWeddingContext(userId);
    const weddings = user!.role !== 'admin' ? await this.resolveAllWeddings(userId) : [];
    const tokens = await this.generateTokens(userId, user!.email, weddingId, role);
    await this.updateRefreshTokenHash(userId, tokens.refreshToken);

    return {
      user: {
        id: userId,
        email: user!.email,
        name: user!.name,
        avatarUrl: user!.avatarUrl,
        onboardingComplete: user!.onboardingComplete ?? false,
        role: user!.role,
      },
      weddings,
      ...tokens,
    };
  }

  async resolveAllWeddings(userId: string): Promise<Array<{ weddingId: string; role: 'owner' | 'collaborator'; weddingName: string }>> {
    const result: Array<{ weddingId: string; role: 'owner' | 'collaborator'; weddingName: string }> = [];

    const ownWedding = await this.weddingModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (ownWedding) {
      result.push({
        weddingId: ownWedding._id.toString(),
        role: 'owner',
        weddingName: `${ownWedding.partner1Name} & ${ownWedding.partner2Name}`,
      });
    }

    const collabs = await this.collaboratorModel.find({ userId: new Types.ObjectId(userId), status: 'accepted' }).lean();
    if (collabs.length > 0) {
      const collabWeddings = await this.weddingModel.find({
        _id: { $in: collabs.map(c => c.weddingId) },
      }).lean();
      for (const w of collabWeddings) {
        result.push({
          weddingId: w._id.toString(),
          role: 'collaborator',
          weddingName: `${w.partner1Name} & ${w.partner2Name}`,
        });
      }
    }

    return result;
  }

  async resolveWeddingContext(userId: string): Promise<{ weddingId: string | null; role: 'owner' | 'collaborator' | 'admin' | null }> {
    const user = await this.userService.findById(userId);
    if (!user) return { weddingId: null, role: null };
    if (user.role === 'admin') return { weddingId: null, role: 'admin' };

    const weddings = await this.resolveAllWeddings(userId);
    if (weddings.length === 0) return { weddingId: null, role: 'owner' };
    return { weddingId: weddings[0].weddingId, role: weddings[0].role };
  }

  private async generateTokens(userId: string, email: string, weddingId: string | null, role: 'owner' | 'collaborator' | 'admin' | null) {
    const payload = { sub: userId, email, weddingId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET')!,
        expiresIn: 900,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: 604800,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 12);
    await this.userService.updateRefreshToken(userId, hash);
  }
}
