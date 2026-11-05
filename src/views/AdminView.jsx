import { useState } from "react";
import {
  Plus, Loader2, Trash2,
} from "lucide-react";
import { NAVY, AMBER, WRAP } from "../lib/constants";
import { SubHeader } from "../components/SubHeader";

export function AdminView({ ubicaciones, categorias, onBack, onAdd, onDelete, onAddCategoria, onDeleteCategoria, soloProyectos = false }) {
  const [tab, setTab] = useState("proyecto");
  const [nuevo, setNuevo] = useState("");
  const [delId, setDelId] = useState(null);
  const [busy, setBusy] = useState(false);

  const todasTabs = [["proyecto", "Proyectos"], ["brigada", "Brigadas"], ["camion", "Camiones"], ["almacen", "Estantes"], ["categoria", "Categorías"]];
  const tabs = soloProyectos ? todasTabs.filter(([k]) => k === "proyecto") : todasTabs;
  const esCategoria = tab === "categoria";
  const items = esCategoria ? categorias : ubicaciones.filter((u) => u.tipo === tab);
  const nombreTab = tabs.find(([k]) => k === tab)[1];
  const duplicado = items.some((i) => i.nombre.trim().toLowerCase() === nuevo.trim().toLowerCase());
  const puedeAgregar = nuevo.trim() && !duplicado && !busy;

  const agregar = async () => {
    setBusy(true);
    if (esCategoria) await onAddCategoria(nuevo.trim());
    else await onAdd(tab, nuevo.trim());
    setNuevo(""); setBusy(false);
  };

  const eliminar = (id) => (esCategoria ? onDeleteCategoria(id) : onDelete(id));

  return (
    <div className="flex-1 pb-28">
      <SubHeader title={soloProyectos ? "Proyectos" : "Administración"} onBack={onBack} />
      <div className={`${WRAP} p-4`}>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setNuevo(""); setDelId(null); }}
              className={`px-3.5 py-2 rounded-full whitespace-nowrap border ${tab === k ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200"}`}
              style={{ fontSize: 13, ...(tab === k ? { background: NAVY } : {}) }}>{l}</button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 mt-3">
          <div className="text-slate-400 mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Añadir a {nombreTab}</div>
          <div className="flex gap-2">
            <input value={nuevo} onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && puedeAgregar && agregar()}
              placeholder={tab === "proyecto" ? "Ej. Plaza Caguas" : tab === "brigada" ? "Ej. Brigada E" : tab === "camion" ? "Ej. Camión 06" : esCategoria ? "Ej. Vacuum" : "Ej. Estante D-01"}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 text-slate-800 outline-none" style={{ height: 48, fontSize: 16 }} />
            <button disabled={!puedeAgregar} onClick={agregar}
              className="rounded-lg font-medium flex items-center gap-1.5 px-4"
              style={{ background: puedeAgregar ? AMBER : "#d8dbe1", color: puedeAgregar ? NAVY : "#9aa0ab", fontSize: 15 }}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <><Plus size={18} /> Añadir</>}
            </button>
          </div>
          {duplicado && <div className="text-red-600 mt-2" style={{ fontSize: 12 }}>Ya existe uno con ese nombre.</div>}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {items.length === 0 && <div className="text-center text-slate-400 text-sm py-8">No hay {nombreTab.toLowerCase()} todavía.</div>}
          {items.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-3">
              {delId === u.id ? (
                <div>
                  <div className="text-slate-700" style={{ fontSize: 13 }}>¿Eliminar <b>{u.nombre}</b> de la lista?</div>
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <button onClick={() => setDelId(null)} className="rounded-xl border border-slate-200 bg-white text-slate-600" style={{ minHeight: 44, fontSize: 14 }}>Cancelar</button>
                    <button disabled={busy} onClick={async () => { setBusy(true); await eliminar(u.id); setDelId(null); setBusy(false); }}
                      className="rounded-xl font-medium flex items-center justify-center gap-2" style={{ minHeight: 44, fontSize: 14, background: "#dc2626", color: "#fff" }}>
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={15} /> Eliminar</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 font-medium text-slate-800" style={{ fontSize: 15 }}>{u.nombre}</div>
                  <button onClick={() => setDelId(u.id)} className="rounded-lg border flex items-center justify-center bg-white"
                    style={{ width: 40, height: 40, borderColor: "#fecaca", color: "#b91c1c" }}>
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-slate-400 mt-4 px-1" style={{ fontSize: 12 }}>
          {esCategoria
            ? "Nota: eliminar una categoría solo la quita del menú de equipo nuevo. Los equipos que ya la tienen la conservan."
            : "Nota: eliminar un lugar solo lo quita de los menús. Las máquinas que ya están ahí conservan su ubicación hasta que las muevas."}
        </div>
      </div>
    </div>
  );
}
