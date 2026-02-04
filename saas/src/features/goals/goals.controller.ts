import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { PassportJwtGuard } from '../auth/guards/passport-jwt.guard';

@UseGuards(PassportJwtGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Req() req, @Body() createGoalDto: CreateGoalDto) {
    const userId = req.user.id as number;
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
  findAll(@Req() req) {
    const userId = req.user.id as number;
    return this.goalsService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.id as number;
    return this.goalsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    const userId = req.user.id as number;
    return this.goalsService.update(id, userId, updateGoalDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.id as number;
    return this.goalsService.remove(id, userId);
  }
}
