import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import * as XLSX from "xlsx";
import {
  CircleUser, ArrowLeftRight, Loader2, Download,
} from "lucide-react";
import { NAVY, WRAP, tipoMeta } from "../lib/constants";
import { fmtFecha, formatUbic, diasEn, servicioVencido } from "../lib/utils";
import { SubHeader } from "../components/SubHeader";

export function ReportesView({ equipos, conteo }) {
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
