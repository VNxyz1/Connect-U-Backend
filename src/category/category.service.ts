import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
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

  /**
   * Gets all existing categories.
   *
   * @returns {Promise<CategoryDB[]>} - The existing categories.
   * @throws {NotFoundException} - Throws an exception if no categories are found.
   */
  async getCategories(): Promise<CategoryDB[]> {
    const categories = await this.categoryRepository.find();
    if (categories.length === 0) {
      throw new NotFoundException('No categories found');
    }
    return categories;
  }

  /**
   * Finds categories by their ids.
   *
   * @param {number[]} ids - The ids to search for.
   * @returns {Promise<CategoryDB[]>} - The categories with the fitting ids.
   * @throws {NotFoundException} - Throws an exception if no categories are found for the given ids.
   */
  async getCategoriesByIds(ids: number[]): Promise<CategoryDB[]> {
    const categories = await this.categoryRepository.findBy({ id: In(ids) });
    if (categories.length === 0) {
      throw new NotFoundException('No categories found with the given ids');
    }
    return categories;
  }
}
