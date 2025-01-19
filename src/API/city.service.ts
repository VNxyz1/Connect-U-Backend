import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CityService {
  private readonly baseUrl = 'https://openplzapi.org';

  /**
   * Searches for localities based on postal code and/or name.
   *
   * @param postalCode - The postal code to filter localities by. This can be a specific code or a regex pattern.
   * @param name - The name of the locality to search for. This can be a specific name or a regex pattern.
   * @param page - The page number for pagination
   * @param pageSize - The number of results per page
   *
   * @returns A list of localities matching the search criteria.
   *
   * @throws HttpException If an error occurs during the API request or if no results are found.
   */
  async searchLocalities(
    postalCode?: string,
    name?: string,
    page = 1,
    pageSize = 50,
  ) {
    const params: any = { page, pageSize };

    if (postalCode) {
      params.postalCode = postalCode;
    }

    if (name) {
      params.name = name;
    }

    const response = await axios.get(`${this.baseUrl}/de/Localities`, {
      params,
      headers: {
        accept: 'text/json',
      },
    });
    if (!response) {
      throw new NotFoundException('No cities found');
    }

    return response.data.map((locality: any) => ({
      postalCode: locality.postalCode,
      name: locality.name,
    }));
  }
}
