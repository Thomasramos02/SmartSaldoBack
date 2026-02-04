import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ExpensesService } from './expenses.services';
import { CreateExpenseDto } from './dto/createExpense.dto';
import { UpdateExpenseDto } from './dto/updateExpense.dto';
import { PassportJwtGuard } from '../auth/guards/passport-jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { FeedbackDto } from './dto/feedback.dto';

@Controller('expenses')
@UseGuards(PassportJwtGuard)
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Post()
  create(@Req() req: Request & { user: any }, @Body() dto: CreateExpenseDto) {
    return this.service.createExpense(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: Request & { user: any }) {
    return this.service.findAllByUserId(req.user.id);
  }

  @Get('summary/month')
  getMonthlySummary(
    @Req() req: Request & { user: any },
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.service.getMonthlyExpenses(
      req.user.id,
      Number(month),
      Number(year),
    );
  }

  @Get('summary/:year/:month')
  async getMonthlySummaryWithBudget(
    @Req() req: Request & { user: any },
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.service.getMonthlyExpenseSummary(req.user.id, month, year);
  }

  @Get('by-month/:year/:month')
  async getExpensesForMonth(
    @Req() req: Request & { user: any },
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.service.getExpensesForMonth(req.user.id, month, year);
  }
  @Get('total')
  getTotalsGroupedByMonth(@Req() req: Request & { user?: any }) {
    const userId = Number(req.user?.id);
    if (!userId) {
      const lastSixMonths: string[] = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        lastSixMonths.push(`${year}-${month}`);
      }
      return lastSixMonths.map((monthStr) => ({
        month: monthStr,
        total: 0,
        budget: 0,
      }));
    }

    return this.service.getTotalsGroupedByMonth(userId);
  }

  @Get(':id')
  findById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: any },
  ) {
    return this.service.findById(id, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: any },
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: any },
  ) {
    return this.service.delete(id, req.user.id);
  }

  @Get('current-month')
  getExpensesByMonth(@Req() req: Request & { user: any }) {
    return this.service.getExpensesByMonth(req.user.id);
  }

  // UPLOAD DO EXTRATO
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: any },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não encontrado');
    }

    return this.service.processAndCreateExpenses(userId, file);
  }

  @Post(':id/feedback')
  addFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FeedbackDto,
    @Req() req: Request & { user: any },
  ) {
    return this.service.addFeedback(id, dto, req.user.id);
  }
}
