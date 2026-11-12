import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PracticeQuestion } from "./PracticeQuestion";

describe("PracticeQuestion", () => {
  it("uses the larger graph in Challenge mode", () => {
    const { container } = render(<PracticeQuestion learningMode="challenge" />);
    expect(container.querySelectorAll("circle[data-state]")).toHaveLength(8);
  });

  it("keeps Support practice on the standard graph layouts", () => {
    const { container } = render(<PracticeQuestion learningMode="support" />);
    const count = container.querySelectorAll("circle[data-state]").length;
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(6);
  });
});
