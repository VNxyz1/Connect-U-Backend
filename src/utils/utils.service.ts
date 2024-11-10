import { Injectable } from '@nestjs/common';
import { CategoryDB } from '../database/CategoryDB';
import { GetCategoryDTO } from '../category/DTO/GetCategoryDTO';
import { GenderDB } from '../database/GenderDB';
import { GetGenderDTO } from '../gender/DTO/GetGenderDTO';

@Injectable()
export class UtilsService {
  validateUserAge(birthday: Date, minAge: number): boolean {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDifference = today.getMonth() - birthday.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }
    return age >= minAge;
  }

  async transformCategoryDBtoGetCategoryDTO(
    category: CategoryDB,
  ): Promise<GetCategoryDTO> {
    const dto = new GetCategoryDTO();
    dto.id = category.id;
    dto.name = category.name;
    return dto;
  }

  async transformGenderDBtoGetGenderDTO(
    gender: GenderDB,
  ): Promise<GetGenderDTO> {
    const dto = new GetGenderDTO();
    dto.id = gender.id;
    dto.gender = gender.gender;
    return dto;
  }
}
