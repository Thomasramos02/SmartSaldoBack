import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Expense } from '../expenses/expenses.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  userId: number;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  color?: string;

  /**
   * Quantidade de despesas da categoria
   * Campo derivado → pode ser nulo no banco
   */
  @Column({ type: 'int', nullable: true, default: 0 })
  count?: number;

  /**
   * Valor total gasto na categoria
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0,
    transformer: {
      from: (value: string | null) => (value ? parseFloat(value) : 0),
      to: (value: number) => value,
    },
  })
  total?: number;

  /**
   * Percentual da categoria em relação ao total
   */
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 0,
    transformer: {
      from: (value: string | null) => (value ? parseFloat(value) : 0),
      to: (value: number) => value,
    },
  })
  percentage?: number;

  //Limite de orcamento de uma categoria
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0,
    transformer: {
      from: (value: string | null) => (value ? parseFloat(value) : 0),
      to: (value: number) => value,
    },
  })
  limit?: number;

  /* ================= RELAÇÕES ================= */

  @ManyToOne(() => User, (user) => user.categories, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];
}
