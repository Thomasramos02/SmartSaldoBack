import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alerts.entity';
import { AlertsController } from './alert.controller';
import { AlertsService } from './alert.service';
import { User } from '../users/users.entity';
import { Expense } from '../expenses/expenses.entity';
import { Goal } from '../goals/goals.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, User, Expense, Goal])],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertModule {}
