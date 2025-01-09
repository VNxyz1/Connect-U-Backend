import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { UserDB } from '../database/UserDB';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GenderEnum } from '../database/enums/GenderEnum';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<UserDB>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserDB),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(UserDB));
  });

  it('should throw BadRequestException if email is already taken', async () => {
    userRepository.findOne.mockResolvedValueOnce({ id: '1' } as UserDB); // Email conflict
    const mockData = {
      email: 'existing.email@example.com',
      username: 'newUsername',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      birthday: '1990-01-01',
      gender: 1,
      agb: true,
      passwordConfirm: 'password123',
    };

    await expect(service.createUser(mockData)).rejects.toThrow(
      new BadRequestException('e-mail address is already taken'),
    );
  });

  it('should throw BadRequestException if username is already taken', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);
    userRepository.findOne.mockResolvedValueOnce({ id: '1' } as UserDB);
    const mockData = {
      email: 'new.email@example.com',
      username: 'existingUsername',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      birthday: '1990-01-01',
      gender: 1,
      agb: true,
      passwordConfirm: 'password123',
    };

    await expect(service.createUser(mockData)).rejects.toThrow(
      new BadRequestException('username is already taken'),
    );
  });

  it('should create and save a new user', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);
    userRepository.findOne.mockResolvedValueOnce(null);
    userRepository.create.mockReturnValue({ id: 'newUserId' } as UserDB);
    userRepository.save.mockResolvedValue({ id: 'newUserId' } as UserDB);

    const mockData = {
      email: 'new.email@example.com',
      username: 'newUsername',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      birthday: '1990-01-01',
      gender: 1,
      agb: true,
      passwordConfirm: 'password123',
    };

    const result = await service.createUser(mockData);

    expect(userRepository.create).toHaveBeenCalled();
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: mockData.email,
        username: mockData.username,
        firstName: mockData.firstName,
        lastName: mockData.lastName,
        birthday: mockData.birthday,
        gender: mockData.gender,
      }),
    );
    expect(result.id).toBe('newUserId');
  });

  it('should throw NotFoundException if user is not found by email', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      service.findByEmail('missing.email@example.com'),
    ).rejects.toThrow(
      new NotFoundException(
        'The user with the email "missing.email@example.com" does not exist',
      ),
    );
  });

  it('should return a user found by email', async () => {
    const mockUser = { id: '1', email: 'found.email@example.com' } as UserDB;
    userRepository.findOne.mockResolvedValueOnce(mockUser);

    const result = await service.findByEmail('found.email@example.com');

    expect(result).toEqual(mockUser);
  });

  it('should throw NotFoundException if user is not found by username', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.findByUsername('missingUsername')).rejects.toThrow(
      new NotFoundException(
        'The user with the username "missingUsername" does not exist',
      ),
    );
  });

  it('should return a user found by username', async () => {
    const mockUser = { id: '1', username: 'foundUsername' } as UserDB;
    userRepository.findOne.mockResolvedValueOnce(mockUser);

    const result = await service.findByUsername('foundUsername');

    expect(result).toEqual(mockUser);
  });

  it('should update user successfully', async () => {
    const mockUser = { id: '1', email: 'existing.email@example.com' } as UserDB;
    const mockUpdateData = { email: 'new.email@example.com' };

    userRepository.findOne.mockResolvedValueOnce(mockUser); // Existing user
    userRepository.findOne.mockResolvedValueOnce(null); // No email conflict
    userRepository.save.mockResolvedValueOnce({
      ...mockUser,
      ...mockUpdateData,
    });

    const result = await service.updateUser('1', mockUpdateData);

    expect(result.email).toBe(mockUpdateData.email);
  });

  it('should throw BadRequestException if updated email is already taken', async () => {
    const mockUser = { id: '1', email: 'existing.email@example.com' } as UserDB;
    const mockUpdateData = { email: 'conflicting.email@example.com' };

    userRepository.findOne.mockResolvedValueOnce(mockUser); // Existing user
    userRepository.findOne.mockResolvedValueOnce({ id: '2' } as UserDB); // Email conflict

    await expect(service.updateUser('1', mockUpdateData)).rejects.toThrow(
      new BadRequestException('e-mail address is already taken'),
    );
  });

  it('should update user password successfully', async () => {
    const mockUser = { id: '1', password: 'oldPasswordHash' } as UserDB;
    const newPassword = 'newPasswordHash';

    userRepository.findOne.mockResolvedValueOnce(mockUser);
    userRepository.save.mockResolvedValueOnce({
      ...mockUser,
      password: newPassword,
    });

    const result = await service.updatePassword('1', newPassword);

    expect(result.password).toBe(newPassword);
  });

  it('should update user profile successfully', async () => {
    const mockUser = { id: '1', profileText: 'Old text' } as UserDB;
    const mockUpdateData = { profileText: 'Updated text' };

    userRepository.findOne.mockResolvedValueOnce(mockUser);
    userRepository.save.mockResolvedValueOnce({
      ...mockUser,
      ...mockUpdateData,
    });

    const result = await service.updateUserProfile('1', null, mockUpdateData);

    expect(result.profileText).toBe(mockUpdateData.profileText);
  });
});

