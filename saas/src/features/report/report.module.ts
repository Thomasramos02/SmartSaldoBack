import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportService } from './report.service';
import { ReportController } from './report.controller';

import { Expense } from '../expenses/expenses.entity';
import { Category } from '../category/category.entity';
import { User } from '../users/users.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Category, User]), AuthModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
