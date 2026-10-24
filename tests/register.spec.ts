import { test, expect } from '../fixtures/pages';
import { createUniqueUser, WEAK_PASSWORD, NAME_WITH_DIGITS } from '../fixtures/test-data';

test.describe('Registration', () => {
  test('a visitor can register with valid details and is signed in afterwards', { tag: '@smoke' }, async ({ page, registerPage, header }) => {
    const user = createUniqueUser();

    await registerPage.register(user);

    await expect(page).not.toHaveURL(/\/registration/);
    await expect(header.signOutLink).toBeVisible();
    await expect(header.customerName(user.firstName, user.lastName)).toBeVisible();
  });

  test('registering with an email that already has an account is rejected', async ({ context, shopUrl, registerPage, header }) => {
    const user = createUniqueUser();
    await registerPage.register(user);
    await expect(header.signOutLink).toBeVisible();

    // Come back as a new, anonymous visitor. We drop the shop's session cookie instead
    // of clicking "Sign out", because on this demo signing out recycles the whole
    // shop instance (it answers 502 and redirects to a fresh store without our account).
    await context.clearCookies({ name: /^PrestaShop-/ });
    await registerPage.goto(shopUrl);
    await registerPage.register(createUniqueUser({ email: user.email }));

    await expect(registerPage.errorFor(registerPage.emailInput)).toContainText('The email is already used');
    await expect(registerPage.heading).toBeVisible();
    await expect(header.signOutLink).toBeHidden();
  });

  test('a weak password is rejected by the password policy', async ({ page, registerPage, header }) => {
    await registerPage.fillForm(createUniqueUser({ password: WEAK_PASSWORD }));
    await registerPage.agreeToRequiredTerms();

    // The shop's strength meter checks the password as it is typed and marks the field
    // invalid, which stops the browser from submitting the form.
    await expect.poll(() => registerPage.validationMessageOf(registerPage.passwordInput)).toBe('Your password is too weak');
    await expect(page.getByText('The minimum score must be: Strong')).toBeVisible();

    await registerPage.submit();

    await expect(registerPage.heading).toBeVisible();
    await expect(header.signOutLink).toBeHidden();
  });

  const nameFields = [
    { field: 'firstName', label: 'first name' },
    { field: 'lastName', label: 'last name' },
  ] as const;

  for (const { field, label } of nameFields) {
    test(`a ${label} containing digits is rejected as invalid format`, async ({ registerPage, header }) => {
      await registerPage.register(createUniqueUser({ [field]: NAME_WITH_DIGITS }));

      const input = field === 'firstName' ? registerPage.firstNameInput : registerPage.lastNameInput;
      await expect(registerPage.errorFor(input)).toContainText('Invalid format.');
      await expect(registerPage.heading).toBeVisible();
      await expect(header.signOutLink).toBeHidden();
    });
  }

  test('the form cannot be submitted without accepting the terms and conditions', async ({ registerPage, header }) => {
    await registerPage.fillForm(createUniqueUser());
    await registerPage.privacyCheckbox.check();
    await registerPage.submit();

    // The checkbox is a required field, so the browser itself blocks the submit.
    const termsMissing = await registerPage.termsCheckbox.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(termsMissing).toBe(true);
    await expect(registerPage.heading).toBeVisible();
    await expect(header.signOutLink).toBeHidden();
  });
});
