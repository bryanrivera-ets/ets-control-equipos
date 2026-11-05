import { useState } from "react";
import {
  Check, ChevronDown, Loader2, CheckCircle2, Camera, X, Wrench, Warehouse, HardHat, Truck,
} from "lucide-react";
import { NAVY, AMBER, WRAP, tipoMeta } from "../lib/constants";
import { CatTile } from "../components/CatTile";
import { SubHeader } from "../components/SubHeader";
import { Select } from "../components/Select";

export function MultiMoveView({ equipos, ubicaciones, brigadas, onBack, onConfirm }) {
  const [modoDestino, setModoDestino] = useState("mismo"); // mismo | individual
  const [asig, setAsig] = useState({});
  const [uni, setUni] = useState({}); // destino único: {tipo, brigada, proyecto, camion, estante}
  const [nota, setNota] = useState("");
  const [foto, setFoto] = useState(null);
  const [fotoPrev, setFotoPrev] = useState("");
  const [guardando, setGuardando] = useState(false);

  const opt = (t) => ubicaciones.filter((u) => u.tipo === t).map((u) => u.nombre);
  const get = (id) => asig[id] || {};
  const setA = (id, patch) => setAsig((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const detalleDe = (a) =>
    a.tipo === "proyecto" ? (a.brigada && a.proyecto ? `${a.brigada} — ${a.proyecto}` : "")
    : a.tipo === "camion" ? (a.camion || "")
    : a.tipo === "almacen" ? (a.estante || "")
    : a.tipo === "taller" ? "En taller"
    : "";

  const completo = (a) => a.tipo && (a.tipo === "taller" || detalleDe(a));
  const listo = modoDestino === "mismo"
    ? equipos.length > 0 && completo(uni)
    : equipos.length > 0 && equipos.every((e) => completo(get(e.id)));

  const opciones = [
    { k: "almacen", t: "Almacén", Icon: Warehouse },
    { k: "proyecto", t: "Proyecto", Icon: HardHat },
    { k: "camion", t: "Camión", Icon: Truck },
    { k: "taller", t: "Taller", Icon: Wrench },
  ];
  const tipos = [["", "Escoge ubicación"], ["almacen", "Almacén"], ["proyecto", "Proyecto"], ["camion", "Camión"], ["taller", "Taller"]];

  const confirmar = async () => {
    setGuardando(true);
    const asigs = equipos.map((e) => {
      const a = modoDestino === "mismo" ? uni : get(e.id);
      return { id: e.id, tipo: a.tipo, detalle: a.tipo === "taller" ? (nota || "En taller") : detalleDe(a) };
    });
    await onConfirm(asigs, nota, foto);
  };

  return (
    <div className="flex-1 pb-28">
      <SubHeader title={`Mover ${equipos.length} ${equipos.length === 1 ? "equipo" : "equipos"}`} onBack={onBack} />
      <div className={`${WRAP} p-4`}>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setModoDestino("mismo")}
            className={`rounded-xl border px-3 py-2.5 text-left ${modoDestino === "mismo" ? "border-transparent text-white" : "bg-white border-slate-200 text-slate-700"}`}
            style={modoDestino === "mismo" ? { background: NAVY } : {}}>
            <div className="font-medium" style={{ fontSize: 14 }}>Mismo destino</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>Todas van al mismo sitio</div>
          </button>
          <button onClick={() => setModoDestino("individual")}
            className={`rounded-xl border px-3 py-2.5 text-left ${modoDestino === "individual" ? "border-transparent text-white" : "bg-white border-slate-200 text-slate-700"}`}
            style={modoDestino === "individual" ? { background: NAVY } : {}}>
            <div className="font-medium" style={{ fontSize: 14 }}>Destino individual</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>Cada una a su sitio</div>
          </button>
        </div>

        {modoDestino === "mismo" && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-3 mt-3">
              <div className="text-slate-400 mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Se mueven ({equipos.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {equipos.map((e) => (
                  <span key={e.id} className="bg-slate-100 text-slate-600 rounded-md px-2 py-1" style={{ fontSize: 12 }}>{e.nombre}</span>
                ))}
              </div>
            </div>

            <div className="text-slate-500 mt-4 mb-2" style={{ fontSize: 13 }}>Destino de todas</div>
            <div className="grid grid-cols-2 gap-2">
              {opciones.map((o) => (
                <button key={o.k} onClick={() => setUni({ tipo: o.k })}
                  className={`rounded-xl border flex items-center gap-2 px-3 ${uni.tipo === o.k ? "border-transparent text-white" : "bg-white border-slate-200 text-slate-700"}`}
                  style={{ minHeight: 52, ...(uni.tipo === o.k ? { background: NAVY } : {}) }}>
                  <o.Icon size={19} /> <span style={{ fontSize: 15 }}>{o.t}</span>
                </button>
              ))}
            </div>

            {uni.tipo === "proyecto" && (<>
              <Select label="Brigada responsable" value={uni.brigada || ""} onChange={(v) => setUni((p) => ({ ...p, brigada: v }))} options={brigadas} placeholder="Escoge brigada" />
              <Select label="Proyecto" value={uni.proyecto || ""} onChange={(v) => setUni((p) => ({ ...p, proyecto: v }))} options={opt("proyecto")} placeholder="Escoge proyecto" />
            </>)}
            {uni.tipo === "camion" && <Select label="Camión" value={uni.camion || ""} onChange={(v) => setUni((p) => ({ ...p, camion: v }))} options={opt("camion")} placeholder="Escoge camión" />}
            {uni.tipo === "almacen" && <Select label="Estante / zona" value={uni.estante || ""} onChange={(v) => setUni((p) => ({ ...p, estante: v }))} options={opt("almacen")} placeholder="Escoge ubicación" />}
          </>
        )}

        {modoDestino === "individual" && (
          <div className="flex flex-col gap-3 mt-3">
            {equipos.map((e) => {
              const a = get(e.id);
              return (
                <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <CatTile cat={e.categoria} foto={e.foto_url} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate" style={{ fontSize: 15 }}>{e.nombre}</div>
                      <div className="text-slate-400" style={{ fontSize: 12 }}>Ahora: {tipoMeta[e.ubicacion_tipo].loc} — {e.ubicacion_detalle}</div>
                    </div>
                    {completo(a) && <CheckCircle2 size={20} style={{ color: "#639922" }} className="shrink-0" />}
                  </div>

                  <div className="relative mt-3">
                    <select value={a.tipo || ""} onChange={(ev) => setA(e.id, { tipo: ev.target.value, brigada: "", proyecto: "", camion: "", estante: "" })}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 pr-9 text-slate-800" style={{ height: 48, fontSize: 16 }}>
                      {tipos.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <ChevronDown size={18} className="text-slate-400 absolute right-3 pointer-events-none" style={{ top: 15 }} />
                  </div>

                  {a.tipo === "proyecto" && (<>
                    <Select label="Brigada responsable" value={a.brigada || ""} onChange={(v) => setA(e.id, { brigada: v })} options={brigadas} placeholder="Escoge brigada" />
                    <Select label="Proyecto" value={a.proyecto || ""} onChange={(v) => setA(e.id, { proyecto: v })} options={opt("proyecto")} placeholder="Escoge proyecto" />
                  </>)}
                  {a.tipo === "camion" && <Select label="Camión" value={a.camion || ""} onChange={(v) => setA(e.id, { camion: v })} options={opt("camion")} placeholder="Escoge camión" />}
                  {a.tipo === "almacen" && <Select label="Estante / zona" value={a.estante || ""} onChange={(v) => setA(e.id, { estante: v })} options={opt("almacen")} placeholder="Escoge ubicación" />}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <div className="text-slate-500 mb-1.5" style={{ fontSize: 13 }}>Nota (opcional, se anota en todas)</div>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
            placeholder="Ej. salida para colado, devolución…"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none resize-none" style={{ fontSize: 16 }} />
        </div>

        <div className="mt-3">
          <div className="text-slate-500 mb-1.5" style={{ fontSize: 13 }}>Foto de condición (opcional, se adjunta a todas)</div>
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

        <button disabled={!listo || guardando} onClick={confirmar}
          className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-4"
          style={{ minHeight: 54, background: listo ? AMBER : "#d8dbe1", color: listo ? NAVY : "#9aa0ab", fontSize: 16 }}>
          {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Check size={19} /> Confirmar movimientos</>}
        </button>
      </div>
    </div>
  );
}
