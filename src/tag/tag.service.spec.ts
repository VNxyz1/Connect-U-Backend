import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from './tag.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TagDB } from '../database/TagDB';
import { Repository } from 'typeorm';

describe('TagService', () => {
  let service: TagService;
  let tagRepository: Repository<TagDB>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: getRepositoryToken(TagDB),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    tagRepository = module.get<Repository<TagDB>>(getRepositoryToken(TagDB));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrCreateTags', () => {
    it('should return existing tags if they exist', async () => {
      const tags = ['coding', 'music'];
      const existingTag = new TagDB();
      existingTag.title = 'coding';

      (tagRepository.findOne as jest.Mock).mockResolvedValueOnce(existingTag);

      const result = await service.findOrCreateTags(tags);

      expect(result).toEqual([existingTag]);
      expect(tagRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should create new tags if they do not exist', async () => {
      const tags = ['coding', 'travel'];
      const newTag = new TagDB();
      newTag.title = 'coding';

      (tagRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (tagRepository.create as jest.Mock).mockReturnValue(newTag);
      (tagRepository.save as jest.Mock).mockResolvedValue(newTag);

      const result = await service.findOrCreateTags(tags);

      expect(result).toEqual([newTag, newTag]);
      expect(tagRepository.findOne).toHaveBeenCalledTimes(2);
      expect(tagRepository.create).toHaveBeenCalledTimes(2);
      expect(tagRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});

export const mockTagService = {
  findOrCreateTags: jest.fn().mockResolvedValue(['coding', 'travel']),
  getAllTags: jest.fn().mockResolvedValue([
    { id: 1, title: 'coding', events: [{}, {}], users: [{}] },
    { id: 2, title: 'travel', events: [{}], users: [{}] },
  ]),
};
