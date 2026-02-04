import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './expenses.entity';
import { ExpensesService } from './expenses.services';
import { ExpensesController } from './expenses.controller';
import { CategoryModule } from '../category/category.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Category } from '../category/category.entity';
import { User } from '../users/users.entity';
import { CategoryIAService } from './categoryIA.service';
import { IAModule } from '../ai/ia.module';
import { HttpModule } from '@nestjs/axios';
import { AlertModule } from '../alert/alert.module';
import { RecurringExpensesTask } from './recurring-expenses.task';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Expense, Category, User]),
    CategoryModule,
    AuthModule,
    UsersModule,
    IAModule,
    AlertModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService, CategoryIAService, RecurringExpensesTask],
})
export class ExpensesModule {}
