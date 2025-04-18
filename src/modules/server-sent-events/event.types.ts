export type OrderStatusUpdate = {
  orderId: string; // UUID of the order
  clientId: string; // UUID of the client
  providerId: string; // UUID of the provider
  message: string; // Status message (e.g., "Order Created")
};

export type ProductUploadUpdate = {
  gtin: string; // UUID of the order
  upload_percent: number; // Percentage of the upload completed
  providerId: string; // UUID of the provider
  message: string; // Status message (e.g., "Order Created")
};
