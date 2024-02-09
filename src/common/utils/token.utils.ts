import { Request } from 'express';

export type TokenType = 'Bearer' | 'Refresh';

export const extractTokenFromHeader = (
  request: Request,
  tokenType: TokenType = 'Bearer',
): string | undefined => {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === tokenType ? token : undefined;
};

export const TokenUtils = { extractTokenFromHeader };
