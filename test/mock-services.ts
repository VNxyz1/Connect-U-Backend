import { UserService } from '../src/user/user.service';
import { mockUserService } from '../src/user/user.service.spec';
import { JwtService } from '@nestjs/jwt';
import { JWTConstants } from '../src/auth/constants';
import { AuthService } from '../src/auth/auth.service';
import { mockAuthService } from '../src/auth/auth.service.spec';

export const mockProviders = [
  {
    provide: UserService,
    useValue: mockUserService,
  },
  {
    provide: JwtService,
    useValue: {
      verifyAsync: jest.fn().mockReturnValue({
        sub: 'uuIdMock',
        username: 'testUser',
        email: 'test@email.com',
      }),
    },
  },
  {
    provide: JWTConstants,
    useValue: {
      getConstants: jest.fn().mockReturnValue({ secret: 'seret_token' }),
    },
  },
  {
    provide: AuthService,
    useValue: mockAuthService,
  },
];
