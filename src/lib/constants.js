import {
  Zap, Droplets, Cog, Flame, Hammer, Gauge, Wrench, Activity, Warehouse, HardHat, Truck,
} from "lucide-react";

export const NAVY = "#16233a";
export const NAVY_SOFT = "#9fb0c9";
export const AMBER = "#e8a13a";
export const FONT = "system-ui, sans-serif";
export const WRAP = "mx-auto w-full max-w-2xl";
export const SAFE_TOP = "calc(16px + env(safe-area-inset-top))";

export const tipoMeta = {
  almacen:  { loc: "Almacén",  label: "Disponible",    pill: "bg-green-100 text-green-800", dot: "#639922", Icon: Warehouse },
  proyecto: { loc: "Proyecto", label: "En proyecto",   pill: "bg-blue-100 text-blue-800",   dot: "#378ADD", Icon: HardHat },
  camion:   { loc: "Camión",   label: "En camión",     pill: "bg-amber-100 text-amber-800", dot: "#EF9F27", Icon: Truck },
  taller:   { loc: "Taller",   label: "Mantenimiento", pill: "bg-red-100 text-red-800",     dot: "#E24B4A", Icon: Wrench },
};

export const catIcon = {
  Generador: Zap, Bomba: Droplets, Mezcladora: Cog, Soldadora: Flame,
  Compactadora: Cog, Herramienta: Hammer, Compresor: Gauge,
  Cortadora: Wrench, Vibrador: Activity,
};
export const CATEGORIAS = Object.keys(catIcon);

export const MAX_DOCS = 5;

export const TIPOS_VEH = { camion: "Camión", pickup: "Pickup", van: "Van", otro: "Otro" };
export const TIPOS_MANT = ["Cambio de aceite", "Gomas", "Frenos", "Batería", "Filtros", "Reparación", "Inspección / Marbete", "Otro"];
