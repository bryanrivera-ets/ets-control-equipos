import { useMemo } from "react";
import { qrSvg } from "../lib/qr";

// Muestra un código QR (SVG) del tamaño indicado
export function QrImage({ texto, size, className = "", style }) {
  const svg = useMemo(() => qrSvg(texto), [texto]);
  return (
    <div className={className} style={{ width: size, height: size, lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
