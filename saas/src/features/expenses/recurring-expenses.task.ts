import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Expense } from './expenses.entity';
import { User } from '../users/users.entity';

@Injectable()
export class RecurringExpensesTask {
  private readonly logger = new Logger(RecurringExpensesTask.name);

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Roda todo dia 1º do mês às 00:00
   * Relança todos os gastos recorrentes para o próximo mês
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRecurringExpenses() {
    this.logger.log(
      '[RecurringExpensesTask] Starting recurring expenses task...',
    );

    try {
      const today = new Date();
      const dayOfMonth = today.getDate();

      // Roda apenas no 1º dia do mês
      if (dayOfMonth !== 1) {
        this.logger.log(
          `[RecurringExpensesTask] Skipping - not the 1st of the month (current day: ${dayOfMonth})`,
        );
        return;
      }

      // Busca todos os gastos recorrentes do mês anterior
      const previousMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      const currentMonthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const previousMonthEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        0,
      );

      const recurringExpenses = await this.expenseRepository.find({
        where: {
          isRecurring: true,
          date: MoreThanOrEqual(previousMonth),
          // Garante que não peguemos despesas do mês atual
        },
        relations: ['user', 'category'],
      });

      // Filtra apenas as do mês anterior (evita duplicatas)
      const expensesToDuplicate = recurringExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= previousMonth && expenseDate <= previousMonthEnd;
      });

      this.logger.log(
        `[RecurringExpensesTask] Found ${expensesToDuplicate.length} recurring expenses to duplicate`,
      );

      let createdCount = 0;

      for (const expense of expensesToDuplicate) {
        try {
          // Cria nova despesa para o mês atual, mesma data do mês anterior
          const newExpense = this.expenseRepository.create({
            description: expense.description,
            amount: expense.amount,
            isRecurring: true,
            isDeductible: expense.isDeductible,
            date: new Date(
              currentMonthStart.getFullYear(),
              currentMonthStart.getMonth(),
              new Date(expense.date).getDate(), // Mantém o dia original
            ),
            user: expense.user,
            category: expense.category,
          });

          await this.expenseRepository.save(newExpense);
          createdCount++;

          this.logger.log(
            `[RecurringExpensesTask] Created recurring expense: ${newExpense.description} for user ${expense.user.id}`,
          );
        } catch (error) {
          this.logger.error(
            `[RecurringExpensesTask] Error creating recurring expense: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `[RecurringExpensesTask] Task completed. Created ${createdCount} recurring expenses.`,
      );
    } catch (error) {
      this.logger.error(
        `[RecurringExpensesTask] Fatal error: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Método auxiliar para testar manualmente
   * Pode ser chamado via endpoint se necessário
   */
  async manuallyProcessRecurringExpenses(): Promise<{
    processed: number;
    message: string;
  }> {
    this.logger.log(
      '[RecurringExpensesTask] Manual trigger - Processing recurring expenses...',
    );

    try {
      const today = new Date();
      const previousMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      const currentMonthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const previousMonthEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        0,
      );

      const recurringExpenses = await this.expenseRepository.find({
        where: {
          isRecurring: true,
          date: MoreThanOrEqual(previousMonth),
        },
        relations: ['user', 'category'],
      });

      const expensesToDuplicate = recurringExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= previousMonth && expenseDate <= previousMonthEnd;
      });

      let createdCount = 0;

      for (const expense of expensesToDuplicate) {
        try {
          const newExpense = this.expenseRepository.create({
            description: expense.description,
            amount: expense.amount,
            isRecurring: true,
            isDeductible: expense.isDeductible,
            date: new Date(
              currentMonthStart.getFullYear(),
              currentMonthStart.getMonth(),
              new Date(expense.date).getDate(),
            ),
            user: expense.user,
            category: expense.category,
          });

          await this.expenseRepository.save(newExpense);
          createdCount++;
        } catch (error) {
          this.logger.error(
            `Error creating recurring expense: ${error.message}`,
          );
        }
      }

      return {
        processed: createdCount,
        message: `Successfully processed ${createdCount} recurring expenses`,
      };
    } catch (error) {
      this.logger.error(`Manual processing failed: ${error.message}`);
      throw error;
    }
  }
}
