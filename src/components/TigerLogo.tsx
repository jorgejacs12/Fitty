import type { JSX } from "react";
import tigerSrc from "../assets/tiger-logo.png";

export function TigerLogo({ size = 40 }: { size?: number }): JSX.Element {
  return (
    <img
      src={tigerSrc}
      alt="Fitty tiger logo"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0, objectFit: "contain", borderRadius: size * 0.18 }}
    />
  );
}
