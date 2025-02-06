import { Transform } from 'class-transformer';

const optionalBooleanMapper = new Map<string, boolean | undefined>([
  ['true', true],
  ['false', false],
  ['undefined', undefined], // Handles explicit 'undefined' string cases
  [undefined, undefined], // Handles actual `undefined` values
  [null, undefined], // Handles `null` values
]);

export const ParseOptionalBoolean = () =>
  Transform(({ value }) =>
    typeof value === 'boolean' ? value : optionalBooleanMapper.get(value),
  );
