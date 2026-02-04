import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { Response } from 'express';

type AuthInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

type ForgotPasswordInput = {
  email: string;
};

type VerifyResetTokenInput = {
  token: string;
};

type ResetPasswordInput = {
  token: string;
  password: string;
  confirmPassword: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: AuthInput, @Res({ passthrough: true }) res: Response) {
    return this.authService.authenticate(body, res);
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordInput) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('verify-reset-token')
  @HttpCode(HttpStatus.OK)
  verifyResetToken(@Body() body: VerifyResetTokenInput) {
    return this.authService.verifyResetToken(body.token);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: ResetPasswordInput) {
    if (body.password !== body.confirmPassword) {
      throw new UnauthorizedException('As senhas nao coincidem');
    }
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signup(@Body() body: SignUpInput) {
    return this.authService.create(body.name, body.email, body.password);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getUserProfile(@Request() req) {
    return req.user;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  // Callback do Google
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Request() req, @Res() res) {
    await this.authService.loginWithGoogle(req.user, res);
    const redirect = req.query.redirect || '/dashboard';
    const plan = req.query.plan || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const safeFrontendUrl = frontendUrl.replace(/\/+$/, '');
    const encodedRedirect = encodeURIComponent(String(redirect));
    const encodedPlan = encodeURIComponent(String(plan));
    res.redirect(
      `${safeFrontendUrl}/auth/callback?redirect=${encodedRedirect}&plan=${encodedPlan}`,
    );
  }
}
