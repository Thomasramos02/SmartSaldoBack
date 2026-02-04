import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.services';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { Expense } from '../expenses/expenses.entity';
import { Category } from '../category/category.entity';
import { Goal } from '../goals/goals.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Expense, Category, Goal])],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
  controllers: [UsersController],
})
export class UsersModule {}
