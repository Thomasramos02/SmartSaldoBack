import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.services';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/users.entity';
import { Request, Response } from 'express';
import { JwtUserPayload } from './type/JwtUserPayload';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

type AuthInput = { email: string; password: string };
type AuthResult = { access_token: string; user?: Omit<User, 'password'> };

type GoogleLoginResult = { access_token: string; user: Omit<User, 'password'> };

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findUserByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async authenticate(input: AuthInput, res: Response): Promise<AuthResult> {
    const user = await this.validateUser(input.email, input.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const jwtUser: JwtUserPayload = {
      id: user.id,
      email: user.email,
      plan: user.plan,
    };

    const acessToken = this.generateAccessToken(jwtUser);
    const refreshToken = this.generateRefreshToken(jwtUser);
    this.setAccessCookie(res, acessToken);
    this.setRefreshCookie(res, refreshToken);

    return {
      access_token: acessToken,
      user,
    };
  }
  async refresh(req: Request, res: Response): Promise<AuthResult> {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const jwtUser: JwtUserPayload = {
        id: user.id,
        email: user.email,
        plan: user.plan,
      };

      const accessToken = this.generateAccessToken(jwtUser);
      this.setAccessCookie(res, accessToken);

      return {
        access_token: accessToken,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async create(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResult> {
    try {
      const user = await this.usersService.create(name, email, password);
      const payload = { sub: user.id, email: user.email, plan: user.plan };
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }
  async loginWithGoogle(
    googleUser: {
      email: string;
      firstName: string;
      lastName: string;
    },
    res: Response,
  ): Promise<GoogleLoginResult> {
    const foundUser = await this.usersService.findUserByEmail(googleUser.email); // User | null
    let safeUser: Omit<User, 'password'>;

    if (!foundUser) {
      const randomPassword = Math.random().toString(36).slice(-8);
      safeUser = await this.usersService.create(
        `${googleUser.firstName} ${googleUser.lastName}`,
        googleUser.email,
        randomPassword,
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = foundUser;
      safeUser = result;
    }
    if (!safeUser) {
      throw new UnauthorizedException('User could not be found or created.');
    }

    const payload = {
      sub: safeUser.id,
      email: safeUser.email,
      plan: safeUser.plan,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken({
      id: safeUser.id,
      email: safeUser.email,
      plan: safeUser.plan,
    });
    this.setAccessCookie(res, accessToken);
    this.setRefreshCookie(res, refreshToken);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }
  private generateAccessToken(user: JwtUserPayload) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        plan: user.plan,
      },
      { expiresIn: '20m' },
    );
  }

  private generateRefreshToken(user: JwtUserPayload) {
    return this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });
  }

  setAccessCookie(res: Response, accessToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 20 * 60 * 1000,
    });
  }

  setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  clearRefreshCookie(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  }

  clearAccessCookie(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  }

  logout(res: Response) {
    this.clearAccessCookie(res);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  async verifyResetToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetTokenHash(tokenHash);
    if (!user || !user.resetPasswordExpiresAt) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
      await this.usersService.clearPasswordResetToken(user.id);
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    return { valid: true };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (user) {
      const { resetToken, tokenHash, expiresAt } =
        this.createPasswordResetToken();
      await this.usersService.setPasswordResetToken(
        user.id,
        tokenHash,
        expiresAt,
      );

      await this.sendResetEmail(user.email, resetToken);

      if (process.env.NODE_ENV !== 'production') {
        return {
          message: 'Reset token gerado.',
          resetToken,
        };
      }
    }

    return {
      message:
        'Se o email existir, enviaremos instruÃ§Ãµes para redefinir a senha.',
    };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetTokenHash(tokenHash);
    if (!user || !user.resetPasswordExpiresAt) {
      throw new UnauthorizedException('Token invÃ¡lido ou expirado');
    }

    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
      await this.usersService.clearPasswordResetToken(user.id);
      throw new UnauthorizedException('Token invÃ¡lido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersService.setPasswordHash(user.id, hashedPassword);
    await this.usersService.clearPasswordResetToken(user.id);

    return { success: true };
  }

  private createPasswordResetToken() {
    const resetToken = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    return { resetToken, tokenHash, expiresAt };
  }

  private createTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure =
      (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

    if (!host || !user || !pass) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[auth] SMTP nao configurado. Defina SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS',
        );
      }
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  private async sendResetEmail(to: string, resetToken: string) {
    const transporter = this.createTransporter();
    if (!transporter) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[auth] Reset token (dev):', resetToken);
      }
      return;
    }

    const from =
      process.env.MAIL_FROM || 'SmartSaldo <smartsaldo.oficial@gmail.com>';

    const mailOptions = {
      from,
      to,
      subject: 'Codigo de redefinicao de senha',
      text: `Seu codigo de redefinicao de senha: ${resetToken}`,
      html: `<p>Use o codigo abaixo para redefinir sua senha:</p><p><strong>${resetToken}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);
  }
}
