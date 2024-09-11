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

export function transformPolygonToLocation(value: any): any {
  if (value && value.polygon) {
    return { ...value, location: value.polygon };
  }
  return value;
}

export function transformLocationToPolygon(value: any): any {
  if (value && value.location) {
    return { ...value, polygon: value.location };
  }
  return value;
}
