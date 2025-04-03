export async function getConvertedPricePerUnit(
  validUnits: string[],
  productUnit: string, // Product's unit of measurement
  finalPrice: number, // Final price for the product
  unitConversionFactor: number, // Net content of the product
  baseUnit: string, // Base unit for comparison (e.g., kg, l)
  netContent: number, // Net content amount
): Promise<number | null> {
  // Helper function to normalize unit
  function normalizeUnit(inputUnit: string): string | null {
    const lowerInputUnit = inputUnit.toLowerCase();
    return (
      validUnits.find((unit) => unit.toLowerCase() === lowerInputUnit) || null
    );
  }

  const normalizedProductUnit = normalizeUnit(productUnit);
  const normalizedBaseUnit = normalizeUnit(baseUnit);

  // If either unit is not recognized, return null
  if (!normalizedProductUnit || !normalizedBaseUnit) {
    return null;
  }

  // Define conversion rates for standard units
  const conversionRates: Record<string, number> = {
    GR: 0.001, // grams → kg
    ML: 0.001, // ml → liters
    CC: 0.001, // cubic cm → liters
    KG: 1, // kg → kg (no conversion)
    L: 1, // liters → liters (no conversion)
    UN: 1, // units stay the same
    PC: 1, // pieces stay the same
  };

  // Convert net content to the base unit
  let netContentInBaseUnit = netContent * unitConversionFactor;

  // Perform conversion if needed
  if (normalizedProductUnit !== normalizedBaseUnit) {
    if (
      conversionRates[normalizedProductUnit] &&
      conversionRates[normalizedBaseUnit]
    ) {
      netContentInBaseUnit *=
        conversionRates[normalizedProductUnit] /
        conversionRates[normalizedBaseUnit];
    } else {
      return null; // Units are incompatible
    }
  }

  // Prevent division by zero
  if (netContentInBaseUnit === 0) {
    return null;
  }

  // Calculate and return price per base unit
  return finalPrice / netContentInBaseUnit;
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

export function cleanProducts<T>({
  rawProducts,
  keyMappings,
  keysToRemove,
}: {
  rawProducts: T[];
  keyMappings?: Record<string, string>;
  keysToRemove?: string[];
}): T[] {
  keyMappings = keyMappings || {};
  keysToRemove = keysToRemove || [];
  return rawProducts.map((raw) => {
    const cleanedData = Object.keys(raw).reduce((acc, key) => {
      // Step 1: Remove "product_" prefix
      let newKey = key.startsWith('product_')
        ? key.replace('product_', '')
        : key;

      // Step 2: Convert snake_case to camelCase
      newKey = newKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

      // Step 3: Apply key mapping if exists
      newKey = keyMappings[newKey] || newKey;

      acc[newKey] = raw[key];
      return acc;
    }, {} as Record<string, any>);

    // Step 4: Remove specified keys
    keysToRemove.forEach((key) => delete cleanedData[key]);

    // Step 5: Convert to class instance
    return cleanedData as T;
  });
}
