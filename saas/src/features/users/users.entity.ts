import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Expense } from '../expenses/expenses.entity';
import { Category } from '../category/category.entity';
import { Alert } from '../alert/alerts.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'decimal', default: 0, nullable: true })
  monthlyBudget: number;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ default: 'free' })
  plan: string;

  @Column({ type: 'text', nullable: true })
  resetPasswordTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpiresAt: Date | null;

  @OneToMany(() => Expense, (expense) => expense.user, { cascade: ['remove'] })
  expenses: Expense[];

  @OneToMany(() => Category, (category) => category.user, {
    cascade: ['remove'],
  })
  categories: Category[];

  @OneToMany(() => Alert, (alert) => alert.user, { cascade: ['remove'] })
  alerts: Alert[];
}
