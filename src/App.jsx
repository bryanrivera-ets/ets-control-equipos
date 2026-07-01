import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import {
  Bell, CircleUser, Search, ChevronRight, ArrowLeft, Plus, LogOut,
  Home, Boxes, ArrowLeftRight, BarChart3, Check, ChevronDown, Loader2,
  Zap, Droplets, Cog, Flame, Hammer, Gauge, Wrench, Activity,
  Warehouse, HardHat, Truck,
} from "lucide-react";

const NAVY = "#16233a";
const NAVY_SOFT = "#9fb0c9";
const AMBER = "#e8a13a";
const FONT = "system-ui, sans-serif";
const WRAP = "mx-auto w-full max-w-2xl";
const SAFE_TOP = "calc(16px + env(safe-area-inset-top))";

const tipoMeta = {
  almacen:  { loc: "Almacén",  label: "Disponible",    pill: "bg-green-100 text-green-800", dot: "#639922", Icon: Warehouse },
  proyecto: { loc: "Proyecto", label: "En proyecto",   pill: "bg-blue-100 text-blue-800",   dot: "#378ADD", Icon: HardHat },
  camion:   { loc: "Camión",   label: "En camión",     pill: "bg-amber-100 text-amber-800", dot: "#EF9F27", Icon: Truck },
  taller:   { loc: "Taller",   label: "Mantenimiento", pill: "bg-red-100 text-red-800",     dot: "#E24B4A", Icon: Wrench },
};

const catIcon = {
  Generador: Zap, Bomba: Droplets, Mezcladora: Cog, Soldadora: Flame,
  Compactadora: Cog, Herramienta: Hammer, Compresor: Gauge,
  Cortadora: Wrench, Vibrador: Activity,
};
const CATEGORIAS = Object.keys(catIcon);

const fmtFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-PR", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit" })
  );
};
const formatUbic = (tipo, detalle) => (tipo ? `${tipoMeta[tipo].loc} — ${detalle}` : "—");

export default function App() {
  const [session, setSession] = useState(null);
  if (!session) return <Login onLogin={setSession} />;
  return <Main session={session} onLogout={() => setSession(null)} />;
}

