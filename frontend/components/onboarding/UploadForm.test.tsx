import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UploadForm from "./UploadForm";

describe("UploadForm", () => {
  it("renders the multi-file upload drop-zone", () => {
    render(<UploadForm initialProfile={null} />);
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByText(/Drop your CSVs here/)).toBeInTheDocument();
  });
});
