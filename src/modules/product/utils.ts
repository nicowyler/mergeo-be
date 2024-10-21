// Conversion map for various units
const unitConversionMap = {
  grams: {
    grams: 1,
    kilograms: 1000, // 1 kilogram = 1000 grams
    milligrams: 0.001, // 1 milligram = 0.001 grams
  },
  liters: {
    liters: 1,
    milliliters: 1000, // 1 liter = 1000 milliliters
    cubicCentimeters: 1000, // 1 liter = 1000 cubic centimeters (cc2)
  },
  milliliters: {
    milliliters: 1,
    liters: 0.001, // 1 milliliter = 0.001 liters
    cubicCentimeters: 1, // 1 milliliter = 1 cubic centimeter (cc2)
  },
  cubicCentimeters: {
    cubicCentimeters: 1, // 1 cc2 = 1 cubic centimeter
    liters: 0.001, // 1 cc2 = 0.001 liters
    milliliters: 1, // 1 cc2 = 1 milliliter
  },
  kilograms: {
    kilograms: 1,
    grams: 1000, // 1 kilogram = 1000 grams
    milligrams: 1000000, // 1 kilogram = 1,000,000 milligrams
  },
  milligrams: {
    milligrams: 1,
    grams: 0.001, // 1 milligram = 0.001 grams
    kilograms: 0.000001, // 1 milligram = 0.000001 kilograms
  },
  // Add other units as needed
};

export function getConvertedPricePerUnit(
  productUnit: string, // Product's unit of measurement
  productPrice: number, // Product's price
  unitConversionFactor: number, // Conversion factor (or quantity)
  baseUnit: string, // Base unit for comparison (e.g., grams)
): number | null {
  const validConversions = {
    mass: ['grams', 'g', 'kilograms', 'kg'],
    volume: [
      'liters',
      'l',
      'milliliters',
      'ml',
      'cubic centimeters',
      'cm³',
      'cc',
    ],
    pieces: ['pieces', 'pcs'],
  };

  // Helper to find which group the unit belongs to
  function findUnitType(unit: string) {
    for (const [type, units] of Object.entries(validConversions)) {
      if (units.includes(unit.toLowerCase())) {
        return type;
      }
    }
    return null; // Return null if the unit type is not found
  }

  const productUnitType = findUnitType(productUnit);
  const baseUnitType = findUnitType(baseUnit);

  // If either unit type is not found or they are incompatible, return null
  if (
    productUnitType === null ||
    baseUnitType === null ||
    productUnitType !== baseUnitType // Different types, like mass vs volume
  ) {
    return null; // Ignore this product if units are incompatible
  }

  // Conversion logic for compatible units
  let conversionRate = 1;

  // Handle mass conversion
  if (
    productUnit.toLowerCase() === 'grams' &&
    baseUnit.toLowerCase() === 'kilograms'
  ) {
    conversionRate = 0.001; // 1000 grams in a kilogram
  } else if (
    productUnit.toLowerCase() === 'kilograms' &&
    baseUnit.toLowerCase() === 'grams'
  ) {
    conversionRate = 1000; // 1 kilogram is 1000 grams
  }

  // Handle volume conversion
  else if (
    productUnit.toLowerCase() === 'liters' &&
    baseUnit.toLowerCase() === 'milliliters'
  ) {
    conversionRate = 1000; // 1 liter is 1000 milliliters
  } else if (
    productUnit.toLowerCase() === 'milliliters' &&
    baseUnit.toLowerCase() === 'liters'
  ) {
    conversionRate = 0.001; // 1000 milliliters in a liter
  } else if (
    productUnit.toLowerCase() === 'milliliters' &&
    baseUnit.toLowerCase() === 'cubic centimeters'
  ) {
    conversionRate = 1; // 1 milliliter is 1 cubic centimeter
  } else if (
    productUnit.toLowerCase() === 'cubic centimeters' &&
    baseUnit.toLowerCase() === 'milliliters'
  ) {
    conversionRate = 1; // 1 cubic centimeter is 1 milliliter
  } else if (
    productUnit.toLowerCase() === 'liters' &&
    baseUnit.toLowerCase() === 'cubic centimeters'
  ) {
    conversionRate = 1000; // 1 liter is 1000 cubic centimeters
  } else if (
    productUnit.toLowerCase() === 'cubic centimeters' &&
    baseUnit.toLowerCase() === 'liters'
  ) {
    conversionRate = 0.001; // 1000 cubic centimeters in a liter
  }

  // Calculate the price per base unit
  const pricePerBaseUnit =
    (productPrice / unitConversionFactor) * conversionRate;

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
