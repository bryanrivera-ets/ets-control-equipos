import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import heroBg from "./assets/hero.png";
import etsLogo from "./assets/ets-logo.png";
import etsSimbolo from "./assets/ets-simbolo.png";
import * as XLSX from "xlsx";
import {
  CircleUser, Search, ChevronRight, ArrowLeft, Plus, LogOut,
  Home, Boxes, ArrowLeftRight, BarChart3, Check, ChevronDown, Loader2,
  Ban, RotateCcw, Trash2, AlertTriangle, CheckCircle2, Circle, Upload, Camera, Settings, Download, X,
  Zap, Droplets, Cog, Flame, Hammer, Gauge, Wrench, Activity,
  Warehouse, HardHat, Truck, Car, FileText,
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

const diasEn = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso)) / 86400000)) : null);
const textoDias = (d) => (d === null ? "" : d === 0 ? "hoy" : d === 1 ? "1 día" : `${d} días`);
const fechaCorta = (iso) => {
  const d = typeof iso === "string" && iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString("es-PR", { day: "2-digit", month: "short", year: "numeric" });
};

const comprimirFoto = async (file, maxW = 1200, calidad = 0.8) => {
  const bmp = await createImageBitmap(file);
  const esc = Math.min(1, maxW / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * esc);
  c.height = Math.round(bmp.height * esc);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob(r, "image/jpeg", calidad));
};

const MAX_DOCS = 5;

