import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoryDB } from '../database/CategoryDB';
import { GetCategoryDTO } from '../category/DTO/GetCategoryDTO';
import { GenderDB } from '../database/GenderDB';
import { GetGenderDTO } from '../gender/DTO/GetGenderDTO';
import { EventDB } from '../database/EventDB';
import { GetEventCardDTO } from '../event/DTO/GetEventCardDTO';
import { GetEventDetailsDTO } from '../event/DTO/GetEventDetailsDTO';
import { UserDB } from '../database/UserDB';
import { GetUserProfileDTO } from '../user/DTO/GetUserProfileDTO';
import { GetUserDataDTO } from '../user/DTO/GetUserDataDTO';
import { GetEventJoinDTO } from '../event/DTO/GetEventJoinDTO';
import { RequestDB } from '../database/RequestDB';
import { GetEventJoinRequestDTO } from '../request/DTO/GetEventJoinRequestDTO';
import { GetUserJoinRequestDTO } from '../request/DTO/GetUserJoinRequestDTO';

@Injectable()
export class UtilsService {
  /**
   * Calculates the age of a user based on their date of birth.
   * @param birthday - The user's date of birth.
   * @returns {number} - The calculated age.
   */
  calculateAge(birthday: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDifference = today.getMonth() - birthday.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }
    return age;
  }

  /**
   * Validates if a user meets the minimum age requirement.
   * @param birthday - The user's date of birth.
   * @param minAge - The minimum required age.
   * @returns {boolean} - True if the user's age is greater than or equal to the minimum age, otherwise false.
   */
  validateUserAge(birthday: Date, minAge: number): boolean {
    const age = this.calculateAge(birthday);
    return age >= minAge;
  }

  /**
   * Validates if a user meets the maximum age requirement.
   * @param birthday - The user's date of birth.
   * @param maxAge - The maximum allowed age.
   * @returns {boolean} - True if the user's age is less than or equal to the maximum age, otherwise false.
   */
  validateUserAgeMax(birthday: Date, maxAge: number): boolean {
    const age = this.calculateAge(birthday);
    return age <= maxAge;
  }

  /**
   * Determines if a given date is in the future.
   * @param dateISOString - The date to check, in ISO string format.
   * @returns {boolean} - True if the date is in the future, otherwise false.
   */
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

    const dateValid = this.isFutureDate(event.dateAndTime);

    if (!dateValid) {
      throw new BadRequestException('The Event is outdated.');
    }

    return true;
  }

  /**
   * Transforms a UserDB object into a GetUserProfileDTO.
   * @param user - The user entity from the database.
   * @param isUser - boolean if logged in user is user whos visiting the profile
   * @returns {GetUserProfileDTO} - The transformed user profile data transfer object.
   */
  transformUserDBtoGetUserProfileDTO(
    user: UserDB,
    isUser: boolean,
  ): GetUserProfileDTO {
    const dto = new GetUserProfileDTO();
    dto.id = user.id;
    dto.isUser = isUser;
    dto.pronouns = user.pronouns;
    dto.profilePicture = user.profilePicture;
    dto.profileText = user.profileText;
    dto.firstName = user.firstName;
    dto.username = user.username;
    dto.city = user.city;
    const birthday = new Date(user.birthday);
    dto.age = this.calculateAge(birthday);
    return dto;
  }

  /**
   * Transforms a UserDB object into a GetUserDataDTO.
   * @param user - The user entity from the database.
   * @returns {GetUserDataDTO} - The transformed user data transfer object.
   */
  transformUserDBtoGetUserDataDTO(user: UserDB): GetUserDataDTO {
    const dto = new GetUserDataDTO();
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.username = user.username;
    dto.email = user.email;
    dto.city = user.city;
    dto.streetNumber = user.streetNumber || null;
    dto.birthday = user.birthday;
    dto.gender = user.gender;
    dto.street = user.street || null;
    dto.zipCode = user.zipCode || null;
    return dto;
  }

  /**
   * Transforms a CategoryDB object into a GetCategoryDTO.
   * @param category - The category entity from the database.
   * @returns {GetCategoryDTO} - The transformed category data transfer object.
   */
  transformCategoryDBtoGetCategoryDTO(category: CategoryDB): GetCategoryDTO {
    const dto = new GetCategoryDTO();
    dto.id = category.id;
    dto.name = category.name;
    return dto;
  }

  /**
   * Transforms a GenderDB object into a GetGenderDTO.
   * @param gender - The gender entity from the database.
   * @returns {GetGenderDTO} - The transformed gender data transfer object.
   */
  transformGenderDBtoGetGenderDTO(gender: GenderDB): GetGenderDTO {
    const dto = new GetGenderDTO();
    dto.id = gender.id;
    dto.gender = gender.gender;
    return dto;
  }

  /**
   * Transforms an EventDB object into a GetEventCardDTO.
   * @param event - The event entity from the database.
   * @returns {Promise<GetEventCardDTO>} - A promise resolving to the transformed event card data transfer object.
   */
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

  /**
   * Transforms an EventDB object into a GetEventDetailsDTO.
   * @param event - The event entity from the database.
   * @param isHost - bool if user is host
   * @param isParticipant - bool if user is a participant
   * @returns {Promise<GetEventDetailsDTO>} - A promise resolving to the transformed event details data transfer object.
   */
  async transformEventDBtoGetEventDetailsDTO(
    event: EventDB,
    isHost: boolean,
    isParticipant: boolean,
  ): Promise<GetEventDetailsDTO> {
    const dto = new GetEventDetailsDTO();
    dto.id = event.id;
    dto.isHost = isHost;
    dto.isParticipant = isParticipant;
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

    dto.host = this.transformUserDBtoGetUserProfileDTO(event.host, false);

    dto.participants = participants.map((user) => {
      return this.transformUserDBtoGetUserProfileDTO(user, false);
    });

    dto.startAge = event.startAge || null;
    dto.endAge = event.endAge || null;

    const preferredGenders = event.preferredGenders;
    dto.preferredGenders = preferredGenders.map(
      this.transformGenderDBtoGetGenderDTO,
    );

    return dto;
  }

  /**
   * Transforms an EventDB object into a GetEventJoinDTO.
   * @param event - The event entity from the database.
   * @returns {Promise<GetEventJoinDTO>} - A promise resolving to the transformed event data transfer object.
   */
  async transformEventDBtoGetEventJoinDTO(
    event: EventDB,
  ): Promise<GetEventJoinDTO> {
    const dto = new GetEventJoinDTO();
    dto.id = event.id;
    dto.dateAndTime = event.dateAndTime;
    dto.title = event.title;
    dto.picture = event.picture;
    dto.status = event.status;

    return dto;
  }

  /**
   * Transforms a RequestDB object into a GetEventJoinRequestDTO.
   * @param request - The request entity from the database.
   * @returns {Promise<GetEventJoinRequestDTO>} - A promise resolving to the transformed request DTO.
   */
  async transformRequestDBtoGetEventJoinRequestDTO(
    request: RequestDB,
  ): Promise<GetEventJoinRequestDTO> {
    const dto = new GetEventJoinRequestDTO();
    dto.id = request.id;
    dto.denied = request.denied;
    dto.event = await this.transformEventDBtoGetEventJoinDTO(request.event);

    return dto;
  }

  /**
   * Transforms a RequestDB object into a GetUserJoinRequestDTO.
   * @param request - The request entity from the database.
   * @returns {Promise<GetUserJoinRequestDTO>} - A promise resolving to the transformed request DTO.
   */
  async transformRequestDBtoGetUserJoinRequestDTO(
    request: RequestDB,
  ): Promise<GetUserJoinRequestDTO> {
    const dto = new GetUserJoinRequestDTO();
    dto.id = request.id;
    dto.denied = request.denied;
    dto.user = this.transformUserDBtoGetUserProfileDTO(request.user, false);

    return dto;
  }
}
