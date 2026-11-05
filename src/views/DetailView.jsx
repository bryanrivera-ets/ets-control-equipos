import { useState } from "react";
import {
  CircleUser, ArrowLeftRight, ChevronDown, Loader2, Ban, RotateCcw, Trash2, AlertTriangle, Camera, Wrench,
} from "lucide-react";
import { NAVY, AMBER, WRAP, tipoMeta } from "../lib/constants";
import { fmtFecha, formatUbic, diasEn, textoDias, fechaCorta, servicioVencido } from "../lib/utils";
import { Pill } from "../components/Pill";
import { CatTile } from "../components/CatTile";
import { SubHeader } from "../components/SubHeader";

export function DetailView({ equipo, movs, onBack, onMover, onBaja, onEliminar, isAdmin, onFoto, onServicio, onIntervalo }) {
  const [servBusy, setServBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const baja = equipo.condicion === "baja";
  const m = tipoMeta[equipo.ubicacion_tipo];

  return (
    <div className="flex-1 pb-28">
      <SubHeader title="Detalle del equipo" onBack={onBack} />
      <div className={`${WRAP} p-4`}>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <CatTile cat={equipo.categoria} foto={equipo.foto_url} size={54} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-800" style={{ fontSize: 16 }}>{equipo.nombre}</div>
            <div className="text-slate-400" style={{ fontSize: 12 }}>{equipo.serie} · {equipo.categoria}</div>
          </div>
          <Pill equipo={equipo} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-400" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Foto</div>
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer border border-slate-200 rounded-lg px-3 py-1.5" style={{ fontSize: 13 }}>
              {subiendo ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
              {equipo.foto_url ? "Cambiar foto" : "Tomar foto"}
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) { setSubiendo(true); await onFoto(equipo, f); setSubiendo(false); }
                  e.target.value = "";
                }} />
            </label>
          </div>
          {equipo.foto_url
            ? <img src={equipo.foto_url} alt={equipo.nombre} className="w-full rounded-lg" style={{ maxHeight: 340, objectFit: "cover" }} />
            : <div className="text-slate-400 text-sm">Sin foto todavía. Tómale una con la cámara del iPad.</div>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mt-3">
          <div className="text-slate-400 mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Ubicación actual</div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg flex items-center justify-center" style={{ width: 38, height: 38, background: "#eef1f6", color: NAVY }}>
              <m.Icon size={20} strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-medium text-slate-800" style={{ fontSize: 15 }}>{m.loc}</div>
              <div className="text-slate-500" style={{ fontSize: 13 }}>{equipo.ubicacion_detalle}</div>
              {equipo.ubicado_desde && (
                <div className="text-slate-400" style={{ fontSize: 12 }}>
                  Aquí desde el {new Date(equipo.ubicado_desde).toLocaleDateString("es-PR", { day: "2-digit", month: "short", year: "numeric" })} ({textoDias(diasEn(equipo.ubicado_desde))})
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-400" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Mantenimiento</div>
            {servicioVencido(equipo)
              ? <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800" style={{ fontSize: 11 }}>Servicio vencido</span>
              : equipo.ultimo_servicio && equipo.intervalo_servicio_dias
                ? <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800" style={{ fontSize: 11 }}>Al día</span>
                : null}
          </div>
          <div className="text-slate-700" style={{ fontSize: 14 }}>
            {equipo.ultimo_servicio
              ? <>Último servicio: {fechaCorta(equipo.ultimo_servicio)} (hace {textoDias(diasEn(equipo.ultimo_servicio))})</>
              : "Sin servicio registrado."}
          </div>
          {equipo.ultimo_servicio && equipo.intervalo_servicio_dias && (
            <div className="text-slate-500 mt-0.5" style={{ fontSize: 13 }}>
              Próximo: {fechaCorta(new Date(new Date(equipo.ultimo_servicio).getTime() + equipo.intervalo_servicio_dias * 86400000))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="relative">
              <select value={equipo.intervalo_servicio_dias || ""} onChange={(e) => onIntervalo(equipo, e.target.value ? Number(e.target.value) : null)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 pr-8 text-slate-600" style={{ height: 48, fontSize: 13 }}>
                <option value="">Sin recordatorio</option>
                <option value="30">Cada 30 días</option>
                <option value="60">Cada 60 días</option>
                <option value="90">Cada 90 días</option>
                <option value="180">Cada 6 meses</option>
                <option value="365">Cada año</option>
              </select>
              <ChevronDown size={16} className="text-slate-400 absolute right-2.5 pointer-events-none" style={{ top: 16 }} />
            </div>
            <button disabled={servBusy} onClick={async () => { setServBusy(true); await onServicio(equipo); setServBusy(false); }}
              className="rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2 text-slate-700" style={{ minHeight: 48, fontSize: 13 }}>
              {servBusy ? <Loader2 size={16} className="animate-spin" /> : <><Wrench size={16} /> Registrar servicio</>}
            </button>
          </div>
        </div>

        {baja ? (
          <div className="mt-3 rounded-xl p-3 flex items-center gap-2 bg-slate-200 text-slate-600" style={{ fontSize: 13 }}>
            <AlertTriangle size={17} /> Este equipo está retirado (dado de baja).
          </div>
        ) : (
          <button onClick={onMover} className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-3" style={{ minHeight: 54, background: AMBER, color: NAVY, fontSize: 16 }}>
            <ArrowLeftRight size={19} /> Mover equipo
          </button>
        )}

        {!confirmDel ? (
          <div className={`grid ${isAdmin ? "grid-cols-2" : "grid-cols-1"} gap-2 mt-2.5`}>
            <button onClick={() => onBaja(equipo)}
              className="rounded-xl border flex items-center justify-center gap-2"
              style={{ minHeight: 48, fontSize: 14, borderColor: baja ? "#639922" : "#cbd5e1", color: baja ? "#3f6212" : "#475569", background: "#fff" }}>
              {baja ? <><RotateCcw size={17} /> Reactivar</> : <><Ban size={17} /> Dar de baja</>}
            </button>
            {isAdmin && (
              <button onClick={() => setConfirmDel(true)}
                className="rounded-xl border flex items-center justify-center gap-2 bg-white"
                style={{ minHeight: 48, fontSize: 14, borderColor: "#fecaca", color: "#b91c1c" }}>
                <Trash2 size={17} /> Eliminar
              </button>
            )}
          </div>
        ) : (
          <div className="mt-2.5 bg-white border border-red-200 rounded-xl p-3">
            <div className="text-slate-700" style={{ fontSize: 13 }}>
              ¿Eliminar <b>{equipo.nombre}</b> y todo su historial? Esta acción no se puede deshacer.
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => setConfirmDel(false)} className="rounded-xl border border-slate-200 bg-white text-slate-600" style={{ minHeight: 46, fontSize: 14 }}>Cancelar</button>
              <button disabled={busy} onClick={async () => { setBusy(true); await onEliminar(equipo); }}
                className="rounded-xl font-medium flex items-center justify-center gap-2" style={{ minHeight: 46, fontSize: 14, background: "#dc2626", color: "#fff" }}>
                {busy ? <Loader2 size={17} className="animate-spin" /> : <><Trash2 size={16} /> Sí, eliminar</>}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="text-slate-500 font-medium mb-2 px-1" style={{ fontSize: 15 }}>Historial de movimientos</div>
          <div className="flex flex-col gap-2.5">
            {movs.length === 0 && <div className="text-slate-400 text-sm px-1">Sin movimientos registrados.</div>}
            {movs.map((mv) => (
              <div key={mv.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-2 text-slate-700" style={{ fontSize: 13 }}>
                  <span className="text-slate-400">{formatUbic(mv.de_tipo, mv.de_detalle)}</span>
                  <ArrowLeftRight size={14} className="text-slate-300 shrink-0" />
                  <span className="font-medium">{formatUbic(mv.a_tipo, mv.a_detalle)}</span>
                </div>
                {mv.nota && <div className="text-slate-500 mt-1" style={{ fontSize: 13 }}>{mv.nota}</div>}
                {mv.foto_url && <img src={mv.foto_url} alt="Condición" className="w-full rounded-lg object-cover mt-2" style={{ maxHeight: 160 }} />}
                <div className="text-slate-400 mt-1.5 flex items-center gap-1.5" style={{ fontSize: 11 }}>
                  <CircleUser size={13} /> {mv.usuario_nombre || "—"} · {fmtFecha(mv.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
