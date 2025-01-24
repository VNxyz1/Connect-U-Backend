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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListDB } from '../database/ListDB';
import { ListEntryDB } from '../database/ListEntryDB';
import { GetListEntryDTO } from '../listEntry/DTO/GetListEntryDTO';
import { GetListDetailsDTO } from '../list/DTO/GetListDetailsDTO';
import { GetListDTO } from '../list/DTO/GetListDTO';
import { SurveyDB } from '../database/SurveyDB';
import { GetSurveyDetailsDTO } from '../survey/DTO/GetSurveyDetailsDTO';
import { SurveyEntryDB } from '../database/SurveyEntryDB';
import { GetSurveyEntryDTO } from '../survey/DTO/GetSurveyEntryDTO';
import { StatusEnum } from '../database/enums/StatusEnum';
import { MessageDB } from '../database/MessageDB';
import { GetEventChatDTO } from '../Message/DTO/GetEventChatDTO';
import { GetMessageDTO } from '../Message/DTO/GetMessageDTO';
import { GetFriendProfileDTO } from '../user/DTO/GetFriendProfileDTO';

@Injectable()
export class UtilsService {
  constructor(
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
  ) {}

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
    if (minAge) {
      const age = this.calculateAge(birthday);
      return age >= minAge;
    } else {
      return true;
    }
  }

  /**
   * Validates if a user meets the maximum age requirement.
   * @param birthday - The user's date of birth.
   * @param maxAge - The maximum allowed age.
   * @returns {boolean} - True if the user's age is less than or equal to the maximum age, otherwise false.
   */
  validateUserAgeMax(birthday: Date, maxAge: number): boolean {
    if (maxAge) {
      const age = this.calculateAge(birthday);
      return age <= maxAge;
    } else {
      return true;
    }
  }

  /**
   * Determines if a given date is in the future.
   * @param dateAndTime - The date to check, in ISO string format.
   * @returns {boolean} - True if the date is in the future, otherwise false.
   */
  isFutureDate(dateAndTime: string): boolean {
    const eventDate = new Date(dateAndTime);
    const now = new Date();
    return eventDate.getTime() > now.getTime();
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

    if (
      ![StatusEnum.live, StatusEnum.upcoming, undefined].includes(event.status)
    ) {
      throw new BadRequestException(
        'The Event is outdated or not in a valid state.',
      );
    }
    return true;
  }

  /**
   * Checks if a user is the host or a participant of an event.
   *
   * @param user - The user to check.
   * @param eventId - The event to check against.
   *
   * @returns {boolean} - Returns true if the user is the host or a participant.
   *
   *
   */
  async isHostOrParticipant(user: UserDB, eventId: string): Promise<boolean> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['participants', 'host'],
    });

    let isParticipant = false;
    if (event.participants != null) {
      isParticipant = event.participants.some(
        (participant) => participant.id === user.id,
      );
    }
    const isHost = event.host.id === user.id;

    return isParticipant || isHost;
  }

  /**
   * Transforms a UserDB object into a GetUserProfileDTO.
   * @param user - The user entity from the database.
   * @param isUser - boolean if logged-in user is user who's visiting the profile
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
    if (user.tags && user.tags.length > 0) {
      dto.tags = user.tags.map((tag) => tag.title);
    }
    return dto;
  }

  /**
   * Transforms a UserDB object into a GetUserProfileDTO.
   * @param user - The user entity from the database.
   * @param isUser - boolean if logged-in user is user who's visiting the profile
   * @param areFriends - boolean if users are friends
   * @returns {GetFriendProfileDTO} - The transformed user profile data transfer object.
   */
  transformUserDBtoGetFriendProfileDTO(
    user: UserDB,
    isUser: boolean,
    areFriends: boolean,
  ): GetFriendProfileDTO {
    const dto = new GetFriendProfileDTO();
    dto.id = user.id;
    dto.isUser = isUser;
    dto.areFriends = areFriends;
    dto.pronouns = user.pronouns;
    dto.profilePicture = user.profilePicture;
    dto.profileText = user.profileText;
    dto.firstName = user.firstName;
    dto.username = user.username;
    dto.city = user.city;
    const birthday = new Date(user.birthday);
    dto.age = this.calculateAge(birthday);
    if (user.tags && user.tags.length > 0) {
      dto.tags = user.tags.map((tag) => tag.title);
    }
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
    dto.germanName = category.germanName;
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
   * @param friendsEvents - optional. An array of all events where friends are participating or hosting
   * @returns {Promise<GetEventCardDTO>} - A promise resolving to the transformed event card data transfer object.
   */
  async transformEventDBtoGetEventCardDTO(
    event: EventDB,
    friendsEvents?: EventDB[],
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
    dto.participantsNumber = participants?.length || 0;
    dto.maxParticipantsNumber = event.participantsNumber;
    if (event.tags && event.tags.length > 0) {
      dto.tags = event.tags.map((tag) => tag.title);
    }
    if (friendsEvents) {
      dto.participatingFriend = !!friendsEvents.find((e) => e.id == event.id);
    }
    return dto;
  }

  /**
   * Transforms an EventDB object into a GetEventDetailsDTO.
   * @param event - The event entity from the database.
   * @param isHost - bool if user is host
   * @param isParticipant - bool if user is a participant
   * @param isLoggedIn -bool if the current user is logged in
   * @returns {Promise<GetEventDetailsDTO>} - A promise resolving to the transformed event details data transfer object.
   */
  async transformEventDBtoGetEventDetailsDTO(
    event: EventDB,
    isHost: boolean,
    isParticipant: boolean,
    isLoggedIn: boolean,
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

    if (isLoggedIn) {
      dto.host = this.transformUserDBtoGetUserProfileDTO(event.host, false);
      dto.participants = event.participants.map((user) =>
        this.transformUserDBtoGetUserProfileDTO(user, false),
      );
    } else {
      dto.host = null;
      dto.participants = [];
    }

    dto.startAge = event.startAge || null;
    dto.endAge = event.endAge || null;

    const preferredGenders = event.preferredGenders;
    dto.preferredGenders = preferredGenders.map(
      this.transformGenderDBtoGetGenderDTO,
    );

    if (event.tags && event.tags.length > 0) {
      dto.tags = event.tags.map((tag) => tag.title);
    }

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

  /**
   * Transforms a ListDB entity into a GetListDetailsDTO.
   *
   * @param list - The ListDB entity to transform.
   * @returns The transformed GetListDTO.
   */
  transformListDBtoGetListDTO(list: ListDB): GetListDTO {
    return {
      id: list.id,
      title: list.title,
      description: list.description,
      creator: this.transformUserDBtoGetUserProfileDTO(list.creator, false),
      listEntriesNumber: list.listEntries.length,
    };
  }

  /**
   * Transforms a ListDB entity into a GetListDetailsDTO.
   *
   * @param list - The ListDB entity to transform.
   * @param currentUserId - id of the current user
   * @returns The transformed GetListDTO.
   */
  transformListDBtoGetListDetailsDTO(
    list: ListDB,
    currentUserId: string,
  ): GetListDetailsDTO {
    const isCreatorOrHost =
      list.creator.id === currentUserId ||
      (list.event && list.event.host.id === currentUserId);

    return {
      id: list.id,
      title: list.title,
      description: list.description,
      creator: this.transformUserDBtoGetUserProfileDTO(
        list.creator,
        isCreatorOrHost,
      ),
      listEntries: list.listEntries.map((entry) =>
        this.transformListEntryDBtoGetListEntryDTO(entry),
      ),
    };
  }

  /**
   * Transforms a ListEntryDB entity into a GetListEntryDTO.
   *
   * @param entry - The ListEntryDB entity to transform.
   * @returns The transformed GetListEntryDTO.
   */
  transformListEntryDBtoGetListEntryDTO(entry: ListEntryDB): GetListEntryDTO {
    return {
      id: entry.id,
      timestamp: entry.timestamp,
      content: entry.content,
      user: entry.user
        ? this.transformUserDBtoGetUserProfileDTO(entry.user, false)
        : null,
    };
  }

  /**
   * Transforms a SurveyDB entity into a GetSurveyDTO.
   *
   * @returns The transformed GetListEntryDTO.
   * @param survey -survey to transform
   * @param currentUserId -ID of the current user
   */
  async transformSurveyDBtoGetSurveyDetailsDTO(
    survey: SurveyDB,
    currentUserId: string,
  ): Promise<GetSurveyDetailsDTO> {
    const surveyEntries = await Promise.all(
      survey.surveyEntries.map((entry) =>
        this.transformSurveyEntryDBtoGetSurveyEntryDTO(entry, currentUserId),
      ),
    );

    const isCreatorOrHost =
      survey.creator.id === currentUserId ||
      (survey.event && survey.event.host.id === currentUserId);

    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      creator: this.transformUserDBtoGetUserProfileDTO(
        survey.creator,
        isCreatorOrHost,
      ),
      surveyEntries,
    };
  }

  /**
   * Transforms a SurveyEntryDB entity into a GetSurveyEntryDTO.
   *
   * @param entry - The survey entry to transform.
   * @param currentUserId - The ID of the current user.
   * @returns The transformed GetSurveyEntryDTO.
   */
  async transformSurveyEntryDBtoGetSurveyEntryDTO(
    entry: SurveyEntryDB,
    currentUserId: string,
  ): Promise<GetSurveyEntryDTO> {
    const users = entry.users;

    return {
      id: entry.id,
      content: entry.content,
      users: users.map((user) => {
        const isUser = user.id === currentUserId;
        return this.transformUserDBtoGetUserProfileDTO(user, isUser);
      }),
    };
  }

  /**
   * Transforms a MessageDB entity into a ChatMessageDTO.
   *
   * @param message - The message entity to transform.
   * @param currentUserId - The ID of the current user.
   * @param eventHostId - ID of the event host.
   * @returns The transformed ChatMessageDTO.
   */
  transformMessageDBtoChatMessageDTO(
    message: MessageDB,
    currentUserId: string,
    eventHostId: string,
  ): GetMessageDTO {
    return {
      id: message.id,
      text: message.text,
      timestamp: message.timestamp,
      isHost: message.writer ? message.writer.id === eventHostId : false, // Safely check writer
      writer: message.writer
        ? this.transformUserDBtoGetUserProfileDTO(
            message.writer,
            message.writer.id === currentUserId,
          )
        : null, // Handle null writer case
    };
  }

  /**
   * Transforms an EventDB entity into a GetEventChatDTO, grouping messages into read and unread.
   *
   * @param messages - messages to be sorted
   * @param currentUserId - The ID of the current user.
   * @param hostId - ID of the event host
   * @returns The transformed GetEventChatDTO.
   */
  transformEventChatToGetEventChatDTO(
    messages: MessageDB[],
    currentUserId: string,
    hostId: string,
  ): GetEventChatDTO {
    const sortedMessages = messages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const readMessages = [];
    const unreadMessages = [];

    for (const message of sortedMessages) {
      const isUnread = message.unreadUsers.some(
        (user) => user.id === currentUserId,
      );

      const transformedMessage = this.transformMessageDBtoChatMessageDTO(
        message,
        currentUserId,
        hostId,
      );

      if (isUnread) {
        unreadMessages.push(transformedMessage);
      } else {
        readMessages.push(transformedMessage);
      }
    }

    readMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return {
      readMessages,
      unreadMessages,
    };
  }
}
