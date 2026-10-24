export interface RegistrationUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Builds a valid registration payload with a unique email per call, so repeated
 * (and parallel) runs never collide on "email already used".
 * Pass overrides to deliberately break one field for negative tests.
 */
export function createUniqueUser(overrides: Partial<RegistrationUser> = {}): RegistrationUser {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `playwright.test.${unique}@example.com`,
    // Long and non-dictionary on purpose: the shop enforces a minimum password strength.
    password: 'Str0ng!Passw0rd#2026',
    ...overrides,
  };
}

/** Rejected by the shop's password-strength policy (it is in the common-passwords list). */
export const WEAK_PASSWORD = 'password1';

/** First/last name only allow letters, dots and spaces. */
export const NAME_WITH_DIGITS = 'Test123';
