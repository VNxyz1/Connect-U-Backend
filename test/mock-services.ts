import { UserService } from '../src/user/user.service';
import { mockUserService } from '../src/user/user.service.spec';
import { JwtService } from '@nestjs/jwt';
import { JWTConstants } from '../src/auth/constants';
import { AuthService } from '../src/auth/auth.service';
import { mockAuthService } from '../src/auth/auth.service.spec';
import { EventService } from '../src/event/event.service';
import {
  mockEventService,
  mockSchedulerService,
} from '../src/event/event.service.spec';
import { CategoryService } from '../src/category/category.service';
import { mockCategoryService } from '../src/category/category.service.spec';
import { GenderService } from '../src/gender/gender.service';
import { mockGenderService } from '../src/gender/gender.service.spec';
import { RequestService } from '../src/request/request.service';
import { mockRequestService } from '../src/request/request.service.spec';
import { UtilsService } from '../src/utils/utils.service';
import { mockUtilsService } from '../src/utils/utils.service.spec';
import { ListService } from '../src/list/list.service';
import { mockListService } from '../src/list/list.service.spec';
import { ListEntryService } from '../src/listEntry/listEntry.service';
import { mockListEntryService } from '../src/listEntry/listEntry.service.spec';
import { SurveyService } from '../src/survey/survey.service';
import { mockSurveyService } from '../src/survey/survey.service.spec';
import { TagService } from '../src/tag/tag.service';
import { mockTagService } from '../src/tag/tag.service.spec';
import { SchedulerService } from '../src/scheduler/scheduler.service';
import { FriendService } from '../src/friend/friend.service';
import { mockFriendService } from '../src/friend/friend.service.spec';

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
  {
    provide: UtilsService,
    useValue: mockUtilsService,
  },
  {
    provide: ListService,
    useValue: mockListService,
  },
  {
    provide: ListEntryService,
    useValue: mockListEntryService,
  },
  {
    provide: TagService,
    useValue: mockTagService,
  },
  {
    provide: SchedulerService,
    useValue: mockSchedulerService,
  },
  {
    provide: FriendService,
    useValue: mockFriendService,
  },
  { provide: SurveyService, useValue: mockSurveyService },
];
