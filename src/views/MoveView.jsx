import { useState } from "react";
import {
  Check, Loader2, Camera, X, Wrench, Warehouse, HardHat, Truck,
} from "lucide-react";
import { NAVY, AMBER, WRAP, tipoMeta } from "../lib/constants";
import { CatTile } from "../components/CatTile";
import { SubHeader } from "../components/SubHeader";
import { Select } from "../components/Select";

export function MoveView({ equipo, ubicaciones, brigadas, onBack, onConfirm }) {
  const [tipo, setTipo] = useState("");
  const [brigada, setBrigada] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [camion, setCamion] = useState("");
  const [estante, setEstante] = useState("");
  const [nota, setNota] = useState("");
  const [foto, setFoto] = useState(null);
  const [fotoPrev, setFotoPrev] = useState("");
  const [guardando, setGuardando] = useState(false);

  const opt = (t) => ubicaciones.filter((u) => u.tipo === t).map((u) => u.nombre);
  const detalle =
    tipo === "proyecto" ? (brigada && proyecto ? `${brigada} — ${proyecto}` : "")
    : tipo === "camion" ? camion
    : tipo === "almacen" ? estante
    : tipo === "taller" ? (nota || "En taller")
    : "";
  const listo = tipo && (tipo === "taller" || detalle);

  const opciones = [
    { k: "almacen", t: "Almacén", Icon: Warehouse },
    { k: "proyecto", t: "Proyecto", Icon: HardHat },
    { k: "camion", t: "Camión", Icon: Truck },
    { k: "taller", t: "Taller", Icon: Wrench },
  ];

  return (
    <div className="flex-1 pb-28">
      <SubHeader title="Mover equipo" onBack={onBack} />
      <div className={`${WRAP} p-4`}>
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <CatTile cat={equipo.categoria} foto={equipo.foto_url} />
          <div className="min-w-0">
            <div className="font-medium text-slate-800 truncate" style={{ fontSize: 15 }}>{equipo.nombre}</div>
            <div className="text-slate-400" style={{ fontSize: 12 }}>Ahora: {tipoMeta[equipo.ubicacion_tipo].loc} — {equipo.ubicacion_detalle}</div>
          </div>
        </div>

        <div className="text-slate-500 mt-4 mb-2" style={{ fontSize: 13 }}>Nueva ubicación</div>
        <div className="grid grid-cols-2 gap-2">
          {opciones.map((o) => (
            <button key={o.k} onClick={() => setTipo(o.k)}
              className={`rounded-xl border flex items-center gap-2 px-3 ${tipo === o.k ? "border-transparent text-white" : "bg-white border-slate-200 text-slate-700"}`}
              style={{ minHeight: 52, ...(tipo === o.k ? { background: NAVY } : {}) }}>
              <o.Icon size={19} /> <span style={{ fontSize: 15 }}>{o.t}</span>
            </button>
          ))}
        </div>

        {tipo === "proyecto" && (<>
          <Select label="Brigada responsable" value={brigada} onChange={setBrigada} options={brigadas} placeholder="Escoge brigada" />
          <Select label="Proyecto" value={proyecto} onChange={setProyecto} options={opt("proyecto")} placeholder="Escoge proyecto" />
        </>)}
        {tipo === "camion" && <Select label="Camión" value={camion} onChange={setCamion} options={opt("camion")} placeholder="Escoge camión" />}
        {tipo === "almacen" && <Select label="Estante / zona" value={estante} onChange={setEstante} options={opt("almacen")} placeholder="Escoge ubicación" />}

        <div className="mt-3">
          <div className="text-slate-500 mb-1.5" style={{ fontSize: 13 }}>Nota (opcional)</div>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
            placeholder="Ej. salida para colado, devolución, falla…"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none resize-none" style={{ fontSize: 16 }} />
        </div>

        <div className="mt-3">
          <div className="text-slate-500 mb-1.5" style={{ fontSize: 13 }}>Foto de condición (opcional)</div>
          {fotoPrev ? (
            <div className="relative">
              <img src={fotoPrev} alt="Condición" className="w-full rounded-lg object-cover" style={{ maxHeight: 180 }} />
              <button onClick={() => { setFoto(null); setFotoPrev(""); }}
                className="absolute top-2 right-2 rounded-full bg-white border border-slate-200 flex items-center justify-center"
                style={{ width: 32, height: 32, color: "#475569" }}><X size={16} /></button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white cursor-pointer text-slate-600" style={{ minHeight: 48, fontSize: 14 }}>
              <Camera size={17} /> Tomar foto
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFoto(f); setFotoPrev(URL.createObjectURL(f)); } e.target.value = ""; }} />
            </label>
          )}
        </div>

        <button disabled={!listo || guardando} onClick={async () => { setGuardando(true); await onConfirm(tipo, detalle, nota, foto); }}
          className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-4"
          style={{ minHeight: 54, background: listo ? AMBER : "#d8dbe1", color: listo ? NAVY : "#9aa0ab", fontSize: 16 }}>
          {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Check size={19} /> Confirmar movimiento</>}
        </button>
      </div>
    </div>
  );
}
