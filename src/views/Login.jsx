import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import heroBg from "../assets/hero.png";
import etsLogo from "../assets/ets-logo.png";
import {
  CircleUser, ChevronRight, ArrowLeft, Loader2,
} from "lucide-react";
import { NAVY, AMBER, FONT, SAFE_TOP } from "../lib/constants";

/* ------------------------------------------------------------------ LOGIN */
export function Login({ onLogin }) {
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

export function UserRow({ u, onClick }) {
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
