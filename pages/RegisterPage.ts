import { Page, Locator, expect } from '@playwright/test';
import { RegistrationUser } from '../fixtures/test-data';

export class RegisterPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly privacyCheckbox: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Create an account' });
    this.firstNameInput = page.locator('#field-firstname');
    this.lastNameInput = page.locator('#field-lastname');
    this.emailInput = page.locator('#field-email');
    this.passwordInput = page.locator('#field-password');
    this.termsCheckbox = page.locator('#field-psgdpr');
    this.privacyCheckbox = page.locator('#field-customer_privacy');
    this.submitButton = page.getByRole('button', { name: 'Create account' });
  }

  async goto(shopUrl: string) {
    await this.page.goto(`${shopUrl}/registration`);
    // Fail fast with a clear message if the demo instance is down (it sometimes answers
    // 502 Bad Gateway), instead of the next step timing out on a missing form.
    await expect(this.heading, 'registration page should load').toBeVisible();
  }

  async fillForm(user: RegistrationUser) {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
  }

  async agreeToRequiredTerms() {
    await this.termsCheckbox.check();
    await this.privacyCheckbox.check();
  }

  async submit() {
    await this.submitButton.click();
  }

  async register(user: RegistrationUser) {
    await this.fillForm(user);
    await this.agreeToRequiredTerms();
    await this.submit();
  }

  /** The browser's validation message for a field (empty string when the field is valid). */
  async validationMessageOf(field: Locator): Promise<string> {
    return field.evaluate((el: HTMLInputElement) => el.validationMessage.trim());
  }

  /**
   * The server-side error shown under a given field after submitting.
   * Each field lives in its own `.mb-3` wrapper, and its error is rendered inside it.
   */
  errorFor(field: Locator): Locator {
    return this.page.locator('.mb-3').filter({ has: field }).getByRole('alert');
  }
}
