import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from '../expenses/expenses.entity';
import { Category } from '../category/category.entity';
import { User } from '../users/users.entity';
import { getReportTemplate } from './templates/report.template';
import puppeteer from 'puppeteer';

export interface ReportData {
  month: string;
  year: number;
  totalExpenses: number;
  categories: {
    name: string;
    icon: string;
    color: string;
    totalSpent: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    expenses: {
      date: string;
      description: string;
      amount: number;
    }[];
  }[];
  topExpenses: {
    date: string;
    category: string;
    description: string;
    amount: number;
  }[];
  averageExpense: number;
  budgetInfo: {
    monthlyBudget: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  };
  generatedAt: string;
  userName: string;
  dailyAverage: number;
  daysInMonth: number;
  statusAlert: {
    level: 'safe' | 'warning' | 'danger';
    message: string;
  };
  last30daysTotal?: number;
  daysRemaining?: number;
  projectedTotal?: number;
  weeklyBreakdown: {
    week: number;
    total: number;
    average: number;
    percentage: number;
  }[];
  expenseFrequency: {
    totalTransactions: number;
    averagePerDay: number;
    mostActiveDay: string;
    mostActiveDayCount: number;
  };
  comparison: {
    lastMonth: number;
    difference: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
  };
  insights: {
    biggestCategory: string;
    biggestCategoryPercentage: number;
    averageTicket: number;
    expensiveDays: {
      date: string;
      total: number;
    }[];
  };
  financialHealth: {
    score: number;
    level: 'excellent' | 'good' | 'moderate' | 'poor';
    factors: {
      budgetCompliance: number;
      consistency: number;
      diversification: number;
    };
  };
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async getLastMonthExpenses(
    userId: number,
    month: number,
    year: number,
  ) {
    const lastMonth = month === 0 ? 11 : month - 1;
    const lastYear = month === 0 ? year - 1 : year;

    const startDate = new Date(lastYear, lastMonth, 1, 0, 0, 0);
    const endDate = new Date(lastYear, lastMonth + 1, 0, 23, 59, 59);

    const expenses = await this.expenseRepository.find({
      where: {
        user: { id: userId },
        date: Between(startDate, endDate),
      },
    });

    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }

