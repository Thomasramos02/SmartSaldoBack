import { Category } from '../category/category.entity';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './users.entity';
import { UserProfileDto } from './dto/user-profile.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import { Expense } from '../expenses/expenses.entity';
import { Goal } from '../goals/goals.entity';

const DEFAULT_CATEGORY_DATA = [
  { name: 'Alimentacao', icon: '🍔', color: '#f59e0b' }, // Amber
  { name: 'Transporte', icon: '🚗', color: '#3b82f6' }, // Blue
  { name: 'Moradia', icon: '🏠', color: '#10b981' }, // Emerald
  { name: 'Mercado', icon: '🛒', color: '#8b5cf6' }, // Purple
  { name: 'Outros', icon: '💡', color: '#64748b' }, // Slate
];
export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
  ) {}

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
  async findById(id: number): Promise<UserProfileDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const expenses = await this.expenseRepository.find({
      where: {
        user: { id },
        date: Between(firstDay, lastDay),
      },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const budgetUsagePercentage =
      user.monthlyBudget > 0
        ? Math.round((totalSpent / user.monthlyBudget) * 100)
        : 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      monthlyBudget: user.monthlyBudget,
      totalSpent,
      budgetUsagePercentage,
      plan: user.plan,
    };
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByStripeCustomerId(customerId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { stripeCustomerId: customerId },
    });
    if (!user) {
      throw new NotFoundException('User not found for Stripe customer');
    }
    return user;
  }

  async setPremiumByCustomerId(customerId: string): Promise<void> {
    const user = await this.findByStripeCustomerId(customerId);

    if (user.plan !== 'premium') {
      await this.usersRepository.update(user.id, { plan: 'premium' });
    }
  }

  async setFreeByCustomerId(customerId: string): Promise<void> {
    const user = await this.findByStripeCustomerId(customerId);

    if (user.plan !== 'free') {
      await this.usersRepository.update(user.id, { plan: 'free' });
    }
  }

  async saveStripeCustomerId(
    userId: number,
    customerId: string,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      stripeCustomerId: customerId,
    });
  }

  async setPasswordResetToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: expiresAt,
    });
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    await this.usersRepository.update(userId, {
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
    });
  }

  async findByResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { resetPasswordTokenHash: tokenHash },
    });
  }

  async create(name: string, email: string, password: string, plan = 'free') {
    const userExists = await this.findUserByEmail(email);
    if (userExists) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
      plan,
    });
    await this.usersRepository.save(newUser);
    const categoriesToCreateData =
      plan === 'free'
        ? DEFAULT_CATEGORY_DATA.slice(0, 5)
        : DEFAULT_CATEGORY_DATA;

    await this.categoryRepository.save(
      categoriesToCreateData.map((categoryData) =>
        this.categoryRepository.create({
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          userId: newUser.id,
        }),
      ),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = newUser;
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const userExists = await this.findUserByEmail(updateUserDto.email);
      if (userExists) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateUserDto);

    const updatedUser = await this.findOne(id);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete all dependent records in the correct order to avoid constraint violations
    await this.goalsRepository.delete({ userId: id });
    // Delete expenses first (they may be related to categories and alerts)
    await this.expenseRepository.delete({ user: { id } });

    // Delete categories
    await this.categoryRepository.delete({ user: { id } });

    // Delete alerts
    // await this.alertsRepository.delete({ user: { id } });

    // Finally, delete the user
    await this.usersRepository.delete(id);
  }

  async changePassword(id: number, dto: ChangeUserPasswordDto): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.usersRepository.update(id, { password: hashedPassword });
  }

  async setPasswordHash(id: number, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { password: passwordHash });
  }
}
