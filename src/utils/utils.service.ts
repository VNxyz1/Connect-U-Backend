import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoryDB } from '../database/CategoryDB';
import { GetCategoryDTO } from '../category/DTO/GetCategoryDTO';
import { GenderDB } from '../database/GenderDB';
import { GetGenderDTO } from '../gender/DTO/GetGenderDTO';
import { EventDB } from '../database/EventDB';
import { GetEventCardDTO } from '../event/DTO/GetEventCardDTO';
import { GetEventDetailsDTO } from '../event/DTO/GetEventDetailsDTO';
import { UserDB } from '../database/UserDB';

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

  validateUserAgeMax(birthday: Date, maxAge: number): boolean {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDifference = today.getMonth() - birthday.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }
    return age <= maxAge;
  }

  isFutureDate(dateISOString: string): boolean {
    const eventDate = new Date(dateISOString);
    const now = new Date();
    return eventDate > now;
  }

  /**
   * Checks if a user is allowed to join an event.
   * @param user - The user attempting to join the event.
   * @param event - The event the user wants to join.
   * @returns {boolean} - True if the user meets the age and gender requirements, otherwise false.
   */
  async isUserAllowedToJoinEvent(
    user: UserDB,
    event: EventDB,
  ): Promise<boolean> {
    if (event.startAge || event.endAge) {
      const birthday = new Date(user.birthday);
      const isAgeValid =
        this.validateUserAge(birthday, event.startAge) &&
        this.validateUserAgeMax(birthday, event.endAge);
      if (!isAgeValid) {
        throw new BadRequestException(
          'You do not meet the age requirements for this event.',
        );
      }
    }
    if (event.preferredGenders && event.preferredGenders.length > 0) {
      const isGenderValid = event.preferredGenders.some(
        (gender: GenderDB) => gender.gender === user.gender,
      );
      if (!isGenderValid) {
        throw new BadRequestException(
          'Your gender does not match the preferred genders for this event.',
        );
      }
    }

    return true;
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
