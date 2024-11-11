import { Injectable } from '@nestjs/common';
import { CategoryDB } from '../database/CategoryDB';
import { GetCategoryDTO } from '../category/DTO/GetCategoryDTO';
import { GenderDB } from '../database/GenderDB';
import { GetGenderDTO } from '../gender/DTO/GetGenderDTO';
import { EventDB } from '../database/EventDB';
import { GetEventCardDTO } from '../event/DTO/GetEventCardDTO';

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

   transformCategoryDBtoGetCategoryDTO(
    category: CategoryDB,
  ): GetCategoryDTO{
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

  async transformEventDBtoGetEventCardDTO(
    event: EventDB,
  ): Promise<GetEventCardDTO> {
    const dto = new GetEventCardDTO();
    dto.id = event.id;
    const categories = await event.categories;
    dto.categories = categories.map(this.transformCategoryDBtoGetCategoryDTO);
    dto.dateAndTime = event.dateAndTime;
    dto.title = event.title;
    dto.picture = event.picture;
    dto.status = event.status;
    dto.type = event.type;
    dto.isOnline = event.isOnline;
    dto.city = event.city;
    const participants = await event.participants;
    dto.participantsNumber = participants.length;
    dto.maxParticipantsNumber = event.participantsNumber;

    return dto;
  }
}
