import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";
import {
  Loader2,
} from "lucide-react";
import { FONT, CATEGORIAS } from "./lib/constants";
import { comprimirFoto } from "./lib/utils";
import { BottomNav } from "./components/BottomNav";
import { Login } from "./views/Login";
import { ListView } from "./views/ListView";
import { DetailView } from "./views/DetailView";
import { MoveView } from "./views/MoveView";
import { MultiMoveView } from "./views/MultiMoveView";
import { NuevoView } from "./views/NuevoView";
import { FlotaView } from "./views/FlotaView";
import { VehiculoView } from "./views/VehiculoView";
import { AdminView } from "./views/AdminView";
import { ReportesView } from "./views/ReportesView";

export default function App() {
  const [session, setSession] = useState(null);
  if (!session) return <Login onLogin={setSession} />;
  return <Main session={session} onLogout={() => setSession(null)} />;
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
