import { useState } from "react";
import {
  CircleUser, Check, ChevronDown, Loader2, Trash2, Camera, X, Wrench, Truck, Car, FileText,
} from "lucide-react";
import { NAVY, AMBER, WRAP, MAX_DOCS, TIPOS_VEH, TIPOS_MANT } from "../lib/constants";
import { fechaCorta } from "../lib/utils";
import { SubHeader } from "../components/SubHeader";

export function VehiculoView({ vehiculo, mants, isAdmin, onBack, onRegistrar, onEliminarMant, onEliminarVeh }) {
  const [tipo, setTipo] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState("");
  const [archivos, setArchivos] = useState([]); // [{file, prev}]
  const [busy, setBusy] = useState(false);
  const [delMantId, setDelMantId] = useState(null);
  const [confirmVeh, setConfirmVeh] = useState(false);

  const listo = tipo && fecha && !busy;

  const guardar = async () => {
    setBusy(true);
    await onRegistrar(vehiculo.id, tipo, fecha, nota.trim(), archivos.map((a) => a.file));
    archivos.forEach((a) => a.prev && URL.revokeObjectURL(a.prev));
    setTipo(""); setNota(""); setArchivos([]); setFecha(new Date().toISOString().slice(0, 10)); setBusy(false);
  };

  const elegirArchivos = (files) => {
    const nuevos = Array.from(files).slice(0, MAX_DOCS - archivos.length).map((file) => ({
      file, prev: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    setArchivos((p) => [...p, ...nuevos]);
  };

  const quitarArchivo = (i) => {
    setArchivos((p) => { if (p[i].prev) URL.revokeObjectURL(p[i].prev); return p.filter((_, j) => j !== i); });
  };

  return (
    <div className="flex-1 pb-28">
      <SubHeader title="Detalle del vehículo" onBack={onBack} />
      <div className={`${WRAP} p-4`}>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 54, height: 54, background: "#eef1f6", color: NAVY }}>
            {vehiculo.tipo === "pickup" || vehiculo.tipo === "otro" ? <Car size={27} strokeWidth={1.8} /> : <Truck size={27} strokeWidth={1.8} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-800" style={{ fontSize: 16 }}>{vehiculo.nombre}</div>
            <div className="text-slate-400" style={{ fontSize: 12 }}>{TIPOS_VEH[vehiculo.tipo] || vehiculo.tipo}{vehiculo.placa ? ` · ${vehiculo.placa}` : ""}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 mt-3">
          <div className="text-slate-400 mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Registrar mantenimiento</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 pr-8 text-slate-800" style={{ height: 48, fontSize: 15 }}>
                <option value="">Tipo…</option>
                {TIPOS_MANT.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={16} className="text-slate-400 absolute right-2.5 pointer-events-none" style={{ top: 16 }} />
            </div>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 text-slate-800 outline-none" style={{ height: 48, fontSize: 15 }} />
          </div>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
            placeholder="Nota (opcional) — Ej. aceite 15W-40, goma delantera derecha…"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none resize-none mt-2" style={{ fontSize: 16 }} />
          {archivos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {archivos.map((a, i) => (
                <div key={i} className="relative">
                  {a.prev ? (
                    <img src={a.prev} alt={a.file.name} className="rounded-lg object-cover border border-slate-200" style={{ width: 64, height: 64 }} />
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-500 px-1" style={{ width: 64, height: 64 }}>
                      <FileText size={20} />
                      <div className="w-full truncate text-center" style={{ fontSize: 9 }}>{a.file.name}</div>
                    </div>
                  )}
                  <button onClick={() => quitarArchivo(i)} disabled={busy}
                    className="absolute rounded-full bg-white border border-slate-200 flex items-center justify-center"
                    style={{ width: 22, height: 22, top: -6, right: -6, color: "#475569" }}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          {archivos.length < MAX_DOCS && (
            <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white cursor-pointer text-slate-600 mt-2" style={{ minHeight: 48, fontSize: 14 }}>
              <Camera size={17} /> Adjuntar recibo o documento
              <input type="file" accept="image/*,application/pdf" multiple className="hidden" disabled={busy}
                onChange={(e) => { if (e.target.files?.length) elegirArchivos(e.target.files); e.target.value = ""; }} />
            </label>
          )}
          {archivos.length > 0 && <div className="text-slate-400 mt-1 px-1" style={{ fontSize: 11 }}>{archivos.length} de {MAX_DOCS} archivos</div>}
          <button disabled={!listo} onClick={guardar}
            className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-2"
            style={{ minHeight: 50, background: listo ? AMBER : "#d8dbe1", color: listo ? NAVY : "#9aa0ab", fontSize: 15 }}>
            {busy ? <><Loader2 size={17} className="animate-spin" /> Subiendo…</> : <><Check size={18} /> Guardar mantenimiento</>}
          </button>
        </div>

        <div className="mt-5">
          <div className="text-slate-500 font-medium mb-2 px-1" style={{ fontSize: 15 }}>Historial de mantenimientos</div>
          <div className="flex flex-col gap-2.5">
            {mants.length === 0 && <div className="text-slate-400 text-sm px-1">Sin mantenimientos registrados.</div>}
            {mants.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-3">
                {delMantId === m.id ? (
                  <div>
                    <div className="text-slate-700" style={{ fontSize: 13 }}>¿Eliminar este registro de <b>{m.tipo}</b>?</div>
                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                      <button onClick={() => setDelMantId(null)} className="rounded-xl border border-slate-200 bg-white text-slate-600" style={{ minHeight: 44, fontSize: 14 }}>Cancelar</button>
                      <button onClick={async () => { await onEliminarMant(m.id); setDelMantId(null); }}
                        className="rounded-xl font-medium flex items-center justify-center gap-2" style={{ minHeight: 44, fontSize: 14, background: "#dc2626", color: "#fff" }}>
                        <Trash2 size={15} /> Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: "#eef1f6", color: NAVY }}>
                      <Wrench size={18} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800" style={{ fontSize: 14 }}>{m.tipo} <span className="text-slate-400 font-normal">· {fechaCorta(m.fecha)}</span></div>
                      {m.nota && <div className="text-slate-500 mt-0.5" style={{ fontSize: 13 }}>{m.nota}</div>}
                      {m.documentos?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {m.documentos.map((d, i) => (
                            <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" title={d.nombre}>
                              {d.tipo === "pdf" ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-500 px-1" style={{ width: 56, height: 56 }}>
                                  <FileText size={18} />
                                  <div className="w-full truncate text-center" style={{ fontSize: 9 }}>{d.nombre || "PDF"}</div>
                                </div>
                              ) : (
                                <img src={d.url} alt={d.nombre || "Documento"} className="rounded-lg object-cover border border-slate-200" style={{ width: 56, height: 56 }} />
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="text-slate-400 mt-1 flex items-center gap-1.5" style={{ fontSize: 11 }}>
                        <CircleUser size={13} /> {m.usuario_nombre || "—"}
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => setDelMantId(m.id)} className="rounded-lg border flex items-center justify-center bg-white shrink-0"
                        style={{ width: 36, height: 36, borderColor: "#fecaca", color: "#b91c1c" }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="mt-5">
            {!confirmVeh ? (
              <button onClick={() => setConfirmVeh(true)}
                className="w-full rounded-xl border flex items-center justify-center gap-2 bg-white"
                style={{ minHeight: 48, fontSize: 14, borderColor: "#fecaca", color: "#b91c1c" }}>
                <Trash2 size={16} /> Eliminar vehículo
              </button>
            ) : (
              <div className="bg-white border border-red-200 rounded-xl p-3">
                <div className="text-slate-700" style={{ fontSize: 13 }}>
                  ¿Eliminar <b>{vehiculo.nombre}</b> y todo su historial de mantenimientos? Esta acción no se puede deshacer.
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => setConfirmVeh(false)} className="rounded-xl border border-slate-200 bg-white text-slate-600" style={{ minHeight: 46, fontSize: 14 }}>Cancelar</button>
                  <button onClick={() => onEliminarVeh(vehiculo.id)}
                    className="rounded-xl font-medium flex items-center justify-center gap-2" style={{ minHeight: 46, fontSize: 14, background: "#dc2626", color: "#fff" }}>
                    <Trash2 size={15} /> Sí, eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
