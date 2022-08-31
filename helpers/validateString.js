import validator from 'validator';

export function validateString(string) {
  const status = validator.isLowercase(string) && validator.isAlpha(string);
  return status;
}
