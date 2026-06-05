import { describe, expect, it } from "vitest";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { render, screen } from "@/test/test-utils";

describe("Avatar", () => {
  it("renders fallback initials", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("AB")).toBeInTheDocument();
  });
});
