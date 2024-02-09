export interface AuthenticatedRequest extends Request {
  user: {
    exp: number;
    iat: number;
    sub: string;
    email: string;
  };
}