const servicioVencido = (e) =>
  e.ultimo_servicio && e.intervalo_servicio_dias
    ? diasEn(e.ultimo_servicio) > e.intervalo_servicio_dias
    : false;

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

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6"
      style={{ fontFamily: FONT, paddingTop: SAFE_TOP, backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0" style={{ background: "rgba(22,35,58,0.74)" }} />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <img src={etsLogo} alt="ETS — Epoxy Technologies Systems" className="mx-auto" style={{ width: 210 }} />
          <div className="text-center text-slate-500 mt-3" style={{ fontSize: 13 }}>Control de equipos · Almacén principal</div>
          <div className="border-t border-slate-200 my-4" />

          {cargando && <div className="flex justify-center py-8 text-slate-400"><Loader2 className="animate-spin" /></div>}
          {errCarga && <div className="text-center text-red-600 text-sm py-6">{errCarga}</div>}

          {!cargando && !errCarga && !sel && (
            <>
              <div className="text-slate-500 mb-3" style={{ fontSize: 15 }}>¿Quién eres?</div>
              <div className="flex flex-col gap-2">
                {usuarios.map((u) => <UserRow key={u.id} u={u} onClick={() => { setSel(u); setErr(""); }} />)}
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
        <div className="text-center mt-4" style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>ETS Corporation · Caguas, Puerto Rico</div>
      </div>
    </div>
  );
}

function UserRow({ u, onClick }) {
  return (
    <button onClick={onClick} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center gap-3 text-left" style={{ minHeight: 60 }}>
      <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: "#eef1f6", color: NAVY }}>
        <CircleUser size={23} />
      </div>
      <div className="flex-1">
        <div className="font-medium text-slate-800" style={{ fontSize: 15 }}>{u.nombre}</div>
        <div className="text-slate-400" style={{ fontSize: 12 }}>{u.brigada || "Usuario"}</div>
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
  const [detailBack, setDetailBack] = useState("list");
  const [moveBack, setMoveBack] = useState("detail");
  const [filtro, setFiltro] = useState("todos");
  const [query, setQuery] = useState("");
  const [movs, setMovs] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [mants, setMants] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [vehSelId, setVehSelId] = useState(null);
  const [importMsg, setImportMsg] = useState("");

  const importarExcel = async (file) => {
    setImportMsg("Importando…");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const hoja = wb.Sheets["Equipos"] || wb.Sheets[wb.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });

      const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
      const tipoDe = (v) => {
        const t = norm(v);
        if (t.startsWith("proy")) return "proyecto";
        if (t.startsWith("cami")) return "camion";
        if (t.startsWith("tall")) return "taller";
        return "almacen";
      };
      const col = (fila, ...nombres) => {
        for (const k of Object.keys(fila)) if (nombres.includes(norm(k))) return String(fila[k]).trim();
        return "";
      };

      // Series existentes, sin mayúsculas ni espacios, para saltar duplicados
      const normSerie = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();
      const { data: existentes } = await supabase.from("equipos").select("serie");
      const series = new Set((existentes || equipos).map((e) => normSerie(e.serie)));
      // Categorías por nombre normalizado (sin mayúsculas ni acentos)
      const cats = new Map(categorias.map((c) => [norm(c.nombre), c.nombre]));

      let ok = 0, duplicadas = 0, incompletas = 0, errores = 0;
      for (const f of filas) {
        const nombre = col(f, "nombre");
        const serie = col(f, "numero de serie", "num de serie", "serie");
        if (!nombre || !serie) { incompletas++; continue; }
        if (series.has(normSerie(serie))) { duplicadas++; continue; }
        let categoria = col(f, "categoria") || "Herramienta";
        if (cats.has(norm(categoria))) categoria = cats.get(norm(categoria));
        else {
          await supabase.from("categorias").insert({ nombre: categoria });
          cats.set(norm(categoria), categoria);
        }
        const tipo = tipoDe(col(f, "ubicacion"));
        const detalle = col(f, "detalle") || (tipo === "almacen" ? "Almacén principal" : "");

        const { data } = await supabase.from("equipos").insert({
          nombre, serie, categoria, ubicacion_tipo: tipo, ubicacion_detalle: detalle,
        }).select().single();
        if (data) {
          await supabase.from("movimientos").insert({
            equipo_id: data.id, usuario_id: session.id, usuario_nombre: session.nombre,
            a_tipo: tipo, a_detalle: detalle, nota: "Alta de equipo (importación Excel)",
          });
          series.add(normSerie(serie));
          ok++;
        } else errores++;
      }
      await cargarDatos();
      setImportMsg(`Importados ${ok} equipos. Saltados: ${duplicadas} por número de serie duplicado, ${incompletas} por faltar nombre o serie.`
        + (errores ? ` ${errores} con error al guardar.` : ""));
    } catch (e) {
      setImportMsg("No se pudo leer el archivo. Verifica que sea la plantilla de Excel.");
    }
  };

  const descargarPlantilla = () => {
    const wsEq = XLSX.utils.aoa_to_sheet([["Nombre", "Numero de Serie", "Categoria", "Ubicacion", "Detalle"]]);
    wsEq["!cols"] = [{ wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 28 }];
    const wsIns = XLSX.utils.aoa_to_sheet([
      ["Instrucciones"],
      ["Cada fila de la hoja \"Equipos\" es una máquina."],
      ["Nombre y Numero de Serie son obligatorios."],
      ["Ubicacion puede ser: Almacén, Proyecto, Camión o Taller."],
      ["Categoria debe usar los nombres de Administración > Categorías (ver hoja \"Categorias\")."],
      [],
      ["Ejemplo:"],
      ["Nombre", "Numero de Serie", "Categoria", "Ubicacion", "Detalle"],
      ["Vacuum Pequeño", "VAC-P-00", "Vacuum", "Almacén", "Mezzanine / 1er piso"],
    ]);
    wsIns["!cols"] = [{ wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 28 }];
    const wsCat = XLSX.utils.aoa_to_sheet([["Categoria"], ...categorias.map((c) => [c.nombre])]);
    wsCat["!cols"] = [{ wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsEq, "Equipos");
    XLSX.utils.book_append_sheet(wb, wsIns, "Instrucciones");
    XLSX.utils.book_append_sheet(wb, wsCat, "Categorias");
    XLSX.writeFile(wb, "ETS_Plantilla_Equipos.xlsx");
  };

  const cargarDatos = useCallback(async () => {
    const [eq, ub, veh, mf, cats] = await Promise.all([
      supabase.from("equipos").select("*").order("nombre"),
      supabase.from("ubicaciones").select("*").eq("activo", true).order("nombre"),
      supabase.from("vehiculos").select("*").eq("activo", true).order("nombre"),
      supabase.from("mantenimientos_flota").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false }).limit(500),
      supabase.from("categorias").select("*").eq("activo", true).order("nombre"),
    ]);
    setEquipos(eq.data || []);
    // Si la tabla de categorías falla, usar la lista fija como respaldo
    setCategorias(cats.error ? CATEGORIAS.map((nombre) => ({ id: `local-${nombre}`, nombre })) : cats.data || []);
    setUbicaciones(ub.data || []);
    setVehiculos(veh.data || []);
    setMants(mf.data || []);
    setBrigadas((ub.data || []).filter((u) => u.tipo === "brigada").map((u) => u.nombre));
    setCargando(false);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const openDetail = useCallback(async (id, from = "list") => {
    setSelectedId(id); setDetailBack(from); setView("detail"); setMovs([]);
    const { data } = await supabase.from("movimientos").select("*").eq("equipo_id", id).order("created_at", { ascending: false });
    setMovs(data || []);
  }, []);

  const toggleSeleccion = (id) =>
    setSeleccion((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const selected = equipos.find((e) => e.id === selectedId);

  const conteo = useMemo(() => {
    const c = { almacen: 0, proyecto: 0, camion: 0, taller: 0 };
    equipos.forEach((e) => { if (e.condicion !== "baja") c[e.ubicacion_tipo] += 1; });
    return c;
  }, [equipos]);

  const subirFotoMov = async (file) => {
    try {
      const blob = await comprimirFoto(file);
      const path = `mov-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("fotos").upload(path, blob, { contentType: "image/jpeg" });
      if (error) return null;
      return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
    } catch { return null; }
  };

  const mover = async (tipo, detalle, nota, fotoFile) => {
    const eq = selected;
    const fotoUrl = fotoFile ? await subirFotoMov(fotoFile) : null;
    await supabase.from("equipos").update({
      ubicacion_tipo: tipo, ubicacion_detalle: detalle, ubicado_desde: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", eq.id);
    await supabase.from("movimientos").insert({
      equipo_id: eq.id, usuario_id: session.id, usuario_nombre: session.nombre,
      de_tipo: eq.ubicacion_tipo, de_detalle: eq.ubicacion_detalle,
      a_tipo: tipo, a_detalle: detalle, nota: nota || null, foto_url: fotoUrl,
    });
    await cargarDatos();
    await openDetail(eq.id, detailBack || "list");
  };

  const moverVarias = async (asigs, nota, fotoFile) => {
    const fotoUrl = fotoFile ? await subirFotoMov(fotoFile) : null;
    for (const a of asigs) {
      const eq = equipos.find((e) => e.id === a.id);
      await supabase.from("equipos").update({
        ubicacion_tipo: a.tipo, ubicacion_detalle: a.detalle, ubicado_desde: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq("id", a.id);
      await supabase.from("movimientos").insert({
        equipo_id: a.id, usuario_id: session.id, usuario_nombre: session.nombre,
        de_tipo: eq.ubicacion_tipo, de_detalle: eq.ubicacion_detalle,
        a_tipo: a.tipo, a_detalle: a.detalle, nota: nota || null, foto_url: fotoUrl,
      });
    }
    await cargarDatos();
  };

  const agregarVehiculo = async (nombre, tipo, placa) => {
    await supabase.from("vehiculos").insert({ nombre, tipo, placa: placa || null });
    await cargarDatos();
  };

  const eliminarVehiculo = async (id) => {
    await supabase.from("vehiculos").delete().eq("id", id);
    setView("flota");
    await cargarDatos();
  };

  const registrarMant = async (vehiculoId, tipo, fecha, nota, archivos = []) => {
    const documentos = [], fallidos = [];
    for (const [i, f] of archivos.entries()) {
      try {
        const esPdf = f.type === "application/pdf";
        // Recibos: resolución alta para que el texto se lea bien
        const body = esPdf ? f : await comprimirFoto(f, 2000, 0.8);
        const path = `mantenimientos/${Date.now()}-${i}.${esPdf ? "pdf" : "jpg"}`;
        const { error } = await supabase.storage.from("fotos").upload(path, body, { contentType: esPdf ? "application/pdf" : "image/jpeg" });
        if (error) throw error;
        documentos.push({ url: supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl, tipo: esPdf ? "pdf" : "imagen", nombre: f.name });
      } catch { fallidos.push(f.name); }
    }
    if (fallidos.length) alert(`No se pudieron subir estos archivos: ${fallidos.join(", ")}. El mantenimiento se guarda con los demás.`);
    await supabase.from("mantenimientos_flota").insert({
      vehiculo_id: vehiculoId, tipo, fecha, nota: nota || null,
      usuario_id: session.id, usuario_nombre: session.nombre, documentos,
    });
    await cargarDatos();
  };

  const eliminarMant = async (id) => {
    const m = mants.find((x) => x.id === id);
    const paths = (m?.documentos || [])
      .map((d) => decodeURIComponent(String(d.url).split("/object/public/fotos/")[1] || ""))
      .filter(Boolean);
    if (paths.length) await supabase.storage.from("fotos").remove(paths);
    await supabase.from("mantenimientos_flota").delete().eq("id", id);
    await cargarDatos();
  };

  const registrarServicio = async (eq) => {
    await supabase.from("equipos").update({
      ultimo_servicio: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString(),
    }).eq("id", eq.id);
    await supabase.from("movimientos").insert({
      equipo_id: eq.id, usuario_id: session.id, usuario_nombre: session.nombre,
      a_tipo: eq.ubicacion_tipo, a_detalle: eq.ubicacion_detalle, nota: "Servicio de mantenimiento realizado",
    });
    await cargarDatos();
    await openDetail(eq.id, detailBack);
  };

  const cambiarIntervalo = async (eq, dias) => {
    await supabase.from("equipos").update({ intervalo_servicio_dias: dias, updated_at: new Date().toISOString() }).eq("id", eq.id);
    await cargarDatos();
    await openDetail(eq.id, detailBack);
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
      await openDetail(data.id, "list");
    }
  };

  const subirFoto = async (eq, file) => {
    try {
      const bmp = await createImageBitmap(file);
      const max = 1200;
      const esc = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * esc);
      canvas.height = Math.round(bmp.height * esc);
      canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.8));

      const path = `${eq.id}.jpg`;
      const { error } = await supabase.storage.from("fotos").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) { alert("No se pudo subir la foto. Verifica el bucket 'fotos' en Supabase."); return; }
      const { data } = supabase.storage.from("fotos").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from("equipos").update({ foto_url: url, updated_at: new Date().toISOString() }).eq("id", eq.id);
      await cargarDatos();
      await openDetail(eq.id, detailBack);
    } catch {
      alert("No se pudo procesar la foto.");
    }
  };

  const agregarUbicacion = async (tipo, nombre) => {
    await supabase.from("ubicaciones").insert({ tipo, nombre });
    await cargarDatos();
  };

  const eliminarUbicacion = async (id) => {
    await supabase.from("ubicaciones").delete().eq("id", id);
    await cargarDatos();
  };

  const agregarCategoria = async (nombre) => {
    const { error } = await supabase.from("categorias").insert({ nombre });
    if (error) alert("No se pudo añadir la categoría: " + error.message);
    await cargarDatos();
  };

  const eliminarCategoria = async (id) => {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) alert("No se pudo eliminar la categoría: " + error.message);
    await cargarDatos();
  };

  const darBaja = async (eq) => {
    const nueva = eq.condicion === "baja" ? "operativo" : "baja";
    await supabase.from("equipos").update({ condicion: nueva, updated_at: new Date().toISOString() }).eq("id", eq.id);
    await supabase.from("movimientos").insert({
      equipo_id: eq.id, usuario_id: session.id, usuario_nombre: session.nombre,
      a_tipo: eq.ubicacion_tipo, a_detalle: eq.ubicacion_detalle,
      nota: nueva === "baja" ? "Dado de baja" : "Reactivado",
    });
    await cargarDatos();
    await openDetail(eq.id, detailBack);
  };

  const eliminar = async (eq) => {
    await supabase.from("equipos").delete().eq("id", eq.id);
    await cargarDatos();
    setView(detailBack || "list");
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col" style={{ fontFamily: FONT }}>
      {cargando ? (
        <div className="flex-1 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="flex-1 flex flex-col">
          {view === "list" && (
            <ListView modo="inicio" equipos={equipos} conteo={conteo} filtro={filtro} setFiltro={setFiltro}
              query={query} setQuery={setQuery} onItem={(id) => openDetail(id, "list")} session={session} onLogout={onLogout}
              onAdmin={() => setView("admin")} onFlota={() => setView("flota")} />
          )}
          {view === "flota" && (
            <FlotaView vehiculos={vehiculos} mants={mants} isAdmin={session.rol === "admin"}
              onBack={() => setView("list")} onOpen={(id) => { setVehSelId(id); setView("flotaDetail"); }}
              onAdd={agregarVehiculo} />
          )}
          {view === "flotaDetail" && vehiculos.find((v) => v.id === vehSelId) && (
            <VehiculoView vehiculo={vehiculos.find((v) => v.id === vehSelId)}
              mants={mants.filter((m) => m.vehiculo_id === vehSelId)}
              isAdmin={session.rol === "admin"}
              onBack={() => setView("flota")} onRegistrar={registrarMant}
              onEliminarMant={eliminarMant} onEliminarVeh={eliminarVehiculo} />
          )}
          {view === "admin" && (session.rol === "admin" || session.rol === "pm") && (
            <AdminView ubicaciones={ubicaciones} categorias={categorias} onBack={() => setView("list")}
              soloProyectos={session.rol === "pm"}
              onAdd={agregarUbicacion} onDelete={eliminarUbicacion}
              onAddCategoria={agregarCategoria} onDeleteCategoria={eliminarCategoria} />
          )}
          {view === "equipos" && (
            <ListView modo="equipos" equipos={equipos} conteo={conteo} filtro={filtro} setFiltro={setFiltro}
              query={query} setQuery={setQuery} onItem={(id) => openDetail(id, "equipos")}
              isAdmin={session.rol === "admin"} onImport={importarExcel} onPlantilla={descargarPlantilla} importMsg={importMsg} onCerrarMsg={() => setImportMsg("")} />
          )}
          {view === "mover" && (
            <ListView modo="mover" equipos={equipos} conteo={conteo} filtro={filtro} setFiltro={setFiltro}
              query={query} setQuery={setQuery} onItem={toggleSeleccion} seleccion={seleccion}
              onContinuar={() => setView("movemulti")} />
          )}
          {view === "movemulti" && (
            <MultiMoveView equipos={equipos.filter((e) => seleccion.includes(e.id))} ubicaciones={ubicaciones} brigadas={brigadas}
              onBack={() => setView("mover")}
              onConfirm={async (asigs, nota, foto) => { await moverVarias(asigs, nota, foto); setSeleccion([]); setView("list"); }} />
          )}
          {view === "detail" && selected && (
            <DetailView equipo={selected} movs={movs} onBack={() => setView(detailBack)} isAdmin={session.rol === "admin"}
              onMover={() => { setMoveBack("detail"); setView("move"); }} onBaja={darBaja} onEliminar={eliminar} onFoto={subirFoto}
              onServicio={registrarServicio} onIntervalo={cambiarIntervalo} />
          )}
          {view === "move" && selected && (
            <MoveView equipo={selected} ubicaciones={ubicaciones} brigadas={brigadas}
              onBack={() => setView(moveBack)} onConfirm={async (t, d, n, f) => { await mover(t, d, n, f); }} />
          )}
          {view === "nuevo" && (
            <NuevoView ubicaciones={ubicaciones} categorias={categorias.map((c) => c.nombre)} onBack={() => setView("list")} onSave={async (eq) => { await agregar(eq); }} />
          )}
          {view === "reportes" && <ReportesView equipos={equipos} conteo={conteo} />}
        </div>
      )}
      <BottomNav view={view} setView={setView} />
    </div>
  );
}

function Pill({ equipo }) {
  if (equipo.condicion === "baja")
    return <span className="px-2.5 py-1 rounded-md whitespace-nowrap bg-slate-200 text-slate-600" style={{ fontSize: 12 }}>Retirado</span>;
  const m = tipoMeta[equipo.ubicacion_tipo];
  return <span className={`px-2.5 py-1 rounded-md whitespace-nowrap ${m.pill}`} style={{ fontSize: 12 }}>{m.label}</span>;
}
function CatTile({ cat, foto, size = 44 }) {
  if (foto) {
    return <img src={foto} alt="" className="rounded-lg shrink-0" style={{ width: size, height: size, objectFit: "cover" }} />;
  }
  const Icon = catIcon[cat] || Wrench;
  return (
    <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: size, height: size, background: "#eef1f6", color: NAVY }}>
      <Icon size={size * 0.5} strokeWidth={1.8} />
    </div>
  );
}

function ListView({ modo, equipos, conteo, filtro, setFiltro, query, setQuery, onItem, session, onLogout, seleccion = [], onContinuar, isAdmin, onImport, onPlantilla, importMsg, onCerrarMsg, onAdmin, onFlota }) {
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

function DetailView({ equipo, movs, onBack, onMover, onBaja, onEliminar, isAdmin, onFoto, onServicio, onIntervalo }) {
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

function MultiMoveView({ equipos, ubicaciones, brigadas, onBack, onConfirm }) {
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

function NuevoView({ ubicaciones, categorias, onBack, onSave }) {
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
        <Select label="Categoría" value={cat} onChange={setCat} options={categorias} placeholder="Escoge categoría" />
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

const TIPOS_VEH = { camion: "Camión", pickup: "Pickup", van: "Van", otro: "Otro" };
const TIPOS_MANT = ["Cambio de aceite", "Gomas", "Frenos", "Batería", "Filtros", "Reparación", "Inspección / Marbete", "Otro"];

function FlotaView({ vehiculos, mants, isAdmin, onBack, onOpen, onAdd }) {
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

function VehiculoView({ vehiculo, mants, isAdmin, onBack, onRegistrar, onEliminarMant, onEliminarVeh }) {
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

function AdminView({ ubicaciones, categorias, onBack, onAdd, onDelete, onAddCategoria, onDeleteCategoria, soloProyectos = false }) {
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

function ReportesView({ equipos, conteo }) {
  const [tab, setTab] = useState("resumen");
  const [acts, setActs] = useState(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (tab === "actividad" && acts === null) {
      (async () => {
        const { data } = await supabase.from("movimientos").select("*").order("created_at", { ascending: false }).limit(100);
        setActs(data || []);
      })();
    }
  }, [tab, acts]);

  const nombreEq = (id) => equipos.find((e) => e.id === id)?.nombre || "(equipo eliminado)";

  const activos = equipos.filter((e) => e.condicion !== "baja");
  const porCat = useMemo(() => {
    const c = {};
    activos.forEach((e) => (c[e.categoria] = (c[e.categoria] || 0) + 1));
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [equipos]);
  const total = activos.length;
  const max = Math.max(...porCat.map(([, n]) => n), 1);
  const hoy = () => new Date().toISOString().slice(0, 10);

  const exportInventario = () => {
    const rows = equipos.map((e) => ({
      "Nombre": e.nombre,
      "Numero de Serie": e.serie,
      "Categoria": e.categoria || "",
      "Ubicacion": tipoMeta[e.ubicacion_tipo]?.loc || "",
      "Detalle": e.ubicacion_detalle || "",
      "Estado": e.condicion === "baja" ? "Retirado" : (tipoMeta[e.ubicacion_tipo]?.label || ""),
      "En ubicacion desde": e.ubicado_desde ? new Date(e.ubicado_desde).toLocaleDateString("es-PR") : "",
      "Dias en ubicacion": e.ubicado_desde ? diasEn(e.ubicado_desde) : "",
      "Ultimo servicio": e.ultimo_servicio ? new Date(e.ultimo_servicio).toLocaleDateString("es-PR") : "",
      "Servicio vencido": servicioVencido(e) ? "SI" : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `ETS_Inventario_${hoy()}.xlsx`);
  };

  const exportHistorial = async () => {
    setExportando(true);
    const { data } = await supabase.from("movimientos").select("*").order("created_at", { ascending: false }).limit(2000);
    const rows = (data || []).map((m) => ({
      "Fecha": fmtFecha(m.created_at),
      "Equipo": nombreEq(m.equipo_id),
      "De": formatUbic(m.de_tipo, m.de_detalle),
      "A": formatUbic(m.a_tipo, m.a_detalle),
      "Usuario": m.usuario_nombre || "",
      "Nota": m.nota || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 16 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, `ETS_Historial_${hoy()}.xlsx`);
    setExportando(false);
  };

  return (
    <div className="flex-1 pb-28">
      <SubHeader title="Reportes" />
      <div className={`${WRAP} p-4`}>

        <div className="flex gap-2 pb-1">
          {[["resumen", "Resumen"], ["actividad", "Actividad reciente"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3.5 py-2 rounded-full whitespace-nowrap border ${tab === k ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200"}`}
              style={{ fontSize: 13, ...(tab === k ? { background: NAVY } : {}) }}>{l}</button>
          ))}
        </div>

        {tab === "resumen" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <button onClick={exportInventario}
                className="rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2 text-slate-700"
                style={{ minHeight: 50, fontSize: 14 }}>
                <Download size={17} /> Exportar inventario (Excel)
              </button>
              <button onClick={exportHistorial} disabled={exportando}
                className="rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2 text-slate-700"
                style={{ minHeight: 50, fontSize: 14 }}>
                {exportando ? <Loader2 size={17} className="animate-spin" /> : <><Download size={17} /> Exportar historial (Excel)</>}
              </button>
            </div>

            <div className="text-center text-slate-400 mt-4" style={{ fontSize: 11 }}>Equipos activos: {total}</div>
          </>
        )}

        {tab === "actividad" && (
          <div className="mt-3 flex flex-col gap-2.5">
            {acts === null && <div className="flex justify-center py-8 text-slate-400"><Loader2 className="animate-spin" /></div>}
            {acts !== null && acts.length === 0 && <div className="text-center text-slate-400 text-sm py-8">Sin movimientos todavía.</div>}
            {(acts || []).map((mv) => (
              <div key={mv.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="font-medium text-slate-800" style={{ fontSize: 14 }}>{nombreEq(mv.equipo_id)}</div>
                <div className="flex items-center gap-2 text-slate-700 mt-1" style={{ fontSize: 13 }}>
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
        )}
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
        {item("mover", ArrowLeftRight, "Mover", view === "mover")}
        {item("equipos", Boxes, "Equipos", view === "equipos")}
      </div>
    </div>
  );
}