import QRCode from "qrcode";

// Enlace que va dentro del QR de cada equipo
export const urlEquipo = (id) => `${window.location.origin}/#equipo=${id}`;

// Saca el id del equipo de un texto o enlace con "#equipo=<id>". Devuelve null si no es de esta app.
export const idDesdeTexto = (texto) => {
  const m = /#equipo=([^&\s]+)/.exec(texto || "");
  return m ? decodeURIComponent(m[1]) : null;
};

// Id del equipo en la dirección actual (cuando se abre la app desde un QR)
export const leerEquipoDeHash = () => idDesdeTexto(window.location.hash);

// Quita "#equipo=..." de la dirección sin recargar la página
export const limpiarHashEquipo = () => {
  if (idDesdeTexto(window.location.hash)) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
};

// Genera el QR como SVG (texto) de forma inmediata, para poder imprimir muchas etiquetas a la vez
export const qrSvg = (texto, margen = 1) => {
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: "M" });
  const n = modules.size;
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.data[y * n + x]) d += `M${x + margen} ${y + margen}h1v1h-1z`;
    }
  }
  const t = n + margen * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="100%" height="100%" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
};
