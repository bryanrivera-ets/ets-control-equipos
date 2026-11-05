import { useState } from "react";
import {
  ChevronRight, Plus, ChevronDown, Loader2, Truck, Car,
} from "lucide-react";
import { NAVY, AMBER, WRAP, TIPOS_VEH } from "../lib/constants";
import { fechaCorta } from "../lib/utils";
import { SubHeader } from "../components/SubHeader";

export function FlotaView({ vehiculos, mants, isAdmin, onBack, onOpen, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("camion");
  const [placa, setPlaca] = useState("");
  const [busy, setBusy] = useState(false);

  const ultimo = (vid) => mants.find((m) => m.vehiculo_id === vid);
  const listo = nombre.trim() && !busy;

  const guardar = async () => {
    setBusy(true);
    await onAdd(nombre.trim(), tipo, placa.trim());
    setNombre(""); setPlaca(""); setTipo("camion"); setShowForm(false); setBusy(false);
  };

  return (
    <div className="flex-1 pb-28">
      <SubHeader title="Flota de vehículos" onBack={onBack} />
      <div className={`${WRAP} p-4`}>

        {isAdmin && (
          <div className="mb-3">
            {!showForm ? (
              <button onClick={() => setShowForm(true)}
                className="w-full rounded-xl font-medium flex items-center justify-center gap-2"
                style={{ minHeight: 50, background: AMBER, color: NAVY, fontSize: 15 }}>
                <Plus size={18} /> Añadir vehículo
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="text-slate-400 mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Nuevo vehículo</div>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre — Ej. Camión 06, Pickup F-150 blanca"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 text-slate-800 outline-none" style={{ height: 48, fontSize: 16 }} />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="relative">
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 pr-8 text-slate-800" style={{ height: 48, fontSize: 15 }}>
                      {Object.entries(TIPOS_VEH).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                    <ChevronDown size={16} className="text-slate-400 absolute right-2.5 pointer-events-none" style={{ top: 16 }} />
                  </div>
                  <input value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Tablilla (opcional)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 text-slate-800 outline-none" style={{ height: 48, fontSize: 15 }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 bg-white text-slate-600" style={{ minHeight: 46, fontSize: 14 }}>Cancelar</button>
                  <button disabled={!listo} onClick={guardar}
                    className="rounded-xl font-medium flex items-center justify-center gap-2"
                    style={{ minHeight: 46, fontSize: 14, background: listo ? AMBER : "#d8dbe1", color: listo ? NAVY : "#9aa0ab" }}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Guardar</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {vehiculos.length === 0 && <div className="text-center text-slate-400 text-sm py-10">No hay vehículos todavía.{isAdmin ? " Añade el primero arriba." : ""}</div>}
          {vehiculos.map((v) => {
            const u = ultimo(v.id);
            return (
              <button key={v.id} onClick={() => onOpen(v.id)} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 text-left" style={{ minHeight: 70 }}>
                <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: "#eef1f6", color: NAVY }}>
                  {v.tipo === "pickup" || v.tipo === "otro" ? <Car size={22} strokeWidth={1.8} /> : <Truck size={22} strokeWidth={1.8} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate" style={{ fontSize: 15 }}>{v.nombre}</div>
                  <div className="text-slate-400 truncate" style={{ fontSize: 12 }}>
                    {TIPOS_VEH[v.tipo] || v.tipo}{v.placa ? ` · ${v.placa}` : ""}
                    {u ? ` · Últ.: ${u.tipo} — ${fechaCorta(u.fecha)}` : " · Sin mantenimientos"}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
