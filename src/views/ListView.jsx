import etsSimbolo from "../assets/ets-simbolo.png";
import {
  Search, ChevronRight, LogOut, ArrowLeftRight, Loader2, CheckCircle2, Circle, Upload, Settings, Download, Wrench, Truck, ScanLine,
} from "lucide-react";
import { NAVY, NAVY_SOFT, AMBER, WRAP, SAFE_TOP, tipoMeta } from "../lib/constants";
import { diasEn, textoDias, servicioVencido } from "../lib/utils";
import { Pill } from "../components/Pill";
import { CatTile } from "../components/CatTile";

export function ListView({ modo, equipos, conteo, filtro, setFiltro, query, setQuery, onItem, session, onLogout, seleccion = [], onContinuar, isAdmin, onImport, onPlantilla, importMsg, onCerrarMsg, onAdmin, onFlota, onEscanear }) {
  const cards = [["almacen", "Almacén"], ["proyecto", "Proyecto"], ["camion", "Camión"], ["taller", "Taller"]];
  const chips = [["todos", "Todos"], ["almacen", "Almacén"], ["proyecto", "Proyecto"], ["camion", "Camión"], ["taller", "Taller"]];
  if (modo === "equipos") chips.push(["retirados", "Retirados"]);

  const q = query.trim().toLowerCase();
  const visibles = equipos.filter((e) => {
    const matchQ = !q || e.nombre.toLowerCase().includes(q) || (e.serie || "").toLowerCase().includes(q);
    if (!matchQ) return false;
    const esBaja = e.condicion === "baja";
    if (modo === "equipos") {
      if (filtro === "retirados") return esBaja;
      if (esBaja) return false;
      return filtro === "todos" || e.ubicacion_tipo === filtro;
    }
    if (esBaja) return false;
    return filtro === "todos" || e.ubicacion_tipo === filtro;
  });

  return (
    <div className="flex-1 pb-28">
      <div style={{ background: NAVY, paddingTop: SAFE_TOP }} className="px-5 pb-5">
        <div className={`${WRAP} flex items-center justify-between`}>
          {modo === "inicio" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-lg flex items-center justify-center bg-white" style={{ width: 40, height: 40 }}>
                  <img src={etsSimbolo} alt="ETS" style={{ width: 28, height: 28, objectFit: "contain" }} />
                </div>
                <div>
                  <div className="text-white font-medium leading-tight" style={{ fontSize: 17 }}>Control de equipos</div>
                  <div style={{ color: NAVY_SOFT, fontSize: 12 }}>{session.nombre} · {session.brigada || "Supervisor"}</div>
                </div>
              </div>
              <div className="flex gap-5 items-center" style={{ color: "#cdd6e4" }}>
                <button onClick={onEscanear} title="Escanear código QR"><ScanLine size={21} /></button>
                {(session.rol === "admin" || session.rol === "pm") && <button onClick={onAdmin} title="Administración"><Settings size={20} /></button>}
                <button onClick={onFlota} title="Flota"><Truck size={21} /></button>
                <button onClick={onLogout} title="Salir"><LogOut size={20} /></button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="text-white font-medium" style={{ fontSize: 18 }}>{modo === "equipos" ? "Equipos" : "Mover equipo"}</div>
                <div style={{ color: NAVY_SOFT, fontSize: 12 }}>{modo === "equipos" ? "Inventario completo" : "Marca las máquinas que vas a mover"}</div>
              </div>
              {modo === "equipos" && isAdmin && (
                <div className="flex items-center gap-2">
                  <button onClick={onPlantilla} className="flex items-center gap-2 rounded-lg px-3" style={{ background: "#fff", color: NAVY, minHeight: 42, fontSize: 14, fontWeight: 500 }}>
                    <Download size={17} /> Descargar plantilla
                  </button>
                  <label className="flex items-center gap-2 rounded-lg px-3 cursor-pointer" style={{ background: AMBER, color: NAVY, minHeight: 42, fontSize: 14, fontWeight: 500 }}>
                    <Upload size={17} /> Importar Excel
                    <input type="file" accept=".xlsx,.xls" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={WRAP}>
        {modo === "equipos" && importMsg && (
          <div className="px-4 mt-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="text-slate-700 flex items-center gap-2" style={{ fontSize: 13 }}>
                {importMsg === "Importando…" ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <CheckCircle2 size={16} style={{ color: "#639922" }} />}
                {importMsg}
              </div>
              {importMsg !== "Importando…" && <button onClick={onCerrarMsg} className="text-slate-400" style={{ fontSize: 13 }}>Cerrar</button>}
            </div>
          </div>
        )}
        {modo === "inicio" && (
          <div className="px-4 -mt-3">
            <div className="grid grid-cols-4 gap-2">
              {cards.map(([k, t]) => (
                <button key={k} onClick={() => setFiltro(filtro === k ? "todos" : k)}
                  className={`bg-white rounded-xl p-3 text-left border ${filtro === k ? "border-slate-400" : "border-slate-200"}`}>
                  <div className="font-medium" style={{ color: NAVY, fontSize: 22 }}>{conteo[k]}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="rounded-full" style={{ width: 7, height: 7, background: tipoMeta[k].dot }} />
                    <span className="text-slate-500" style={{ fontSize: 12 }}>{t}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`px-4 ${modo === "inicio" ? "mt-4" : "mt-4"}`}>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 border border-slate-200" style={{ height: 46 }}>
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar equipo o número de serie"
              className="flex-1 outline-none bg-transparent" style={{ fontSize: 16 }} />
          </div>
        </div>

        <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-1">
          {chips.map(([k, l]) => (
            <button key={k} onClick={() => setFiltro(k)}
              className={`px-3.5 py-2 rounded-full whitespace-nowrap border ${filtro === k ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200"}`}
              style={{ fontSize: 13, ...(filtro === k ? { background: NAVY } : {}) }}>{l}</button>
          ))}
        </div>

        <div className="px-4 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visibles.length === 0 && <div className="text-center text-slate-400 text-sm py-10 sm:col-span-2">No hay equipos aquí.</div>}
          {visibles.map((e) => {
            const sel = modo === "mover" && seleccion.includes(e.id);
            return (
              <button key={e.id} onClick={() => onItem(e.id)}
                className={`rounded-xl border p-3 flex items-center gap-3 text-left ${sel ? "bg-blue-50" : "bg-white"}`}
                style={{ minHeight: 70, borderColor: sel ? NAVY : "#e2e8f0" }}>
                {modo === "mover" && (
                  sel ? <CheckCircle2 size={23} className="shrink-0" style={{ color: NAVY }} />
                      : <Circle size={23} className="text-slate-300 shrink-0" />
                )}
                <CatTile cat={e.categoria} foto={e.foto_url} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate" style={{ fontSize: 15 }}>{e.nombre}</div>
                  <div className="text-slate-400 truncate" style={{ fontSize: 12 }}>
                    {e.serie} · {e.ubicacion_detalle}
                    {e.ubicacion_tipo !== "almacen" && e.condicion !== "baja" && e.ubicado_desde ? ` · ${textoDias(diasEn(e.ubicado_desde))} aquí` : ""}
                  </div>
                </div>
                {servicioVencido(e) && e.condicion !== "baja" && <Wrench size={15} className="shrink-0" style={{ color: "#dc2626" }} />}
                <Pill equipo={e} />
                {modo !== "mover" && <ChevronRight size={18} className="text-slate-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {modo === "mover" && seleccion.length > 0 && (
        <div className="fixed left-0 right-0" style={{ bottom: "calc(92px + env(safe-area-inset-bottom))", zIndex: 20 }}>
          <div className={`${WRAP} px-4`}>
            <button onClick={onContinuar} className="w-full rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg"
              style={{ minHeight: 54, background: AMBER, color: NAVY, fontSize: 16 }}>
              <ArrowLeftRight size={19} /> Mover {seleccion.length} {seleccion.length === 1 ? "equipo" : "equipos"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
