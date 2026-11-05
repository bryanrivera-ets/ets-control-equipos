import {
  ArrowLeft,
} from "lucide-react";
import { NAVY, WRAP, SAFE_TOP } from "../lib/constants";

export function SubHeader({ title, onBack }) {
  return (
    <div style={{ background: NAVY, paddingTop: SAFE_TOP }} className="px-4 pb-4">
      <div className={`${WRAP} flex items-center gap-3`}>
        {onBack && <button onClick={onBack} className="text-white"><ArrowLeft size={23} /></button>}
        <div className="text-white font-medium" style={{ fontSize: 17 }}>{title}</div>
      </div>
    </div>
  );
}