  private calculateWeeklyBreakdown(expenses: any[], daysInMonth: number) {
    const weeks = Math.ceil(daysInMonth / 7);
    const weeklyData = Array.from({ length: weeks }, (_, i) => ({
      week: i + 1,
      total: 0,
      average: 0,
      percentage: 0,
    }));

    expenses.forEach((expense) => {
      const day = new Date(expense.date).getDate();
      const weekIndex = Math.floor((day - 1) / 7);
      if (weekIndex < weeks) {
        weeklyData[weekIndex].total += expense.amount;
      }
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    weeklyData.forEach((week) => {
      week.average = week.total / 7;
      week.percentage =
        totalExpenses > 0 ? (week.total / totalExpenses) * 100 : 0;
    });

    return weeklyData;
  }

  private calculateExpenseFrequency(expenses: any[]) {
    const dayCount = new Map<string, number>();

    expenses.forEach((expense) => {
      const dayOfWeek = new Date(expense.date).toLocaleDateString('pt-BR', {
        weekday: 'long',
      });
      dayCount.set(dayOfWeek, (dayCount.get(dayOfWeek) || 0) + 1);
    });

    let mostActiveDay = '';
    let mostActiveDayCount = 0;

    dayCount.forEach((count, day) => {
      if (count > mostActiveDayCount) {
        mostActiveDayCount = count;
        mostActiveDay = day;
      }
    });

    const uniqueDays = new Set(
      expenses.map((e) => new Date(e.date).toDateString()),
    ).size;

    return {
      totalTransactions: expenses.length,
      averagePerDay: uniqueDays > 0 ? expenses.length / uniqueDays : 0,
      mostActiveDay,
      mostActiveDayCount,
    };
  }

  private calculateFinancialHealth(
    percentageUsed: number,
    expenses: any[],
    categories: any[],
  ) {
    // Budget Compliance (0-40 pontos)
    let budgetCompliance = 0;
    if (percentageUsed <= 70) budgetCompliance = 40;
    else if (percentageUsed <= 85) budgetCompliance = 30;
    else if (percentageUsed <= 100) budgetCompliance = 20;
    else budgetCompliance = 0;

    // Consistency (0-30 pontos) - Baseado na variação de gastos
    const amounts = expenses.map((e) => e.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length || 0;
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      amounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avg > 0 ? (stdDev / avg) * 100 : 100;

    let consistency = 0;
    if (coefficientOfVariation < 50) consistency = 30;
    else if (coefficientOfVariation < 100) consistency = 20;
    else if (coefficientOfVariation < 150) consistency = 10;
    else consistency = 5;

    // Diversification (0-30 pontos) - Baseado na distribuição entre categorias
    const topCategoryPercentage =
      categories.length > 0
        ? Math.max(...categories.map((c) => c.percentage))
        : 100;
    let diversification = 0;
    if (topCategoryPercentage < 30) diversification = 30;
    else if (topCategoryPercentage < 50) diversification = 20;
    else if (topCategoryPercentage < 70) diversification = 10;
    else diversification = 5;

    const score = budgetCompliance + consistency + diversification;

    let level: 'excellent' | 'good' | 'moderate' | 'poor';
    if (score >= 80) level = 'excellent';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'moderate';
    else level = 'poor';

    return {
      score,
      level,
      factors: {
        budgetCompliance,
        consistency,
        diversification,
      },
    };
  }

  private async getCategoryTrends(
    userId: number,
    categoryId: number,
    currentMonth: number,
    currentYear: number,
  ) {
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthStart = new Date(lastYear, lastMonth, 1, 0, 0, 0);
    const lastMonthEnd = new Date(lastYear, lastMonth + 1, 0, 23, 59, 59);

    const lastMonthExpenses = await this.expenseRepository.find({
      where: {
        user: { id: userId },
        category: { id: categoryId },
        date: Between(lastMonthStart, lastMonthEnd),
      },
    });

    return lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }

  async generateReportData(
    userId: number,
    month: number,
    year: number,
  ): Promise<ReportData> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const startDate = new Date(year, month, 1, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const expenses = await this.expenseRepository.find({
      where: {
        user: { id: userId },
        date: Between(startDate, endDate),
      },
      relations: ['category'],
      order: { date: 'DESC' },
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Categories with trends
    const categoriesMap = new Map();
    for (const expense of expenses) {
      const cat = expense.category;
      if (!categoriesMap.has(cat.id)) {
        const lastMonthTotal = await this.getCategoryTrends(
          userId,
          cat.id,
          month,
          year,
        );

        categoriesMap.set(cat.id, {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          totalSpent: 0,
          expenses: [],
          lastMonthTotal,
        });
      }
      const group = categoriesMap.get(cat.id);
      group.totalSpent += expense.amount;

      group.expenses.push({
        date: new Date(expense.date).toLocaleDateString('pt-BR'),
        description: expense.description,
        amount: expense.amount,
      });
    }

    const categories = Array.from(categoriesMap.values()).map((cat) => {
      const percentage =
        totalExpenses > 0
          ? Number(((cat.totalSpent / totalExpenses) * 100).toFixed(1))
          : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercentage = 0;

      if (cat.lastMonthTotal > 0) {
        const change =
          ((cat.totalSpent - cat.lastMonthTotal) / cat.lastMonthTotal) * 100;
        trendPercentage = Math.abs(change);
        if (change > 5) trend = 'up';
        else if (change < -5) trend = 'down';
        else trend = 'stable';
      }

      return {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        totalSpent: cat.totalSpent,
        percentage,
        trend,
        trendPercentage: Number(trendPercentage.toFixed(1)),
        expenses: cat.expenses,
      };
    });

    const topExpenses = [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((e) => ({
        date: new Date(e.date).toLocaleDateString('pt-BR'),
        category: e.category.name,
        description: e.description,
        amount: e.amount,
      }));

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const monthlyBudgetNum = Number(user.monthlyBudget) || 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth =
      today.getMonth() === month && today.getFullYear() === year;
    const dayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth;
    const daysRemaining = isCurrentMonth ? daysInMonth - today.getDate() : 0;

    const dailyAverage = dayOfMonth > 0 ? totalExpenses / dayOfMonth : 0;
    const projectedTotal = isCurrentMonth
      ? dailyAverage * daysInMonth
      : totalExpenses;

    let statusAlert: { level: 'safe' | 'warning' | 'danger'; message: string };
    const percentageUsed =
      monthlyBudgetNum > 0
        ? Number(((totalExpenses / monthlyBudgetNum) * 100).toFixed(1))
        : 0;

    if (monthlyBudgetNum > 0) {
      if (projectedTotal > monthlyBudgetNum) {
        statusAlert = {
          level: 'danger',
          message: `Projeção de estouro: R$ ${(projectedTotal - monthlyBudgetNum).toFixed(2)}`,
        };
      } else if (percentageUsed >= 75) {
        statusAlert = {
          level: 'warning',
          message: `75% do orçamento utilizado`,
        };
      } else {
        statusAlert = {
          level: 'safe',
          message: `Dentro do orçamento`,
        };
      }
    } else {
      statusAlert = {
        level: 'safe',
        message: 'Sem orçamento definido',
      };
    }

    const last30DaysStart = new Date(year, month, 1);
    last30DaysStart.setDate(last30DaysStart.getDate() - 30);
    const last30DaysExpenses = await this.expenseRepository.find({
      where: {
        user: { id: userId },
        date: Between(last30DaysStart, endDate),
      },
    });
    const last30daysTotal = last30DaysExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );

    // New analytics
    const weeklyBreakdown = this.calculateWeeklyBreakdown(
      expenses,
      daysInMonth,
    );
    const expenseFrequency = this.calculateExpenseFrequency(expenses);
    const lastMonthTotal = await this.getLastMonthExpenses(userId, month, year);

    const comparison: ReportData['comparison'] = {
      // Adicione a tipagem aqui
      lastMonth: lastMonthTotal,
      difference: totalExpenses - lastMonthTotal,
      percentageChange:
        lastMonthTotal > 0
          ? ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100
          : 0,
      trend:
        totalExpenses > lastMonthTotal
          ? 'up'
          : totalExpenses < lastMonthTotal
            ? 'down'
            : 'stable', // Adicione o 'as ...' aqui
    };

    // Expensive days
    const dailyTotals = new Map<string, number>();
    expenses.forEach((exp) => {
      const dateStr = new Date(exp.date).toLocaleDateString('pt-BR');
      dailyTotals.set(dateStr, (dailyTotals.get(dateStr) || 0) + exp.amount);
    });

    const expensiveDays = Array.from(dailyTotals.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const biggestCategory =
      categories.length > 0
        ? categories.reduce(
            (max, cat) => (cat.totalSpent > max.totalSpent ? cat : max),
            categories[0],
          )
        : null;

    const insights = {
      biggestCategory: biggestCategory?.name || 'N/A',
      biggestCategoryPercentage: biggestCategory?.percentage || 0,
      averageTicket: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      expensiveDays,
    };

    const financialHealth = this.calculateFinancialHealth(
      percentageUsed,
      expenses,
      categories,
    );

    return {
      month: monthNames[month],
      year,
      totalExpenses,
      categories,
      topExpenses,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      budgetInfo: {
        monthlyBudget: monthlyBudgetNum,
        spent: totalExpenses,
        remaining: monthlyBudgetNum - totalExpenses,
        percentageUsed,
      },
      generatedAt: new Date().toLocaleDateString('pt-BR'),
      userName: user.name || user.email,
      dailyAverage,
      daysInMonth,
      statusAlert,
      last30daysTotal,
      daysRemaining,
      projectedTotal,
      weeklyBreakdown,
      expenseFrequency,
      comparison,
      insights,
      financialHealth,
    };
  }

  async generatePDF(reportData: ReportData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const html = getReportTemplate(reportData);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
