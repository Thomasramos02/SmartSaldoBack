import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Alert, AlertType } from './alerts.entity';
import { User } from '../users/users.entity';
import { Expense } from '../expenses/expenses.entity';
import { Goal } from '../goals/goals.entity';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
  ) {}

  async generateAlerts(userId: number): Promise<void> {
    this.logger.log(`Generating alerts for user ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    if (user.plan !== 'premium') {
      this.logger.log(`User ${userId} is free — alerts disabled`);
      return;
    }
    await this.checkForExcessiveSpending(userId);
    await this.checkForCategoryLimits(userId);
    await this.checkForGoalStatus(userId);
  }

  private async checkForGoalStatus(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const goals = await this.goalRepository.find({ where: { userId } });

    for (const goal of goals) {
      if (goal.currentAmount >= goal.targetAmount) {
        const message = `Parabéns! Você atingiu sua meta '${goal.name}'!`;
        await this.createAlert(user, message, AlertType.GOAL_EXCEED);
        continue;
      }

      if (goal.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadline = new Date(goal.deadline);
        deadline.setHours(0, 0, 0, 0);

        const createdAt = new Date(goal.createdAt);
        createdAt.setHours(0, 0, 0, 0);

        if (today >= deadline) {
          const message = `Atenção: O prazo para sua meta '${goal.name}' encerrou e ela não foi atingida.`;
          await this.createAlert(user, message, AlertType.GOAL_EXCEED);
          continue;
        }

        const totalDuration = deadline.getTime() - createdAt.getTime();
        const elapsedTime = today.getTime() - createdAt.getTime();
        const timeElapsedPercentage = (elapsedTime / totalDuration) * 100;

        const progressPercentage =
          (goal.currentAmount / goal.targetAmount) * 100;

        if (timeElapsedPercentage - progressPercentage > 20) {
          const message = `Atenção: Você pode não atingir sua meta '${goal.name}' a tempo com seu ritmo atual.`;
          await this.createAlert(user, message, AlertType.GOAL_EXCEED);
        }
      }
    }
  }

  private async checkForExcessiveSpending(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.monthlyBudget || user.monthlyBudget <= 0) return;

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const expenses = await this.expenseRepository.find({
      where: { user: { id: userId }, date: Between(startDate, endDate) },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const usage = (totalSpent / user.monthlyBudget) * 100;

    let message: string | null = null;

    if (usage >= 100) {
      message = `Você ultrapassou o orçamento mensal! (${usage.toFixed(0)}%)`;
    } else if (usage >= 90) {
      message = `Você atingiu 90% do orçamento mensal! (${usage.toFixed(0)}%)`;
    } else if (usage >= 50) {
      message = `Você já utilizou 50% do seu orçamento mensal. (${usage.toFixed(0)}%)`;
    }

    if (message) {
      await this.createAlert(user, message, AlertType.EXCESSED_SPENDING);
    }
  }

  private async checkForCategoryLimits(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const expenses = await this.expenseRepository.find({
      where: { user: { id: userId }, date: Between(startDate, endDate) },
      relations: ['category'],
    });

    // Group expenses by category
    const categoryExpenses = new Map<
      number,
      { name: string; limit: number | null; total: number }
    >();

    for (const expense of expenses) {
      if (!expense.category) continue;

      const categoryId = expense.category.id;
      if (!categoryExpenses.has(categoryId)) {
        categoryExpenses.set(categoryId, {
          name: expense.category.name,
          limit: expense.category.limit ?? null,
          total: 0,
        });
      }

      const entry = categoryExpenses.get(categoryId)!;
      entry.total += expense.amount;
    }

    // Check each category with a limit
    for (const [, categoryData] of categoryExpenses) {
      if (!categoryData.limit || categoryData.limit <= 0) continue;

      const usage = (categoryData.total / categoryData.limit) * 100;
      let message: string | null = null;

      if (usage >= 100) {
        message = `Categoria '${categoryData.name}' ultrapassou o limite! (${usage.toFixed(0)}%)`;
      } else if (usage >= 90) {
        message = `Categoria '${categoryData.name}' atingiu 90% do limite! (${usage.toFixed(0)}%)`;
      } else if (usage >= 75) {
        message = `Categoria '${categoryData.name}' atingiu 75% do limite. (${usage.toFixed(0)}%)`;
      }

      if (message) {
        await this.createAlert(user, message, AlertType.CATEGORY_EXCEEDED);
      }
    }
  }

  private async createAlert(
    user: User,
    message: string,
    type: AlertType,
  ): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const recentAlert = await this.alertRepository.findOne({
      where: {
        user: { id: user.id },
        type,
        message: message, // Check for exact same message to avoid spamming slightly different alerts
        createdAt: Between(oneHourAgo, new Date()),
      },
    });

    if (!recentAlert) {
      const newAlert = this.alertRepository.create({
        user,
        message,
        type,
      });
      await this.alertRepository.save(newAlert);
      this.logger.log(`Created new ${type} alert for user ${user.id}`);
    }
  }

  async getAlerts(userId: number): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(alertId: number, userId: number): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId, user: { id: userId } },
    });
    if (!alert) {
      throw new Error('Alert not found');
    }
    alert.isRead = true;
    return this.alertRepository.save(alert);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.alertRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
  }
}
