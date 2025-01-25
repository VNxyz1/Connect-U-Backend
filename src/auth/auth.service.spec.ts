import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { mockProviders } from '../../test/mock-services';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        ...mockProviders.filter((provider) => provider.provide !== AuthService),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('decodeToken', () => {
    it('should decode a valid token', async () => {
      const token = 'valid.jwt.token';
      const decoded = { sub: 'user-id', email: 'test@example.com' };

      jwtService.decode = jest.fn().mockReturnValue(decoded);

      const result = await service.decodeToken(token);
      expect(result).toEqual(decoded);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from the Authorization header', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid.jwt.access.token',
        },
      };

      const token = service.extractTokenFromHeader(mockRequest);

      expect(token).toBe('valid.jwt.access.token');
    });

    it('should return undefined if no Authorization header is provided', () => {
      const mockRequest = {
        headers: {},
      };

      const token = service.extractTokenFromHeader(mockRequest);

      expect(token).toBeUndefined();
    });

    it('should return undefined if Authorization header is not Bearer type', () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic invalid-token',
        },
      };

      const token = service.extractTokenFromHeader(mockRequest);

      expect(token).toBeUndefined();
    });
  });
});

export const mockAuthService = {
  signIn: jest.fn().mockResolvedValue({
    access_token: 'valid.jwt.access.token',
    refresh_token: 'valid.jwt.refresh.token',
  }),
  validatePassword: jest.fn().mockResolvedValue(true),
  decodeToken: jest.fn().mockReturnValue({
    sub: 'user-id-mock',
    email: 'mocked.user@example.com',
  }),
  validateToken: jest.fn().mockResolvedValue(true),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshAccessToken: jest
    .fn()
    .mockResolvedValue({ access_token: 'valid.jwt.access.token' }),
  extractTokenFromHeader: jest.fn().mockReturnValue('valid.jwt.access.token'),
};
