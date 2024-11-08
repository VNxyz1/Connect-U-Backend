import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { mockProviders } from '../../test/mock-services';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ...mockProviders.filter((provider) => provider.provide !== AuthService),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

export const mockAuthService = {
  signIn: jest.fn().mockResolvedValue({
    access_token: 'valid.jwt.access.token',
    refresh_token: 'valid.jwt.refresh.token',
  }),
  refreshAccessToken: jest
    .fn()
    .mockResolvedValue({ access_token: 'valid.jwt.access.token' }),
};