export const mockUserList: UserDB[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    username: 'johndoe',
    password: 'hashedpassword123',
    firstName: 'John',
    lastName: 'Doe',
    birthday: '1990-01-15',
    phoneNumber: '+1234567890',
    profilePicture: 'profile1.png',
    pronouns: 'he/him',
    profileText: 'I love programming and outdoor adventures.',
    streetNumber: '123',
    street: 'Main St',
    zipCode: '12345',
    city: 'Anytown',
    isVerified: true,
    gender: GenderEnum.Male,
    hostedEvents: [],
    requests: [],
    participatedEvents: [],
    favoritedEvents: [],
    memories: [],
    friends: Promise.resolve([]),
    friendOf: Promise.resolve([]),
    listEntries: [],
    achievements: Promise.resolve([]),
    surveyEntries: [],
    messages: [],
    lists: [],
    surveys: [],
    reactions: [],
    tags: [],
    unreadMessages: [],
    viewEvents: [],
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    password: 'hashedpassword456',
    firstName: 'Jane',
    lastName: 'Smith',
    birthday: '1985-06-25',
    phoneNumber: '+1987654321',
    profilePicture: 'profile2.png',
    pronouns: 'she/her',
    profileText: 'Passionate about design and photography.',
    streetNumber: '456',
    street: 'Second St',
    zipCode: '54321',
    city: 'Othertown',
    isVerified: false,
    gender: GenderEnum.Female,
    hostedEvents: [],
    requests: [],
    participatedEvents: [],
    favoritedEvents: [],
    memories: [],
    friends: Promise.resolve([]),
    friendOf: Promise.resolve([]),
    listEntries: [],
    lists: [],
    surveys: [],
    achievements: Promise.resolve([]),
    surveyEntries: [],
    messages: [],
    reactions: [],
    tags: [],
    unreadMessages: [],
    viewEvents: [],
  },
  {
    id: '3',
    email: 'alex.jones@example.com',
    username: 'alexjones',
    password: 'hashedpassword789',
    firstName: 'Alex',
    lastName: 'Jones',
    birthday: '2000-10-10',
    phoneNumber: '+1122334455',
    profilePicture: 'profile3.png',
    pronouns: 'they/them',
    profileText: 'Avid reader and aspiring writer.',
    streetNumber: '789',
    street: 'Third St',
    zipCode: '67890',
    city: 'Somecity',
    isVerified: true,
    gender: GenderEnum.Diverse,
    hostedEvents: [],
    requests: [],
    lists: [],
    surveys: [],
    participatedEvents: [],
    favoritedEvents: [],
    memories: [],
    friends: Promise.resolve([]),
    friendOf: Promise.resolve([]),
    listEntries: [],
    achievements: Promise.resolve([]),
    surveyEntries: [],
    messages: [],
    reactions: [],
    tags: [],
    unreadMessages: [],
    viewEvents: [],
  },
];

export const mockUserService = {
  findById: jest.fn().mockResolvedValue(mockUserList[2]),
  findByEmail: jest.fn().mockResolvedValue(mockUserList[1]),
  findByUsername: jest.fn().mockResolvedValue(mockUserList[1]),
  createUser: jest.fn().mockResolvedValue(mockUserList[0]),
  updateUser: jest.fn().mockResolvedValue(undefined),
  updateUserProfile: jest.fn().mockResolvedValue(undefined),
  updatePassword: jest.fn().mockResolvedValue(undefined),
};
