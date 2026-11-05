import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Printer, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { NAVY, AMBER, tipoMeta } from "../lib/constants";
import { qrSvg, urlEquipo } from "../lib/qr";

// Hoja de stickers tamaño carta de 3 columnas x 10 filas (tipo Avery 5160 / 8160)
const POR_HOJA = 30;

// Etiquetas QR para imprimir (solo admin). Se imprime con window.print(); los estilos de impresión están en index.css.
export function EtiquetasQR({ equipos }) {
  const [modo, setModo] = useState("todos"); // todos | categoria | ubicacion | manual
  const [categoria, setCategoria] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [query, setQuery] = useState("");
  const [marcados, setMarcados] = useState([]);

  const activos = useMemo(() => equipos.filter((e) => e.condicion !== "baja"), [equipos]);

  const categoriasUsadas = useMemo(
    () => [...new Set(activos.map((e) => e.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [activos],
  );

  // Opciones de ubicación: cada tipo completo y cada lugar dentro del tipo
  const ubicacionesUsadas = useMemo(() => {
    const ops = [];
    Object.entries(tipoMeta).forEach(([tipo, meta]) => {
      const delTipo = activos.filter((e) => e.ubicacion_tipo === tipo);
      if (!delTipo.length) return;
      ops.push([tipo, `${meta.loc} (todos)`]);
      [...new Set(delTipo.map((e) => e.ubicacion_detalle).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
        .forEach((d) => ops.push([`${tipo}|${d}`, `${meta.loc} — ${d}`]));
    });
    return ops;
  }, [activos]);

  const elegidos = useMemo(() => {
    if (modo === "todos") return activos;
    if (modo === "categoria") return categoria ? activos.filter((e) => e.categoria === categoria) : [];
    if (modo === "ubicacion") {
      if (!ubicacion) return [];
      const [tipo, detalle] = ubicacion.split("|");
      return activos.filter((e) => e.ubicacion_tipo === tipo && (detalle === undefined || e.ubicacion_detalle === detalle));
    }
    return activos.filter((e) => marcados.includes(e.id));
  }, [modo, categoria, ubicacion, marcados, activos]);

  const q = query.trim().toLowerCase();
  const visibles = modo === "manual"
    ? activos.filter((e) => !q || e.nombre.toLowerCase().includes(q) || (e.serie || "").toLowerCase().includes(q))
    : [];

  const toggle = (id) => setMarcados((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const hojas = Math.ceil(elegidos.length / POR_HOJA);

  const paginas = useMemo(() => {
    const ps = [];
    for (let i = 0; i < elegidos.length; i += POR_HOJA) ps.push(elegidos.slice(i, i + POR_HOJA));
    return ps;
  }, [elegidos]);

  const modos = [["todos", "Todos"], ["categoria", "Por categoría"], ["ubicacion", "Por ubicación"], ["manual", "Escoger uno por uno"]];
  const selectCls = "w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 pr-8 text-slate-700";

  return (
    <div className="mt-3">
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <div className="text-slate-400 mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Qué equipos imprimir</div>
        <div className="grid grid-cols-2 gap-2">
          {modos.map(([k, l]) => (
            <button key={k} onClick={() => setModo(k)}
              className={`rounded-lg border px-3 ${modo === k ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200"}`}
              style={{ minHeight: 44, fontSize: 14, ...(modo === k ? { background: NAVY } : {}) }}>{l}</button>
          ))}
        </div>

        {modo === "categoria" && (
          <div className="relative mt-3">
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={selectCls} style={{ height: 48, fontSize: 15 }}>
              <option value="">Escoge una categoría…</option>
              {categoriasUsadas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={16} className="text-slate-400 absolute right-2.5 pointer-events-none" style={{ top: 16 }} />
          </div>
        )}

        {modo === "ubicacion" && (
          <div className="relative mt-3">
            <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className={selectCls} style={{ height: 48, fontSize: 15 }}>
              <option value="">Escoge una ubicación…</option>
              {ubicacionesUsadas.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <ChevronDown size={16} className="text-slate-400 absolute right-2.5 pointer-events-none" style={{ top: 16 }} />
          </div>
        )}

        {modo === "manual" && (
          <div className="mt-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3" style={{ height: 48 }}>
              <Search size={18} className="text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o serie"
                className="flex-1 outline-none text-slate-800 bg-transparent" style={{ fontSize: 16 }} />
            </div>
            <div className="flex items-center justify-between mt-2 px-1" style={{ fontSize: 13 }}>
              <button className="text-slate-600 underline" onClick={() => setMarcados((p) => [...new Set([...p, ...visibles.map((e) => e.id)])])}>Marcar los visibles</button>
              <button className="text-slate-600 underline" onClick={() => setMarcados([])}>Quitar todos</button>
            </div>
            <div className="mt-2 flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 360 }}>
              {visibles.length === 0 && <div className="text-center text-slate-400 text-sm py-6">No hay equipos que coincidan.</div>}
              {visibles.map((e) => {
                const on = marcados.includes(e.id);
                return (
                  <button key={e.id} onClick={() => toggle(e.id)}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2 text-left"
                    style={{ borderColor: on ? NAVY : "#e2e8f0", background: on ? "#eef1f6" : "#fff" }}>
                    {on ? <CheckCircle2 size={20} style={{ color: NAVY }} /> : <Circle size={20} className="text-slate-300" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 truncate" style={{ fontSize: 14 }}>{e.nombre}</div>
                      <div className="text-slate-400 truncate" style={{ fontSize: 12 }}>{e.serie || "Sin serie"} · {e.categoria}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mt-3">
        <div className="text-slate-700" style={{ fontSize: 14 }}>
          {elegidos.length === 0
            ? "No hay equipos escogidos."
            : <><b>{elegidos.length}</b> {elegidos.length === 1 ? "etiqueta" : "etiquetas"} · {hojas} {hojas === 1 ? "hoja" : "hojas"} de {POR_HOJA} (3 × 10, tamaño carta)</>}
        </div>
        <button disabled={!elegidos.length} onClick={() => window.print()}
          className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-3"
          style={{ minHeight: 52, fontSize: 16, background: elegidos.length ? AMBER : "#d8dbe1", color: elegidos.length ? NAVY : "#9aa0ab" }}>
          <Printer size={19} /> Imprimir / Guardar PDF
        </button>
        <div className="text-slate-400 mt-2" style={{ fontSize: 12 }}>
          En el diálogo de imprimir usa papel tamaño carta, escala 100 % y márgenes "Ninguno". Para PDF, escoge "Guardar como PDF".
        </div>
      </div>

      {createPortal(
        <div className="etiquetas-print">
          {paginas.map((pag, i) => (
            <div key={i} className="etiquetas-hoja">
              {pag.map((e) => (
                <div key={e.id} className="etiqueta">
                  <div className="etiqueta-qr" dangerouslySetInnerHTML={{ __html: qrSvg(urlEquipo(e.id)) }} />
                  <div className="etiqueta-texto">
                    <div className="etiqueta-nombre">{e.nombre}</div>
                    <div className="etiqueta-serie">{e.serie || "S/N"}</div>
                    <div className="etiqueta-marca">ETS Corp</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
