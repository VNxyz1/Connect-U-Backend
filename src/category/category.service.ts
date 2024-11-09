import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CategoryDB } from '../database/CategoryDB';

@Injectable()
export class CategoryService implements OnModuleInit {
  private readonly predefinedCategories = [
    { name: 'outdoor' },
    { name: 'indoor' },
    { name: 'music' },
    { name: 'sports' },
    { name: 'gaming' },
    { name: 'eating' },
    { name: 'learning' },
    { name: 'cooking' },
    { name: 'movies' },
    { name: 'adventure' },
    { name: 'party' },
    { name: 'other' },
  ];

  constructor(
    @InjectRepository(CategoryDB)
    private categoryRepository: Repository<CategoryDB>,
  ) {}

  async onModuleInit() {
    await this.initializeCategories();
  }

  private async initializeCategories() {
    for (const category of this.predefinedCategories) {
      const existingCategory = await this.categoryRepository.findOneBy({
        name: category.name,
      });
      if (!existingCategory) {
        await this.categoryRepository.save(category);
      }
    }
  }

  async getCategories(): Promise<CategoryDB[]> {
    return await this.categoryRepository.find();
  }

  async getCategoriesByIds(ids: number[]): Promise<CategoryDB[]> {
    return await this.categoryRepository.findBy({ id: In(ids) })
  }
}
