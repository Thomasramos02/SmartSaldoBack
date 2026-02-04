import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { User } from './features/users/users.entity';
import { Expense } from './features/expenses/expenses.entity';
import { Category } from './features/category/category.entity';
import { Alert } from './features/alert/alerts.entity';
import { Goal } from './features/goals/goals.entity';
import { CategoryModule } from './features/category/category.module';
import { ExpensesModule } from './features/expenses/expense.module';
import { GoalsModule } from './features/goals/goals.module';
import { AlertModule } from './features/alert/alert.module';
import { IAModule } from './features/ai/ia.module';
import { ReportModule } from './features/report/report.module';
import { StripeModule } from './features/stripe/stripe.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'saas',
      entities: [User, Expense, Category, Alert, Goal],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ExpensesModule,
    CategoryModule,
    GoalsModule,
    AlertModule,
    IAModule,
    ReportModule,
    StripeModule,
  ],
})
export class AppModule {}
