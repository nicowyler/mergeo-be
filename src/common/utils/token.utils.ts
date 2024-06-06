import { Request } from 'express';

export type TokenType = 'Bearer' | 'Refresh';

const extractTokenFromCookies = (
  request: Request,
  type?: 'access' | 'refresh',
): string | undefined => {
  const tokenType = {
    access: 'access_token',
    refresh: 'refresh_token',
  };

  return request.cookies.tokens[tokenType[type]];
};

const extractTokenFromHeader = (
  request: Request,
  tokenType: TokenType = 'Bearer',
): string | undefined => {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === tokenType ? token : undefined;
};

export const TokenUtils = { extractTokenFromHeader, extractTokenFromCookies };
