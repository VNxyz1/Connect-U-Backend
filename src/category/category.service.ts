import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CategoryDB } from '../database/CategoryDB';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';

@Injectable()
export class CategoryService implements OnModuleInit {
  private readonly predefinedCategories = [
    { name: 'Outdoor', germanName: 'Outdoor' },
    { name: 'Indoor', germanName: 'Indoor' },
    { name: 'Music', germanName: 'Musik' },
    { name: 'Sports', germanName: 'Sport' },
    { name: 'Gaming', germanName: 'Gaming' },
    { name: 'Eating', germanName: 'Essen' },
    { name: 'Learning', germanName: 'Lernen' },
    { name: 'Cooking', germanName: 'Kochen' },
    { name: 'Movies', germanName: 'Filme' },
    { name: 'Adventure', germanName: 'Abenteuer' },
    { name: 'Party', germanName: 'Party' },
    { name: 'Other', germanName: 'Andere' },
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
