import { HTMLProps, ReactNode } from "react";

interface DummyProps extends HTMLProps<HTMLDivElement> {
  children: ReactNode;
}

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
