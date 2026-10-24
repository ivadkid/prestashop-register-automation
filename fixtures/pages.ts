import { test as base, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { Header } from '../pages/Header';

type Fixtures = {
  shopUrl: string;
  registerPage: RegisterPage;
  header: Header;
};

export const test = base.extend<Fixtures>({
  shopUrl: async ({ page }, use) => {
    // demo.prestashop.com is a marketing page that embeds the real storefront in an
    // iframe, behind a subdomain assigned at runtime (e.g. bloody-arithmetic.demo.prestashop.com).
    // Each test resolves its own instance here: access to an instance is tied to the
    // browser session that requested it, so it can't be shared between tests.
    await page.goto('https://demo.prestashop.com/');
    // The iframe's src is populated a couple of seconds after load, once the page's
    // own script assigns a demo instance — and it's set as a JS property, not an HTML
    // attribute, so getAttribute('src') would read null even after it's populated.
    await page.waitForFunction(() => {
      const iframe = document.querySelector<HTMLIFrameElement>('#framelive');
      return !!iframe?.src;
    });
    const iframeSrc = await page
      .locator('#framelive')
      .evaluate((el: HTMLIFrameElement) => el.src);
    await use(new URL(iframeSrc).origin);
  },

  registerPage: async ({ page, shopUrl }, use) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto(shopUrl);
    await use(registerPage);
  },

  header: async ({ page }, use) => {
    await use(new Header(page));
  },
});

export { expect };
