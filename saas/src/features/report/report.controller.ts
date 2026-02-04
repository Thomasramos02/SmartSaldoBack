import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Res,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportService } from './report.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Rota para visualizar os dados do relatório em formato JSON
   */
  @Get('generate')
  async generateReport(
    @Request() req,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const { user } = req;

    // Verificação de permissão
    if (user.plan?.toLowerCase().trim() !== 'premium') {
      throw new ForbiddenException(
        'Apenas usuários premium podem acessar os dados do relatório.',
      );
    }

    const { monthNum, yearNum } = this.validateDate(month, year);

    try {
      return await this.reportService.generateReportData(
        user.id,
        monthNum,
        yearNum,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('download')
  async downloadReport(
    @Request() req,
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const { user } = req;
    if (user.plan?.toLowerCase().trim() !== 'premium') {
      throw new ForbiddenException(
        'Apenas usuários premium podem fazer download de relatórios em PDF',
      );
    }

    const { monthNum, yearNum } = this.validateDate(month, year);

    try {
      // 1. Busca os dados
      const reportData = await this.reportService.generateReportData(
        user.id,
        monthNum,
        yearNum,
      );

      // 2. Gera o buffer com Puppeteer
      const pdfBuffer = await this.reportService.generatePDF(reportData);

      const monthNames = [
        'janeiro',
        'fevereiro',
        'marco',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro',
      ];
      const fileName = `relatorio_gastos_${monthNames[monthNum]}_${yearNum}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      // Envia o binário
      return res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        message: `Erro ao gerar PDF: ${error.message}`,
      });
    }
  }

  private validateDate(month: string, year: string) {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(monthNum) || isNaN(yearNum)) {
      throw new BadRequestException('Mês e ano devem ser números válidos');
    }

    if (monthNum < 0 || monthNum > 11) {
      throw new BadRequestException(
        'O mês deve estar entre 0 (Janeiro) e 11 (Dezembro)',
      );
    }

    return { monthNum, yearNum };
  }
}
