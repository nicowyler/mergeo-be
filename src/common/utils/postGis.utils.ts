import { Point, Polygon } from 'typeorm';

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

export function transformToGeoJSON(polygonInput: Polygon): any {
  const coordinates = polygonInput.coordinates;

  if (!coordinates || coordinates.length < 3) {
    throw new Error('A polygon must have at least three coordinates.');
  }

  // Transform coordinates to [longitude, latitude] format and ensure the polygon is closed
  const transformedCoordinates = coordinates.map((coord) => [
    coord[1],
    coord[0],
  ]);

  // Close the polygon by repeating the first coordinate at the end
  if (
    transformedCoordinates[0][0] !==
      transformedCoordinates[transformedCoordinates.length - 1][0] ||
    transformedCoordinates[0][1] !==
      transformedCoordinates[transformedCoordinates.length - 1][1]
  ) {
    transformedCoordinates.push(transformedCoordinates[0]);
  }

  // Return the valid GeoJSON format
  return {
    type: 'Polygon',
    coordinates: [transformedCoordinates], // Wrap the coordinates in an array to fit GeoJSON Polygon spec
  };
}
