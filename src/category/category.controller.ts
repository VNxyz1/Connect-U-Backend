import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { GetCategoryDTO } from './DTO/GetCategoryDTO';
import { UtilsService } from '../utils/utils.service';


@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(
    public readonly categoryService: CategoryService,
    public readonly utilsService: UtilsService,
  ) {}

  @ApiResponse({
    type: [GetCategoryDTO],
    description: 'gets all categories',
  })
  @Get('/all')
  async getAllCategories() {
    try {
      const categories = await this.categoryService.getCategories();
      return await Promise.all(
        categories.map(async (offer) => {
          return this.utilsService.transformCategoryDBtoGetCategoryDTO(offer);
        }),
      );
    } catch (err) {
      throw new BadRequestException('An error occurred: ' + err.message);
    }
  }
}
