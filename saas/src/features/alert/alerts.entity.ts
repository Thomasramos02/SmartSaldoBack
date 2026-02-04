import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { User } from '../users/users.entity';

export enum AlertType {
  GOAL_EXCEED = 'GOAL_EXCEED',
  PATTERN_DECTECTED = 'PATTERN_DETECTED',
  EXCESSED_SPENDING = 'excessed_spending',
  CATEGORY_EXCEEDED = 'category_exceeded',
  IA_GENERATED = 'ia_generated',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  user: User;
}
