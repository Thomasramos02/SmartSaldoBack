import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UpdateCategoryDto } from './dto/updateCategory.dto';
import { User } from '../users/users.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userId: number, dto: CreateCategoryDto): Promise<Category> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.plan === 'free') {
      const count = await this.categoryRepository.count({
        where: { user: { id: userId } },
      });

      if (count >= 5) {
        throw new ConflictException(
          'Limite atingido: O plano Free permite apenas 5 categorias. Exclua uma para criar outra.',
        );
      }
    }

    const exists = await this.categoryRepository.findOne({
      where: {
        name: dto.name,
        user: { id: userId },
      },
    });

    if (exists) {
      throw new ConflictException(
        'Você já possui uma categoria com este nome.',
      );
    }
    const category = this.categoryRepository.create({
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      limit: dto.limit,
      user: { id: userId },
    });

    return this.categoryRepository.save(category);
  }

  async findAllByUser(userId: number): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .select('category.*')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect('COUNT(expense.id)', 'count')
      .leftJoin('category.expenses', 'expense')
      .where('category.userId = :userId', { userId })
      .groupBy('category.id')
      .getRawMany();
  }

  async findById(id: number, userId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findById(id, userId);

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async delete(id: number, userId: number): Promise<void> {
    const category = await this.findById(id, userId);
    await this.categoryRepository.remove(category);
  }

  async calcularTotalDeUmaCategoria(
    categoryId: number,
    userId: number,
  ): Promise<number> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, userId },
      relations: ['expenses'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const total = category.expenses.reduce((sum, e) => sum + e.amount, 0);

    return total;
  }

  async atualizarTotal(categoryId: number, userId: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, userId },
      relations: ['expenses'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const total = category.expenses.reduce((sum, e) => sum + e.amount, 0);

    await this.categoryRepository.update({ id: categoryId }, { total });
  }
}
