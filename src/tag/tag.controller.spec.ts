import * as request from 'supertest';
import { Agent } from 'supertest';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { mockTagService } from './tag.service.spec';

describe('TagController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TagController],
      providers: [
        {
          provide: TagService,
          useValue: mockTagService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    agent = request.agent(app.getHttpServer());
    await app.init();
  });

  describe('GET /tags/search', () => {
    it('should return tags matching the search query', async () => {
      const mockTags = [
        { id: 1, title: 'Tag1' },
        { id: 2, title: 'Tag2' },
      ];

      jest.spyOn(mockTagService, 'getAllTags').mockResolvedValue(mockTags);

      return agent
        .get('/tags/search?tagSearch=Tag')
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual(mockTags);
        });
    });

    it('should return an empty array if no tags match', async () => {
      jest.spyOn(mockTagService, 'getAllTags').mockResolvedValue([]);

      return agent
        .get('/tags/search?tagSearch=NonExistentTag')
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual([]);
        });
    });

    it('should return tags sorted by events and users count', async () => {
      const mockTags = [
        { id: 1, title: 'Tag1', events: [{}, {}], users: [{}] },
        { id: 2, title: 'Tag2', events: [{}], users: [{}] },
      ];

      jest.spyOn(mockTagService, 'getAllTags').mockResolvedValue(mockTags);

      return agent
        .get('/tags/search?tagSearch=Tag')
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body[0].title).toBe('Tag1');
          expect(response.body[1].title).toBe('Tag2');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
