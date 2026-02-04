import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UsersModule } from '../users/users.module'; // ✅ IMPORTANTE
import Stripe from 'stripe';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, UsersModule, AuthModule],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const secretKey = configService.get<string>('STRIPE_SECRET_KEY');

        if (!secretKey) {
          throw new Error(
            'STRIPE_SECRET_KEY is not defined in the environment variables.',
          );
        }

        return new Stripe(secretKey, {
          apiVersion: '2026-01-28.clover',
        });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
