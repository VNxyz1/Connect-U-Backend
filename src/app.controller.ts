import {
  Controller,
  Get,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OkDTO } from './serverDTO/OkDTO';
import { EventService } from './event/event.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly eventService: EventService) {}

  @ApiResponse({
    type: OkDTO,
    example: new OkDTO(true, 'healthy'),
    description: 'The service is available.',
    status: HttpStatus.OK,
  })
  @ApiOperation({
    summary: 'Health Check',
    description:
      'Checks if the service is running and reachable. Always returns a "healthy" status if the service is available.',
  })
  @Get('/health')
  healthCheck() {
    return new OkDTO(true, 'healthy');
  }

  @ApiResponse({
    type: OkDTO,
    example: new OkDTO(true, 'ready'),
    description: 'The service is ready to handle requests.',
    status: HttpStatus.OK,
  })
  @ApiResponse({
    type: ServiceUnavailableException,
    example: new ServiceUnavailableException('Not ready'),
    description:
      'The service is not ready. This may indicate a failed connection to the database or other dependencies.',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  })
  @ApiOperation({
    summary: 'Readiness Check',
    description:
      'Checks if the service is ready to handle requests. This includes verifying the connection to the database and other dependent services.',
  })
  @Get('/ready')
  async readinessCheck() {
    const events = await this.eventService.getAllActiveEventsByPopularity();

    const dbConnected = !!events;

    if (dbConnected) {
      return new OkDTO(true, 'ready');
    } else {
      throw new ServiceUnavailableException('Not ready');
    }
  }
}
