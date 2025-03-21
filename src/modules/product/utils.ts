export function getConvertedPricePerUnit(
  validUnits: string[], // List of valid units
  productUnit: string, // Product's unit of measurement
  finalPrice: number, // Final price for the product
  unitConversionFactor: number, // Net content of the product (i.e., the quantity)
  baseUnit: string, // Base unit for comparison (e.g., kg, l)
  netConentent: number, // Net content of the product (i.e., the quantity)
): number | null {
  const BaseUnits = {
    kg: 'kg',
    gr: 'gr',
    l: 'l',
    ml: 'ml',
    cc: 'cc',
    pc: 'pc',
  };

  // Helper function to find the unit type from valid units
  function findUnitType(unit: string) {
    for (const [type, units] of Object.entries(validUnits)) {
      if (units.includes(unit)) {
        return type;
      }
    }
    return null; // Return null if the unit type is not found
  }

  const productUnitType = findUnitType(productUnit);

  // If either unit type is not found or they are incompatible, return null
  if (productUnitType === null) {
    return null; // Ignore this product if units are incompatible
  }

  // Convert net content to the base unit (kg or l)
  let netContentInBaseUnit = unitConversionFactor * netConentent;

  if (baseUnit === 'kg' && productUnit.toLowerCase() === BaseUnits.gr) {
    netContentInBaseUnit = unitConversionFactor / 1000; // Convert grams to kilograms
  } else if (baseUnit === 'l' && productUnit.toLowerCase() === BaseUnits.ml) {
    netContentInBaseUnit = unitConversionFactor / 1000; // Convert milliliters to liters
  } else if (baseUnit === 'l' && productUnit.toLowerCase() === BaseUnits.cc) {
    netContentInBaseUnit = unitConversionFactor / 1000; // Convert cubic centimeters to liters
  }

  // Calculate the price per base unit (final price divided by the content in base unit)
  const pricePerBaseUnit = finalPrice / netContentInBaseUnit;

  return pricePerBaseUnit;
}

// Helper function to normalize day names
export function dayNameToNumber(day: string): number | undefined {
  // Normalize the day name by removing accents and converting to lowercase
  const normalizedDay = day
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Mapping of normalized day names to numbers
  const dayToNumberMap: { [key: string]: number } = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };

  // Return the corresponding day number or undefined if not found
  return dayToNumberMap[normalizedDay];
}
/**
 * Utility function to get the date for a given day of the week from today.
 * @param dayOfWeek The numeric day of the week (0 for Sunday, 1 for Monday, etc.)
 * @param referenceDate The starting date to calculate from (default: today)
 * @returns {Date} The Date object for the next occurrence of the given day of the week.
 */
function getNextDateForDayOfWeek(
  dayOfWeek: number,
  referenceDate: Date = new Date(),
): Date {
  const currentDayOfWeek = referenceDate.getDay(); // Current day (0-6, Sun-Sat)
  const dayDifference = (dayOfWeek - currentDayOfWeek + 7) % 7; // Days to add
  const targetDate = new Date(referenceDate);
  targetDate.setDate(targetDate.getDate() + dayDifference); // Calculate target date
  return targetDate;
}

/**
 * Utility function to get the formatted date string for the next occurrence of a given day of the week.
 * @param dayOfWeekStart The numeric day of the week to start (0 for Sunday, 1 for Monday, etc.)
 * @param dayOfWeekEnd The numeric day of the week to end (0 for Sunday, 1 for Monday, etc.)
 * @returns An object containing the start and end dates as ISO strings.
 */
export function getDateRangeForDays(
  dayOfWeekStart: number,
  dayOfWeekEnd: number,
) {
  const startDate = getNextDateForDayOfWeek(dayOfWeekStart);
  const endDate = getNextDateForDayOfWeek(dayOfWeekEnd);

  return {
    startDateFormatted: startDate.toISOString(),
    endDateFormatted: endDate.toISOString(),
  };
}
