export interface EventPayloads {
  'user.welcome': {
    name: string;
    email: string;
    link?: string;
    template?: string;
  };
  'user.reset-password': { email: string; link?: string; template?: string };
  'user.invited': {
    email: string;
    password: string;
    owner: string;
    company: string;
    link?: string;
    template?: string;
  };
  'user.verify-email': {
    name: string;
    email: string;
    activationCode: string;
    link?: string;
    template?: string;
  };
  'whatsapp.message': {
    tempalteName: string;
    providerName: string;
    userName: string;
    unitsCount: string;
    product: string;
  };
}
