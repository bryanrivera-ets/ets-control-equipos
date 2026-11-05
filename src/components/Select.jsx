import {
  ChevronDown,
} from "lucide-react";

export function Select({ label, value, onChange, options, placeholder }) {
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
