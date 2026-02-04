import {
  Controller,
  Get,
  Put,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AlertsService } from './alert.service';
import { PassportJwtGuard } from '../auth/guards/passport-jwt.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    id: number;
  };
}

@Controller('alerts')
@UseGuards(PassportJwtGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getAlerts(@Req() req: AuthRequest) {
    return await this.alertsService.getAlerts(req.user.id);
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    return await this.alertsService.markAsRead(id, req.user.id);
  }
}
