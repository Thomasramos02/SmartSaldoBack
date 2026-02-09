import { AlertsService } from '../alert/alert.service';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Expense } from './expenses.entity';
import { Category } from '../category/category.entity';
import { CreateExpenseDto } from './dto/createExpense.dto';
import { UpdateExpenseDto } from './dto/updateExpense.dto';
import { User } from '../users/users.entity';
import { CategoryIAService } from './categoryIA.service';
import * as Papa from 'papaparse';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import { FeedbackDto } from './dto/feedback.dto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

const ML_SERVICE_BASE_URL = (
  process.env.ML_SERVICE_URL ?? 'http://localhost:5001'
).replace(/\/+$/, '');
const OCR_SERVICE_BASE_URL = (
  process.env.OCR_SERVICE_URL ?? 'http://localhost:5002'
).replace(/\/+$/, '');

@Injectable()
export class ExpensesService {
  [x: string]: any;
  private readonly logger = new Logger(ExpensesService.name);
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly categoryAIService: CategoryIAService,
    private readonly httpService: HttpService,
    private readonly alertsService: AlertsService,
  ) {}

  async findAllByUserId(userId: number): Promise<Expense[]> {
    return this.expensesRepository.find({
      where: { user: { id: userId } },
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  async findById(id: number, userId: number): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async createExpense(userId: number, dto: CreateExpenseDto): Promise<Expense> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const expense = this.expensesRepository.create({
      description: dto.description,
      amount: dto.amount,
      isRecurring: dto.isRecurring ?? false,
      isDeductible: dto.isDeductible ?? false,
      date: new Date(dto.date),
      user: { id: userId },
      category,
    });

    await this.alertsService.generateAlerts(userId);
    return this.expensesRepository.save(expense);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      expense.category = category;
    }

    if (dto.description !== undefined) expense.description = dto.description;

    if (dto.amount !== undefined) expense.amount = dto.amount;

    if (dto.isRecurring !== undefined) expense.isRecurring = dto.isRecurring;

    if (dto.isDeductible !== undefined) expense.isDeductible = dto.isDeductible;
    if (dto.date !== undefined) expense.date = new Date(dto.date);

    return this.expensesRepository.save(expense);
  }

  async delete(id: number, userId: number): Promise<void> {
    const expense = await this.expensesRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.expensesRepository.remove(expense);
  }

  async getMonthlyExpenses(userId: number, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const expenses = await this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('expense.date >= :startDate', { startDate })
      .andWhere('expense.date < :endDate', { endDate })
      .getMany();

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      total,
      count: expenses.length,
      avgPerDay: total / new Date(year, month, 0).getDate(),
    };
  }

  async getExpensesByMonth(userId: number) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return this.expensesRepository.find({
      where: {
        user: { id: userId },
        date: Between(firstDay, lastDay),
      },
    });
  }

  async getMonthlyExpenseSummary(
    userId: number,
    month: number, // 1-indexed (January = 1)
    year: number,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await this.expensesRepository.find({
      where: {
        user: { id: userId },
        date: Between(startDate, endDate),
      },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      total: totalSpent,
      budget: user.monthlyBudget ?? 0,
    };
  }

  async getExpensesForMonth(
    userId: number,
    month: number, // 1-indexed
    year: number,
  ): Promise<Expense[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.expensesRepository.find({
      where: {
        user: { id: userId },
        date: Between(startDate, endDate),
      },
      relations: ['category'], // Include category relation
      order: { date: 'DESC' },
    });
  }
  async getTotalsGroupedByMonth(userId: number) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.plan === 'free') {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        // Fazemos a query apenas para o mês atual
        const currentMonthData = await this.expensesRepository
          .createQueryBuilder('expense')
          .select('SUM(expense.amount)', 'total')
          .where('expense.userId = :userId', { userId })
          .andWhere("TO_CHAR(expense.date, 'YYYY-MM') = :currentMonth", {
            currentMonth,
          })
          .getRawOne();

        return [
          {
            month: currentMonth,
            total: Number(currentMonthData?.total) || 0,
            budget: user.monthlyBudget ?? 0,
            isLocked: true, // Flag para o frontend mostrar o "cadeado" nos outros meses
          },
        ];
      }

      // 1. Pega os últimos 6 meses a partir da data atual
      const lastSixMonths: string[] = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        lastSixMonths.push(`${year}-${month}`);
      }

      // 2. Busca gastos agrupados por mês no banco
      const expensesRaw = await this.expensesRepository
        .createQueryBuilder('expense')
        .select("TO_CHAR(expense.date, 'YYYY-MM')", 'month')
        .addSelect('SUM(expense.amount)', 'total')
        .where('expense.userId = :userId', { userId })
        .andWhere("TO_CHAR(expense.date, 'YYYY-MM') IN (:...months)", {
          months: lastSixMonths,
        })
        .groupBy('month')
        .getRawMany();

      // 3. Mapeia os resultados para busca rápida
      const expensesMap = new Map<string, number>();
      for (const e of expensesRaw) {
        expensesMap.set(e.month, Number(e.total));
      }

      // 4. Formata a saída garantindo que todos os 6 meses estão presentes
      const result = lastSixMonths.map((monthStr) => ({
        month: monthStr,
        total: expensesMap.get(monthStr) || 0,
        budget: user.monthlyBudget ?? 0,
      }));
      return result;
    } catch (error) {
      this.logger.error(
        `[getTotalsGroupedByMonth] Query failed or unexpected error: ${error.message || error}`,
        error.stack, // Log stack trace for detailed error info
      );
      throw error;
    }
  }
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  //LER EXTRATO:

  private async parseCSV(
    file: Express.Multer.File,
  ): Promise<{ description: string; amount: number; date: Date }[]> {
    const csvString = file.buffer.toString('utf-8');

    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
        complete: (results) => {
          try {
            const transactions = results.data
              .map((row: any) => {
                const desc =
                  row['descrição'] ||
                  row['description'] ||
                  row['memo'] ||
                  row['merchant_name'] ||
                  row['transaction_description'] ||
                  '';

                const amountStr =
                  row['valor'] ||
                  row['amount'] ||
                  row['total'] ||
                  row['transaction_amount'] ||
                  '';

                const dateStr =
                  row['data'] || row['date'] || row['transaction_date'] || '';

                if (!desc || !amountStr || !dateStr) return null;

                const amount = this.parseAmount(amountStr);
                const date = this.parseDate(dateStr);

                // Despesas devem ter valor positivo. Ignora rendimentos ou valores nulos.
                if (amount <= 0) return null;

                return { description: desc, amount, date };
              })
              .filter(
                (t): t is { description: string; amount: number; date: Date } =>
                  t !== null,
              );

            resolve(transactions);
          } catch (err) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(err);
          }
        },
        error: (err) => reject(err),
      });
    });
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    // Remove time portion if present (e.g. "2024-10-31 00:00:00" or ISO)
    const base = dateStr.trim().split(' ')[0].split('T')[0];

    // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const ymdMatch = base.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymdMatch) {
      const year = Number(ymdMatch[1]);
      const month = Number(ymdMatch[2]) - 1;
      const day = Number(ymdMatch[3]);
      if (
        !isNaN(day) &&
        !isNaN(month) &&
        !isNaN(year) &&
        month >= 0 &&
        month <= 11 &&
        day >= 1 &&
        day <= 31
      ) {
        return new Date(year, month, day);
      }
    }

    // D/M/YYYY, M/D/YYYY, D/M or M/D with separators / - .
    const dmyMatch = base.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?$/);
    if (dmyMatch) {
      const a = Number(dmyMatch[1]);
      const b = Number(dmyMatch[2]);
      let year = dmyMatch[3] ? Number(dmyMatch[3]) : new Date().getFullYear();

      if (!isNaN(year) && year < 100) {
        year = 2000 + year;
      }

      let day = a;
      let month = b - 1;

      if (a <= 12 && b <= 12) {
        // Ambiguo: padrao BR (DD/MM)
        day = a;
        month = b - 1;
      } else if (a <= 12 && b > 12) {
        // M/D
        day = b;
        month = a - 1;
      } else if (a > 12 && b <= 12) {
        // D/M
        day = a;
        month = b - 1;
      }

      if (
        !isNaN(day) &&
        !isNaN(month) &&
        !isNaN(year) &&
        month >= 0 &&
        month <= 11 &&
        day >= 1 &&
        day <= 31
      ) {
        return new Date(year, month, day);
      }
    }

    return new Date(); // fallback para data atual
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;

    // Trata o formato de moeda BRL (ex: "R$ 1.234,56")
    // 1. Remove o "R$" e espaços
    // 2. Remove os pontos de milhar
    // 3. Troca a vírgula do decimal por ponto
    let cleanStr = amountStr.replace(/R\$\s?/, '').trim();
    const hasComma = cleanStr.includes(',');
    const hasDot = cleanStr.includes('.');

    if (hasComma && hasDot) {
      // Caso: 1.234,56 -> Remove o ponto (milhar) e troca a vírgula por ponto (decimal)
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      // Caso: 234,61 -> Troca a vírgula por ponto
      cleanStr = cleanStr.replace(',', '.');
    } else if (hasDot) {
      // Caso: 234.61 (já está no formato correto para o parseFloat)
      // Não faz nada ou remove milhar se tiver certeza que o ponto é milhar
      // Mas geralmente se só tem ponto, ele é o decimal.
    }

    // 3. Remove qualquer caractere que não seja número, ponto ou sinal de menos
    cleanStr = cleanStr.replace(/[^\d.-]/g, '');

    const numericValue = parseFloat(cleanStr);

    if (isNaN(numericValue)) return 0;

    // Garante valor absoluto positivo
    return Math.abs(numericValue);
  }

  private parsePDFText(text: string) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);

    const transactions: {
      date: Date;
      description: string;
      amount: number;
    }[] = [];
    let currentTransaction: {
      date: Date;
      description: string;
      amount: number;
    } | null = null;

    // Regex to identify the start of a transaction line.
    // It looks for a date (DD/MM), a description, and an amount.
    const transactionStartRegex =
      /^(?<date>\d{1,2}\/\d{1,2})\s+(?<desc>.+?)\s+(?<amount>[\d.,]+[CD]?)$/;

    for (const line of lines) {
      const match = line.match(transactionStartRegex);

      if (match && match.groups) {
        // This is a new transaction line.
        // First, save the previous transaction if it exists.
        if (currentTransaction) {
          transactions.push(currentTransaction);
        }

        const { date, desc, amount } = match.groups;

        // Start a new transaction object.
        currentTransaction = {
          date: this.parseDate(date),
          description: desc.trim(),
          amount: this.parseAmount(amount),
        };
      } else if (currentTransaction) {
        // This is a continuation line, append it to the current description.
        currentTransaction.description += ` ${line}`;
      }
    }

    // Add the last processed transaction
    if (currentTransaction) {
      transactions.push(currentTransaction);
    }

    // Per user request, filter to only return expenses (negative amounts).
    return transactions.filter((t) => t.amount < 0);
  }

  private async parsePDF(
    file: Express.Multer.File,
  ): Promise<{ description: string; amount: number; date?: Date }[]> {
    try {
      // First, try to parse it as a digital PDF (text-based).
      const data = await pdf(file.buffer);
      if (data && data.text && data.text.trim().length > 0) {
        return this.parsePDFText(data.text);
      }
    } catch (error) {
      console.warn('pdf-parse failed, falling back to OCR service.', error);
    }

    // If pdf-parse fails or yields no text, it's likely a scanned PDF.
    // Fallback to the OCR service.
    console.log('Falling back to OCR service for PDF processing.');
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const ocrResponse = await firstValueFrom(
        this.httpService.post(
          `${OCR_SERVICE_BASE_URL}/extract_text`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
          },
        ),
      );

      const ocrText = ocrResponse.data.text;
      if (!ocrText || ocrText.trim().length === 0) {
        throw new Error('OCR service returned no text.');
      }

      return this.parsePDFText(ocrText);
    } catch (err) {
      console.error('Error calling OCR service:', err.message);
      throw new Error(
        'Failed to process PDF with both standard and OCR methods.',
      );
    }
  }

  async processAndCreateExpenses(userId: number, file: Express.Multer.File) {
    if (!file?.originalname) throw new Error('Arquivo não enviado ou inválido');
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';

    type ExpenseParsed = { description: string; amount: number; date?: Date };
    let expensesData: ExpenseParsed[] = [];

    if (ext === 'csv') expensesData = await this.parseCSV(file);
    else if (ext === 'pdf') expensesData = await this.parsePDF(file);
    else throw new Error('Tipo de arquivo não suportado');

    expensesData = expensesData.map((e) => ({
      ...e,
      date: e.date ?? new Date(),
    }));

    const createdExpenses: Expense[] = [];

    for (const e of expensesData) {
      const normalizedDesc = this.normalizeText(e.description);
      let category: Category;

      try {
        // 1. Tenta classificar com o serviço de IA
        let foundCategory = await this.categoryAIService.classify(
          userId,
          normalizedDesc,
        );

        // 2. Se a classificação falhar, usa o método de predição (mais avançado)
        if (!foundCategory) {
          const categoryName = await this.categoryAIService.predictCategory(
            userId,
            normalizedDesc,
          );
          foundCategory = await this.categoryRepository.findOne({
            where: { name: categoryName, user: { id: userId } },
          });

          if (!foundCategory) {
            foundCategory = this.categoryRepository.create({
              name: categoryName,
              user: { id: userId },
            });
            await this.categoryRepository.save(foundCategory);
          }
        }
        category = foundCategory;
      } catch (err: unknown) {
        // 3. Em caso de erro em qualquer serviço de IA, usa 'Outros'
        console.error(
          `[AI Fallback] Error classifying/predicting category for "${normalizedDesc}". Defaulting to "Outros".`,
          err instanceof Error ? err.message : err,
        );

        let fallbackCategory = await this.categoryRepository.findOne({
          where: { name: 'Outros', user: { id: userId } },
        });
        if (!fallbackCategory) {
          fallbackCategory = this.categoryRepository.create({
            name: 'Outros',
            user: { id: userId },
          });
          await this.categoryRepository.save(fallbackCategory);
        }
        category = fallbackCategory;
      }

      const expense = this.expensesRepository.create({
        description: e.description,
        amount: e.amount,
        date: e.date!,
        user: { id: userId },
        category,
      });

      createdExpenses.push(await this.expensesRepository.save(expense));
    }

    return createdExpenses;
  }

  async addFeedback(
    expenseId: number,
    feedbackDto: FeedbackDto,
    userId: number,
  ): Promise<void> {
    this.logger.log(
      `Received feedback for expense ${expenseId} from user ${userId}`,
    );

    const expense = await this.expensesRepository.findOne({
      where: { id: expenseId, user: { id: userId } },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const category = await this.categoryRepository.findOne({
      where: { id: feedbackDto.categoryId, user: { id: userId } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    try {
      await firstValueFrom(
        this.httpService.post(`${ML_SERVICE_BASE_URL}/feedback`, {
          text: expense.description,
          label: category.name,
        }),
      );
      this.logger.log(`Feedback for expense ${expenseId} sent to ML service.`);
    } catch (error) {
      this.logger.error(
        `Failed to send feedback for expense ${expenseId} to ML service.`,
        error,
      );
      // Optionally re-throw or handle the error as needed
      throw error;
    }
  }
}
