import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';

@Injectable()
export class MockProductsService {
  private mockData: any[] = [];
  private readonly logger = new Logger(MockProductsService.name);

  constructor() {
    this.loadMockData();
  }

  // Load the XLSX file into memory
  private loadMockData() {
    const filePath = path.join(__dirname, '../../../data/MOCK_DATA.xlsx');

    try {
      const fileBuffer = fs.readFileSync(filePath); // Read the file as a buffer
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' }); // Parse the buffer into a workbook
      const sheetName = workbook.SheetNames[0]; // Get the first sheet
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]); // Convert sheet to JSON

      this.mockData = sheetData; // Store the JSON data in mockData
      this.logger.log('Mock data loaded successfully.');
    } catch (error) {
      this.logger.error(
        `Failed to load mock data: ${error.message}`,
        error.stack,
      );
    }
  }

  // Search products in the mock data
  async searchProducts(name?: string, brand?: string) {
    if (!name && !brand) {
      return [];
    }

    const results = this.mockData.filter((product) => {
      const matchesName =
        name &&
        product.name &&
        product.name.toLowerCase().includes(name.toLowerCase());
      const matchesBrand =
        brand &&
        product.brand &&
        product.brand.toLowerCase().includes(brand.toLowerCase());

      return (name ? matchesName : true) && (brand ? matchesBrand : true);
    });

    return results;
  }
}
