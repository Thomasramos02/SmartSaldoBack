import { IsInt } from 'class-validator';

export class FeedbackDto {
  @IsInt()
  categoryId: number;
}
