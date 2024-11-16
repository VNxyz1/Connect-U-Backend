import { UserService } from '../src/user/user.service';
import { mockUserService } from '../src/user/user.service.spec';
import { JwtService } from '@nestjs/jwt';
import { JWTConstants } from '../src/auth/constants';
import { AuthService } from '../src/auth/auth.service';
import { mockAuthService } from '../src/auth/auth.service.spec';
import { EventService } from '../src/event/event.service';
import { mockEventService } from '../src/event/event.service.spec';
import { CategoryService } from '../src/category/category.service';
import { mockCategoryService } from '../src/category/category.service.spec';
import { GenderService } from '../src/gender/gender.service';
import { mockGenderService } from '../src/gender/gender.service.spec';
import { RequestService } from '../src/request/request.service';
import { mockRequestService } from '../src/request/request.service.spec';

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
  {
    provide: EventService,
    useValue: mockEventService,
  },
  {
    provide: CategoryService,
    useValue: mockCategoryService,
  },
  {
    provide: GenderService,
    useValue: mockGenderService,
  },
  {
    provide: RequestService,
    useValue: mockRequestService,
  },
];
