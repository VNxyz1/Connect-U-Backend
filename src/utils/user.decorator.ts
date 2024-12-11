import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * if the user has an active JWTToken set as a cookie, the userdata is returned as a {@link UserDB} Object. Else it returns `null`.
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
