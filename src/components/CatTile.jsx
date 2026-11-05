import {
  Wrench,
} from "lucide-react";
import { NAVY, catIcon } from "../lib/constants";

export function CatTile({ cat, foto, size = 44 }) {
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
