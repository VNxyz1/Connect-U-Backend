import { Injectable } from '@nestjs/common';
import { CategoryDB } from '../database/CategoryDB';
import { GetCategoryDTO } from '../category/DTO/GetCategoryDTO';
import { GenderDB } from '../database/GenderDB';
import { GetGenderDTO } from '../gender/DTO/GetGenderDTO';
import { EventDB } from '../database/EventDB';
import { GetEventCardDTO } from '../event/DTO/GetEventCardDTO';
import { GetEventDetailsDTO } from '../event/DTO/GetEventDetailsDTO';

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

  isFutureDate(dateISOString: string): boolean {
    const eventDate = new Date(dateISOString);
    const now = new Date();
    return eventDate > now;
  }

  transformCategoryDBtoGetCategoryDTO(category: CategoryDB): GetCategoryDTO {
    const dto = new GetCategoryDTO();
    dto.id = category.id;
    dto.name = category.name;
    return dto;
  }

  transformGenderDBtoGetGenderDTO(gender: GenderDB): GetGenderDTO {
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
    const categories = event.categories;
    dto.categories = categories.map(this.transformCategoryDBtoGetCategoryDTO);
    dto.dateAndTime = event.dateAndTime;
    dto.title = event.title;
    dto.picture = event.picture;
    dto.status = event.status;
    dto.type = event.type;
    dto.isOnline = event.isOnline;
    dto.city = event.city;
    const participants = event.participants;
    dto.participantsNumber = participants.length;
    dto.maxParticipantsNumber = event.participantsNumber;

    return dto;
  }

  async transformEventDBtoGetEventDetailsDTO(
    event: EventDB,
  ): Promise<GetEventDetailsDTO> {
    const dto = new GetEventDetailsDTO();
    dto.id = event.id;
    dto.dateAndTime = event.dateAndTime;
    dto.title = event.title;
    dto.description = event.description;
    dto.picture = event.picture;
    dto.status = event.status;
    dto.type = event.type;
    dto.isOnline = event.isOnline;
    if (event.showAddress) {
      dto.streetNumber = event.streetNumber || null;
      dto.street = event.street || null;
    }
    dto.zipCode = event.zipCode || null;
    dto.city = event.city || null;
    const categories = event.categories;
    dto.categories = categories.map(this.transformCategoryDBtoGetCategoryDTO);
    const participants = event.participants;
    dto.participantsNumber = participants.length;
    dto.maxParticipantsNumber = event.participantsNumber;
    dto.startAge = event.startAge || null;
    dto.endAge = event.endAge || null;
    const preferredGenders = event.preferredGenders;
    dto.preferredGenders = preferredGenders.map(
      this.transformGenderDBtoGetGenderDTO,
    );

    return dto;
  }
}
