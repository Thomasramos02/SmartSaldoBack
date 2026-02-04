import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './goals.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
  ) {}

  async create(userId: number, createGoalDto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalRepository.create({
      ...createGoalDto,
      user: { id: userId },
    });
    return this.goalRepository.save(goal);
  }

  async findAllByUser(userId: number): Promise<Goal[]> {
    return this.goalRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  async update(
    id: number,
    userId: number,
    updateGoalDto: UpdateGoalDto,
  ): Promise<Goal> {
    const goal = await this.findOne(id, userId);

    const updatedGoal = Object.assign(goal, updateGoalDto);

    return this.goalRepository.save(updatedGoal);
  }

  async remove(id: number, userId: number): Promise<void> {
    const goal = await this.findOne(id, userId);
    await this.goalRepository.remove(goal);
  }
}
