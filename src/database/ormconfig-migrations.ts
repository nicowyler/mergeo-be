import { DataSource } from 'typeorm'; // Import DataSource
import { dataSource } from './data-source';

export const dataSourceInstance = new DataSource(dataSource); // Create the instance
