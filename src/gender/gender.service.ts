import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GenderDB } from '../database/GenderDB';

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

  async getGendersByIds(ids: number[]): Promise<GenderDB[]> {
    return await this.genderRepository.findBy({ id: In(ids) })
  }
}
