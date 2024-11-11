import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { JWTConstants } from './constants';
import { mockProviders } from '../../test/mock-services';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let jwtConstraints: JWTConstants;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthGuard, ...mockProviders],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    jwtConstraints = module.get<JWTConstants>(JWTConstants);
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('should validate JWT token and return true for valid tokens', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid.jwt.token' },
        }),
      }),
    } as unknown as ExecutionContext;

    const canActivate = await authGuard.canActivate(mockContext);
    expect(canActivate).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'valid.jwt.access.token',
      jwtConstraints.getConstants(),
    );
  });

  it('should throw an error for invalid tokens', async () => {
    jwtService.verifyAsync = jest.fn().mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer invalid.jwt.token' },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(authGuard.canActivate(mockContext)).rejects.toThrow(
      'Unauthorized',
    );
  });
});
