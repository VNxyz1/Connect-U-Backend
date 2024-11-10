import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GenderDB } from '../database/GenderDB';
import { CategoryDB } from '../database/CategoryDB';

@Injectable()
export class GenderService implements OnModuleInit {
  private readonly predefinedGenders = [
    { gender: 1 },
    { gender: 2 },
    { gender: 3 },
  ];

  constructor(
    @InjectRepository(GenderDB)
    private readonly genderRepository: Repository<GenderDB>,
  ) {}

  async onModuleInit() {
    await this.initializeGenders();
  }

  private async initializeGenders() {
    for (const gender of this.predefinedGenders) {
      const existingGender = await this.genderRepository.findOne({
        where: { gender: gender.gender },
      });
      if (!existingGender) {
        await this.genderRepository.save(gender);
      }
    }
  }

  /**
   * Gets all existing genders.
   *
   * @returns {Promise<GenderDB[]>} - The existing genders.
   * @throws {NotFoundException} - Throws an exception if no genders are found.
   */
  async getGenders(): Promise<GenderDB[]> {
    const genders = await this.genderRepository.find();
    if (genders.length === 0) {
      throw new NotFoundException('No genders found');
    }
    return genders;
  }

  /**
   * Finds genders by their ids.
   *
   * @param {number[]} ids - The ids to search for.
   * @returns {Promise<GenderDB[]>} - The genders with the fitting ids.
   * @throws {NotFoundException} - Throws an exception if no genders are found for the given ids.
   */
  async getGendersByIds(ids: number[]): Promise<GenderDB[]> {
    const genders = await this.genderRepository.findBy({ id: In(ids) });
    if (genders.length === 0) {
      throw new NotFoundException('No genders found with the given ids');
    }
    return genders;
  }
}
