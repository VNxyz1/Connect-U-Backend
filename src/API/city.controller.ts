import { Controller, Get, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { CityService } from './city.service';
import {  ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('city')
@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieves localities based on the postal code or city name.',
  })
  @HttpCode(HttpStatus.OK)
  @Get('localities')
  async getLocalities( @Query('postalCode') postalCode: string,
                       @Query('name') name: string,
                       @Query('page') page: number,
                       @Query('pageSize') pageSize: number) {

    return this.cityService.searchLocalities(postalCode, name, page, pageSize);
  }
}
