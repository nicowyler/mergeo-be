import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { threadId } from 'worker_threads';

export type TokenType = 'Bearer' | 'Refresh';

const extractTokenFromCookies = (
  request: Request,
  type?: 'access' | 'refresh',
): string | undefined => {
  try {
    const tokenType = {
      access: 'access_token',
      refresh: 'refresh_token',
    };

    return request.cookies.tokens[tokenType[type]];
  } catch (error) {
    throw new ForbiddenException('No token found');
  }
};

const extractTokenFromHeader = (
  request: Request,
  tokenType: TokenType = 'Bearer',
): string | undefined => {
  try {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === tokenType ? token : undefined;
  } catch (error) {
    throw new ForbiddenException('No token found');
  }
};

export const TokenUtils = { extractTokenFromHeader, extractTokenFromCookies };
