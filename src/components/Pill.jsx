import { tipoMeta } from "../lib/constants";

export function Pill({ equipo }) {
  if (equipo.condicion === "baja")
    return <span className="px-2.5 py-1 rounded-md whitespace-nowrap bg-slate-200 text-slate-600" style={{ fontSize: 12 }}>Retirado</span>;
  const m = tipoMeta[equipo.ubicacion_tipo];
  return <span className={`px-2.5 py-1 rounded-md whitespace-nowrap ${m.pill}`} style={{ fontSize: 12 }}>{m.label}</span>;
}
