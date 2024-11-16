import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { UtilsService } from '../utils/utils.service';
import { GetGenderDTO } from './DTO/GetGenderDTO';
import { GenderService } from './gender.service';

@ApiTags('gender')
@Controller('gender')
export class GenderController {
  constructor(
    public readonly genderService: GenderService,
    public readonly utilsService: UtilsService,
  ) {}

  @ApiResponse({
    type: [GetGenderDTO],
    description: 'gets all genders',
  })
  @Get('/all')
  async getAllCategories() {
      const genders = await this.genderService.getGenders();
      return await Promise.all(
        genders.map(async (gender) => {
          return this.utilsService.transformGenderDBtoGetGenderDTO(gender);
        }),
      );
  }
}