/* ------------------------------------------------------------------ LOGIN */
function Login({ onLogin }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errCarga, setErrCarga] = useState("");
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("usuarios").select("id,nombre,rol,brigada").eq("activo", true).order("nombre");
      if (error) setErrCarga("No se pudo conectar a la base de datos. Revisa el archivo .env.local.");
      else setUsuarios(data || []);
      setCargando(false);
    })();
  }, []);

  const entrar = async () => {
    setErr(""); setVerificando(true);
    const { data } = await supabase
      .from("usuarios").select("id,nombre,rol,brigada")
      .eq("id", sel.id).eq("pin", pin).maybeSingle();
    setVerificando(false);
    if (data) onLogin(data);
    else { setErr("PIN incorrecto"); setPin(""); }
  };

  const supervisores = usuarios.filter((u) => u.rol === "supervisor");
  const brigadas = usuarios.filter((u) => u.rol === "brigada");

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ background: NAVY, fontFamily: FONT, paddingTop: SAFE_TOP }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="rounded-2xl inline-flex items-center justify-center font-medium" style={{ width: 68, height: 68, background: AMBER, color: NAVY, fontSize: 23 }}>ETS</div>
          <div className="text-white font-medium mt-4" style={{ fontSize: 22 }}>Control de equipos</div>
          <div style={{ color: NAVY_SOFT, fontSize: 14 }}>Almacén principal · Caguas</div>
        </div>

        <div className="bg-slate-100 rounded-2xl p-5">
          {cargando && <div className="flex justify-center py-10 text-slate-400"><Loader2 className="animate-spin" /></div>}
          {errCarga && <div className="text-center text-red-600 text-sm py-8">{errCarga}</div>}

          {!cargando && !errCarga && !sel && (
            <>
              <div className="text-slate-500 mb-3" style={{ fontSize: 15 }}>¿Quién eres?</div>
              {supervisores.length > 0 && <div className="text-slate-400 mb-1.5" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Supervisor</div>}
              <div className="flex flex-col gap-2 mb-4">
                {supervisores.map((u) => <UserRow key={u.id} u={u} onClick={() => { setSel(u); setErr(""); }} />)}
              </div>
              {brigadas.length > 0 && <div className="text-slate-400 mb-1.5" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>Brigadas</div>}
              <div className="flex flex-col gap-2">
                {brigadas.map((u) => <UserRow key={u.id} u={u} onClick={() => { setSel(u); setErr(""); }} />)}
              </div>
            </>
          )}

          {!cargando && sel && (
            <div>
              <button onClick={() => { setSel(null); setPin(""); setErr(""); }} className="text-slate-500 text-sm flex items-center gap-1 mb-5">
                <ArrowLeft size={16} /> Cambiar usuario
              </button>
              <div className="text-center mb-5">
                <div className="font-medium text-slate-800" style={{ fontSize: 18 }}>{sel.nombre}</div>
                <div className="text-slate-400 text-sm">{sel.brigada || "Supervisor"}</div>
              </div>
              <div className="text-slate-500 mb-1.5" style={{ fontSize: 13 }}>Entra tu PIN</div>
              <input autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && pin && entrar()}
                inputMode="numeric" type="password" placeholder="••••"
                className="w-full bg-white border border-slate-200 rounded-lg px-4 text-center tracking-widest text-slate-800 outline-none"
                style={{ height: 56, fontSize: 24 }} />
              {err && <div className="text-red-600 text-sm mt-2 text-center">{err}</div>}
              <button disabled={!pin || verificando} onClick={entrar}
                className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-5"
                style={{ minHeight: 54, background: pin ? AMBER : "#d8dbe1", color: pin ? NAVY : "#9aa0ab", fontSize: 16 }}>
                {verificando ? <Loader2 size={18} className="animate-spin" /> : "Entrar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 text-left" style={{ minHeight: 60 }}>
      <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: "#eef1f6", color: NAVY }}>
        <CircleUser size={23} />
      </div>
      <div className="flex-1">
        <div className="font-medium text-slate-800" style={{ fontSize: 15 }}>{u.nombre}</div>
        <div className="text-slate-400" style={{ fontSize: 12 }}>{u.brigada || "Supervisor de almacén"}</div>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );
}

