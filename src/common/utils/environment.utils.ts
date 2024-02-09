import { Environment } from '../enum';

const isDevelopmentEnv = (nodeEnv: string) => {
  return nodeEnv !== Environment.Prodcution;
};

export const EnvUtils = { isDevelopmentEnv };
