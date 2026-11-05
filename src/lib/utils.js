import { tipoMeta } from "./constants";

export const fmtFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-PR", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit" })
  );
};

export const formatUbic = (tipo, detalle) => (tipo ? `${tipoMeta[tipo].loc} — ${detalle}` : "—");

export const diasEn = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso)) / 86400000)) : null);

export const textoDias = (d) => (d === null ? "" : d === 0 ? "hoy" : d === 1 ? "1 día" : `${d} días`);

export const fechaCorta = (iso) => {
  const d = typeof iso === "string" && iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString("es-PR", { day: "2-digit", month: "short", year: "numeric" });
};

export const comprimirFoto = async (file, maxW = 1200, calidad = 0.8) => {
  const bmp = await createImageBitmap(file);
  const esc = Math.min(1, maxW / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * esc);
  c.height = Math.round(bmp.height * esc);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob(r, "image/jpeg", calidad));
};

export const servicioVencido = (e) =>
  e.ultimo_servicio && e.intervalo_servicio_dias
    ? diasEn(e.ultimo_servicio) > e.intervalo_servicio_dias
    : false;
