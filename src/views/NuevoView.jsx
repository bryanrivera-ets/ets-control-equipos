import { useState } from "react";
import {
  Plus, Loader2,
} from "lucide-react";
import { NAVY, AMBER, WRAP } from "../lib/constants";
import { SubHeader } from "../components/SubHeader";
import { Select } from "../components/Select";

export function NuevoView({ ubicaciones, categorias, onBack, onSave }) {
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
