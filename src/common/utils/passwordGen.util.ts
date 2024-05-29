export function passwordGen(length = 12): string {
  const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialCharacters = '!@#$%^&*()_+[]{}|;:,.<>?';

  const allCharacters =
    uppercaseLetters + lowercaseLetters + numbers + specialCharacters;

  let password = '';

  // Ensure at least one character from each character set
  password += uppercaseLetters.charAt(
    Math.floor(Math.random() * uppercaseLetters.length),
  );
  password += lowercaseLetters.charAt(
    Math.floor(Math.random() * lowercaseLetters.length),
  );
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specialCharacters.charAt(
    Math.floor(Math.random() * specialCharacters.length),
  );

  // Fill the rest of the password length with random characters from all sets
  for (let i = password.length; i < length; i++) {
    password += allCharacters.charAt(
      Math.floor(Math.random() * allCharacters.length),
    );
  }

  // Shuffle the password to ensure randomness
  return shufflePassword(password);
}

function shufflePassword(password: string): string {
  const array = password.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
}
