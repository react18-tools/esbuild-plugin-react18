import { HTMLProps } from "react";

interface DummyProps extends HTMLProps<HTMLDivElement> {}

/**
 *
 *
 * @example
 * ```tsx
 * <Dummy />
 * ```
 *
 * @source - Source code
 */
export function Dummy({ children, ...props }: DummyProps) {
  return (
    <div {...props} data-testid="dummy">
      {children}
    </div>
  );
}
