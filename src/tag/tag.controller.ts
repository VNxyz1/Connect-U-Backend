import { Controller, Get, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { TagDB } from '../database/TagDB';
import { GetTagDTO } from './DTO/GetTagDTO';

@ApiTags('tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @ApiResponse({
    type: [GetTagDTO],
    description: 'Gets tags filtered by the search query',
  })
  @Get('search')
  async getTags(@Query('tagSearch') tagSearch: string): Promise<TagDB[]> {
    return this.tagService.getAllTags(tagSearch);
  }
}
