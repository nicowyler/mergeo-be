import { Point } from 'typeorm';

export function convertCoordinatesForPostGIS(coordinates: number[]): Point {
  if (coordinates.length !== 2) {
    throw new Error(
      'Coordinates must have exactly two elements: [longitude, latitude]',
    );
  }

  return {
    type: 'Point',
    coordinates: [coordinates[1], coordinates[0]] as [number, number], // Ensure it's a tuple
  };
}
