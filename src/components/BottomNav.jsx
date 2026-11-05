import {
  Plus, Home, Boxes, ArrowLeftRight, BarChart3,
} from "lucide-react";
import { NAVY, AMBER, WRAP } from "../lib/constants";

export function BottomNav({ view, setView }) {
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
