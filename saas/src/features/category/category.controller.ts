import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CategoryService } from './category.services';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UpdateCategoryDto } from './dto/updateCategory.dto';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateCategoryDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.service.findAllByUser(req.user.id);
  }

  @Get(':id')
  findById(@Param('id') id: number, @Req() req) {
    return this.service.findById(id, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Req() req, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: number, @Req() req) {
    return this.service.delete(id, req.user.id);
  }
}
