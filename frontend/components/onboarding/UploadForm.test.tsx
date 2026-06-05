import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UploadForm from "./UploadForm";

describe("UploadForm", () => {
  it("renders upload controls for contract files", () => {
    render(<UploadForm />);
    expect(screen.getByRole("button", { name: "Upload & analyse" })).toBeInTheDocument();
    expect(screen.getByText("products.csv")).toBeInTheDocument();
  });
});
