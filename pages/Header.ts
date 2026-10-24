import { Page, Locator } from '@playwright/test';

/** The shop header, shared by every page: tells us whether a customer is signed in. */
export class Header {
  readonly signOutLink: Locator;

  constructor(private readonly page: Page) {
    this.signOutLink = page.getByRole('link', { name: 'Sign out' });
  }

  customerName(firstName: string, lastName: string): Locator {
    return this.page.getByText(`${firstName} ${lastName}`);
  }
}