/* ------------------------------------------------------------------- MAIN */
function Main({ session, onLogout }) {
  const [equipos, setEquipos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [brigadas, setBrigadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [query, setQuery] = useState("");
  const [movs, setMovs] = useState([]);

  const cargarDatos = useCallback(async () => {
    const [eq, ub, us] = await Promise.all([
      supabase.from("equipos").select("*").order("nombre"),
      supabase.from("ubicaciones").select("*").eq("activo", true).order("nombre"),
      supabase.from("usuarios").select("brigada").eq("rol", "brigada").eq("activo", true),
    ]);
    setEquipos(eq.data || []);
    setUbicaciones(ub.data || []);
    setBrigadas([...new Set((us.data || []).map((u) => u.brigada).filter(Boolean))]);
    setCargando(false);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const abrir = async (id) => {
    setSelectedId(id); setView("detail"); setMovs([]);
    const { data } = await supabase.from("movimientos").select("*").eq("equipo_id", id).order("created_at", { ascending: false });
    setMovs(data || []);
  };

  const selected = equipos.find((e) => e.id === selectedId);

  const conteo = useMemo(() => {
    const c = { almacen: 0, proyecto: 0, camion: 0, taller: 0 };
    equipos.forEach((e) => (c[e.ubicacion_tipo] += 1));
    return c;
  }, [equipos]);

  const listados = useMemo(() => equipos.filter((e) => {
    const okF = filtro === "todos" || e.ubicacion_tipo === filtro;
    const q = query.trim().toLowerCase();
    const okQ = !q || e.nombre.toLowerCase().includes(q) || (e.serie || "").toLowerCase().includes(q);
    return okF && okQ;
  }), [equipos, filtro, query]);

  const mover = async (tipo, detalle, nota) => {
    await supabase.from("equipos").update({
      ubicacion_tipo: tipo, ubicacion_detalle: detalle, updated_at: new Date().toISOString(),
    }).eq("id", selected.id);
    await supabase.from("movimientos").insert({
      equipo_id: selected.id, usuario_id: session.id, usuario_nombre: session.nombre,
      de_tipo: selected.ubicacion_tipo, de_detalle: selected.ubicacion_detalle,
      a_tipo: tipo, a_detalle: detalle, nota: nota || null,
    });
    await cargarDatos();
    await abrir(selected.id);
  };

  const agregar = async ({ nombre, serie, cat, detalle }) => {
    const { data } = await supabase.from("equipos").insert({
      nombre, serie, categoria: cat, ubicacion_tipo: "almacen", ubicacion_detalle: detalle,
    }).select().single();
    if (data) {
      await supabase.from("movimientos").insert({
        equipo_id: data.id, usuario_id: session.id, usuario_nombre: session.nombre,
        a_tipo: "almacen", a_detalle: detalle, nota: "Alta de equipo",
      });
      await cargarDatos();
      await abrir(data.id);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col" style={{ fontFamily: FONT }}>
      {cargando ? (
        <div className="flex-1 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="flex-1 flex flex-col">
          {view === "list" && (
            <ListView equipos={listados} conteo={conteo} filtro={filtro} setFiltro={setFiltro}
              query={query} setQuery={setQuery} abrir={abrir} session={session} onLogout={onLogout} />
          )}
          {view === "detail" && selected && (
            <DetailView equipo={selected} movs={movs} onBack={() => setView("list")} onMover={() => setView("move")} />
          )}
          {view === "move" && selected && (
            <MoveView equipo={selected} ubicaciones={ubicaciones} brigadas={brigadas}
              onBack={() => setView("detail")} onConfirm={async (t, d, n) => { await mover(t, d, n); setView("detail"); }} />
          )}
          {view === "nuevo" && (
            <NuevoView ubicaciones={ubicaciones} onBack={() => setView("list")} onSave={async (eq) => { await agregar(eq); }} />
          )}
          {view === "reportes" && <ReportesView equipos={equipos} conteo={conteo} />}
        </div>
      )}
      <BottomNav view={view} setView={setView} />
    </div>
  );
}

function Pill({ tipo }) {
  const m = tipoMeta[tipo];
  return <span className={`px-2.5 py-1 rounded-md whitespace-nowrap ${m.pill}`} style={{ fontSize: 12 }}>{m.label}</span>;
}
function CatTile({ cat, size = 44 }) {
  const Icon = catIcon[cat] || Wrench;
  return (
    <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: size, height: size, background: "#eef1f6", color: NAVY }}>
      <Icon size={size * 0.5} strokeWidth={1.8} />
    </div>
  );
}

function ListView({ equipos, conteo, filtro, setFiltro, query, setQuery, abrir, session, onLogout }) {
  const cards = [["almacen", "Almacén"], ["proyecto", "Proyecto"], ["camion", "Camión"], ["taller", "Taller"]];
  const chips = [["todos", "Todos"], ["almacen", "Almacén"], ["proyecto", "Proyecto"], ["camion", "Camión"], ["taller", "Taller"]];
  return (
    <div className="flex-1 pb-28">
      <div style={{ background: NAVY, paddingTop: SAFE_TOP }} className="px-5 pb-5">
        <div className={`${WRAP} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg flex items-center justify-center font-medium text-sm" style={{ width: 40, height: 40, background: AMBER, color: NAVY }}>ETS</div>
            <div>
              <div className="text-white font-medium leading-tight" style={{ fontSize: 17 }}>Control de equipos</div>
              <div style={{ color: NAVY_SOFT, fontSize: 12 }}>{session.nombre} · {session.brigada || "Supervisor"}</div>
            </div>
          </div>
          <div className="flex gap-5 items-center" style={{ color: "#cdd6e4" }}>
            <Bell size={21} />
            <button onClick={onLogout} title="Salir"><LogOut size={20} /></button>
          </div>
        </div>
      </div>

      <div className={WRAP}>
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

        <div className="px-4 mt-4">
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
          {equipos.length === 0 && <div className="text-center text-slate-400 text-sm py-10 sm:col-span-2">No hay equipos en este filtro.</div>}
          {equipos.map((e) => (
            <button key={e.id} onClick={() => abrir(e.id)} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 text-left" style={{ minHeight: 70 }}>
              <CatTile cat={e.categoria} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate" style={{ fontSize: 15 }}>{e.nombre}</div>
                <div className="text-slate-400 truncate" style={{ fontSize: 12 }}>{e.serie} · {e.ubicacion_detalle}</div>
              </div>
              <Pill tipo={e.ubicacion_tipo} />
              <ChevronRight size={18} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubHeader({ title, onBack }) {
  return (
    <div style={{ background: NAVY, paddingTop: SAFE_TOP }} className="px-4 pb-4">
      <div className={`${WRAP} flex items-center gap-3`}>
        {onBack && <button onClick={onBack} className="text-white"><ArrowLeft size={23} /></button>}
        <div className="text-white font-medium" style={{ fontSize: 17 }}>{title}</div>
      </div>
    </div>
  );
}

function DetailView({ equipo, movs, onBack, onMover }) {
  const m = tipoMeta[equipo.ubicacion_tipo];
  return (
    <div className="flex-1 pb-28">
      <SubHeader title="Detalle del equipo" onBack={onBack} />
      <div className={`${WRAP} p-4`}>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <CatTile cat={equipo.categoria} size={54} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-800" style={{ fontSize: 16 }}>{equipo.nombre}</div>
            <div className="text-slate-400" style={{ fontSize: 12 }}>{equipo.serie} · {equipo.categoria}</div>
          </div>
          <Pill tipo={equipo.ubicacion_tipo} />
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
            </div>
          </div>
        </div>

        <button onClick={onMover} className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-3" style={{ minHeight: 54, background: AMBER, color: NAVY, fontSize: 16 }}>
          <ArrowLeftRight size={19} /> Mover equipo
        </button>

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

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div className="mt-3">
      <div className="text-slate-500 mb-1.5" style={{ fontSize: 13 }}>{label}</div>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 pr-9 text-slate-800" style={{ height: 48, fontSize: 16 }}>
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={18} className="text-slate-400 absolute right-3 pointer-events-none" style={{ top: 15 }} />
      </div>
    </div>
  );
}

function MoveView({ equipo, ubicaciones, brigadas, onBack, onConfirm }) {
  const [tipo, setTipo] = useState("");
  const [brigada, setBrigada] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [camion, setCamion] = useState("");
  const [estante, setEstante] = useState("");
  const [nota, setNota] = useState("");
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
          <CatTile cat={equipo.categoria} />
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

        <button disabled={!listo || guardando} onClick={async () => { setGuardando(true); await onConfirm(tipo, detalle, nota); }}
          className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-4"
          style={{ minHeight: 54, background: listo ? AMBER : "#d8dbe1", color: listo ? NAVY : "#9aa0ab", fontSize: 16 }}>
          {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Check size={19} /> Confirmar movimiento</>}
        </button>
      </div>
    </div>
  );
}

function NuevoView({ ubicaciones, onBack, onSave }) {
  const [nombre, setNombre] = useState("");
  const [serie, setSerie] = useState("");
  const [cat, setCat] = useState("");
  const [estante, setEstante] = useState("");
  const [guardando, setGuardando] = useState(false);
  const estantes = ubicaciones.filter((u) => u.tipo === "almacen").map((u) => u.nombre);
  const listo = nombre && serie && cat && estante;
  return (
    <div className="flex-1 pb-28">
      <SubHeader title="Agregar equipo" onBack={onBack} />
      <div className={`${WRAP} p-4`}>
        <div className="mt-1">
          <div className="text-slate-500 mb-1.5" style={{ fontSize: 13 }}>Nombre del equipo</div>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Generador Honda EU7000"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 text-slate-800 outline-none" style={{ height: 48, fontSize: 16 }} />
        </div>
        <div className="mt-3">
          <div className="text-slate-500 mb-1.5" style={{ fontSize: 13 }}>Número de serie</div>
          <input value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="Ej. GEN-042"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 text-slate-800 outline-none" style={{ height: 48, fontSize: 16 }} />
        </div>
        <Select label="Categoría" value={cat} onChange={setCat} options={CATEGORIAS} placeholder="Escoge categoría" />
        <Select label="Ubicación inicial (almacén)" value={estante} onChange={setEstante} options={estantes} placeholder="Escoge estante / zona" />
        <button disabled={!listo || guardando} onClick={async () => { setGuardando(true); await onSave({ nombre, serie, cat, detalle: estante }); }}
          className="w-full rounded-xl font-medium flex items-center justify-center gap-2 mt-5"
          style={{ minHeight: 54, background: listo ? AMBER : "#d8dbe1", color: listo ? NAVY : "#9aa0ab", fontSize: 16 }}>
          {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={19} /> Guardar equipo</>}
        </button>
      </div>
    </div>
  );
}

function ReportesView({ equipos, conteo }) {
  const porCat = useMemo(() => {
    const c = {};
    equipos.forEach((e) => (c[e.categoria] = (c[e.categoria] || 0) + 1));
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [equipos]);
  const total = equipos.length;
  const max = Math.max(...porCat.map(([, n]) => n), 1);
  return (
    <div className="flex-1 pb-28">
      <SubHeader title="Reportes" />
      <div className={`${WRAP} p-4`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.keys(tipoMeta).map((k) => (
            <div key={k} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-1.5">
                <span className="rounded-full" style={{ width: 8, height: 8, background: tipoMeta[k].dot }} />
                <span className="text-slate-500 text-sm">{tipoMeta[k].loc}</span>
              </div>
              <div className="font-medium mt-1" style={{ color: NAVY, fontSize: 24 }}>{conteo[k]}</div>
              <div className="text-slate-400" style={{ fontSize: 11 }}>{total ? Math.round((conteo[k] / total) * 100) : 0}% de la flota</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 mt-3">
          <div className="text-slate-500 font-medium mb-3" style={{ fontSize: 15 }}>Equipos por categoría</div>
          <div className="flex flex-col gap-2.5">
            {porCat.map(([cat, n]) => (
              <div key={cat}>
                <div className="flex justify-between text-slate-700" style={{ fontSize: 14 }}>
                  <span>{cat}</span><span className="text-slate-400">{n}</span>
                </div>
                <div className="bg-slate-100 rounded-full mt-1" style={{ height: 8 }}>
                  <div className="rounded-full" style={{ height: 8, width: `${(n / max) * 100}%`, background: NAVY }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center text-slate-400 mt-4" style={{ fontSize: 11 }}>Total de equipos: {total}</div>
      </div>
    </div>
  );
}

function BottomNav({ view, setView }) {
  const item = (target, Icon, label, active) => (
    <button onClick={() => setView(target)} className="flex flex-col items-center gap-0.5" style={{ color: active ? NAVY : "#9aa0ab" }}>
      <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ fontSize: 11 }}>{label}</span>
    </button>
  );
  return (
    <div className="sticky bottom-0 w-full bg-white border-t border-slate-200" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className={`${WRAP} flex justify-around items-center px-4`} style={{ paddingTop: 10, paddingBottom: 12 }}>
        {item("list", Home, "Inicio", view === "list")}
        {item("reportes", BarChart3, "Reportes", view === "reportes")}
        <button onClick={() => setView("nuevo")} className="flex flex-col items-center gap-1" style={{ marginTop: -26 }}>
          <span className="rounded-full flex items-center justify-center border-4 border-white" style={{ width: 56, height: 56, background: AMBER, color: NAVY }}>
            <Plus size={28} />
          </span>
          <span style={{ fontSize: 11, color: "#9aa0ab" }}>Nuevo</span>
        </button>
        {item("list", ArrowLeftRight, "Mover", false)}
        {item("list", Boxes, "Equipos", false)}
      </div>
    </div>
  );
}