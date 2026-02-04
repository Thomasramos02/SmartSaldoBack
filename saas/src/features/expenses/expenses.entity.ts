import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Category } from '../category/category.entity';
import { User } from '../users/users.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      from: (value: string) => parseFloat(value),
      to: (value: number) => value,
    },
  })
  amount: number;

  /**
   * Data do gasto
   * - nullable true para não quebrar dados antigos
   * - default para novos registros
   */
  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ default: false })
  isDeductible: boolean;

  @CreateDateColumn()
  createdAt: Date;

  /* ================= RELAÇÕES ================= */

  @ManyToOne(() => User, (user) => user.expenses, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Category, (category) => category.expenses, {
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
