const addHours = (hours: number) => {
  const date = new Date();
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return date;
};

export const DateUtils = { addHours };

/**
 * Calculates a deadline as both a Date object and seconds from now.
 * @param TimeToAdd
 * @param hours - The number of hours from now for the deadline
 * @param minutes - The number of minutes from now for the deadline
 * @param seconds - The number of seconds from now for the deadline
 * @returns An object containing both the Date object and the deadline in seconds
 */
type TimeToAdd = {
  h?: number;
  m?: number;
  s?: number;
};

export function calculateDeadline({ h = 0, m = 0, s = 0 }: TimeToAdd): Date {
  const now = new Date();
  const millisecondsToAdd = h * 3600000 + m * 60000 + s * 1000;
  return new Date(now.getTime() + millisecondsToAdd);
}
