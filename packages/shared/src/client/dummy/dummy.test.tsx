import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, test } from "vitest";
import { Dummy } from "./dummy";

describe.concurrent("dummy", () => {
  afterEach(cleanup);

  test("Dummy test - test if renders without errors", ({ expect }) => {
    const clx = "my-class";
    render(<Dummy className={clx} />);
    expect(screen.getByTestId("dummy").classList).toContain(clx);
  });
});
