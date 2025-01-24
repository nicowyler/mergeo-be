export class ProductMetadataDto {
  id: string;
  name: string;
  created: Date;
  updated: Date;
  metadata: {
    belongsToDiscountLists: {
      id: string;
      name: string;
      description: string;
      discount: number;
    }[];
  };
  userActivity: {
    action: string;
    timestamp: Date;
    user: string;
    details: string;
  }[];
}
