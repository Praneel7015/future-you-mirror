import type { CSSProperties, ReactNode } from "react";

/** Clears the iPhone notch and home indicator without shrinking the type. */
export const mirrorSafeStyle: CSSProperties = {
  paddingTop: "max(64px, env(safe-area-inset-top))",
  paddingBottom: "max(48px, calc(env(safe-area-inset-bottom) + 24px))",
};

export function MirrorFrame({
  children,
  className = "",
  style,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  wide?: boolean;
}) {
  return (
    <div
      className={`flex-1 flex flex-col px-6 w-full min-h-dvh ${wide ? "" : "max-w-md mx-auto"} ${className}`}
      style={{ ...mirrorSafeStyle, ...style }}
    >
      {children}
    </div>
  );
}
