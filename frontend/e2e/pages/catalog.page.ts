import type { Page } from "@playwright/test";
import { COURT_TRAINER_TITLE } from "../constants";

export class CatalogPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/catalog");
  }

  heading() {
    return this.page.getByRole("heading", { name: "Product catalog" });
  }

  searchInput() {
    return this.page.getByPlaceholder("Search products…");
  }

  productLink(title: string = COURT_TRAINER_TITLE) {
    return this.page.getByRole("link", { name: new RegExp(title, "i") }).first();
  }

  async searchFor(query: string) {
    await this.searchInput().fill(query);
  }

  async openProduct(title: string = COURT_TRAINER_TITLE) {
    await this.productLink(title).click();
  }
}
