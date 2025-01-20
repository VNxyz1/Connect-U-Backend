import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiProperty } from '@nestjs/swagger';

export class Pagination {
  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;
}

export const PaginationParams = createParamDecorator(
  (data, ctx: ExecutionContext): Pagination => {
    const req: Request = ctx.switchToHttp().getRequest();
    const page = parseInt(req.query.page as string);
    const size = parseInt(req.query.size as string);

    if (isNaN(page) || page < 0 || isNaN(size) || size < 0) {
      throw new BadRequestException('Invalid pagination params');
    }
    if (size > 100) {
      throw new BadRequestException(
        'Invalid pagination params: Max size is 100',
      );
    }

    return { page, size };
  },
);

export const paginate = <T>(
  array: T[],
  page_size: number,
  page_number: number,
) => {
  const start = page_number * page_size;
  const end = start + page_size;

  if (start >= array.length) {
    return [];
  }

  return array.slice(start, Math.min(end, array.length));
};
