import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { X, Loader2, CameraOff } from "lucide-react";
import { NAVY, AMBER, SAFE_TOP } from "../lib/constants";
import { idDesdeTexto } from "../lib/qr";

// Pantalla de escanear: cámara trasera leyendo códigos QR en vivo
export function ScanView({ equipos, onClose, onEncontrado }) {
  const videoRef = useRef(null);
  const [estado, setEstado] = useState("iniciando"); // iniciando | listo | error
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [intento, setIntento] = useState(0);

  // Datos y callbacks actuales, para leerlos dentro del escáner sin reiniciarlo
  const actual = useRef({ equipos, onEncontrado });
  useEffect(() => { actual.current = { equipos, onEncontrado }; }, [equipos, onEncontrado]);

  useEffect(() => {
    let cancelado = false;
    let ultimo = { texto: "", t: 0 };
    let avisoTimer = null;
    let encontrado = false;

    const alLeer = (res) => {
      if (encontrado) return;
      const texto = res.data;
      const ahora = Date.now();
      if (texto === ultimo.texto && ahora - ultimo.t < 2500) return; // el mismo código se lee muchas veces seguidas
      ultimo = { texto, t: ahora };

      const id = idDesdeTexto(texto);
      const eq = id && actual.current.equipos.find((e) => String(e.id) === id);
      if (eq) {
        encontrado = true;
        actual.current.onEncontrado(eq.id);
        return;
      }
      setAviso("Código no reconocido");
      clearTimeout(avisoTimer);
      avisoTimer = setTimeout(() => setAviso(""), 2500);
    };

    const scanner = new QrScanner(videoRef.current, alLeer, {
      preferredCamera: "environment",
      returnDetailedScanResult: true,
      highlightScanRegion: true,
      highlightCodeOutline: true,
      maxScansPerSecond: 8,
    });

    const iniciar = async () => {
      setEstado("iniciando"); setError("");
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setEstado("error");
        setError("Este navegador no permite usar la cámara aquí. Abre la app desde su dirección segura (https).");
        return;
      }
      try {
        await scanner.start();
        if (!cancelado) setEstado("listo");
      } catch {
        if (cancelado) return;
        let denegado = false;
        try {
          const p = await navigator.permissions?.query({ name: "camera" });
          denegado = p?.state === "denied";
        } catch { /* el navegador no permite consultar el permiso */ }
        setEstado("error");
        setError(denegado
          ? "No diste permiso para usar la cámara. Para escanear, permite el acceso a la cámara en los ajustes del navegador (en iPad: Configuración > Safari > Cámara) y vuelve a intentarlo."
          : "No se pudo abrir la cámara. Revisa que hayas dado permiso para usar la cámara y que ninguna otra app la esté usando.");
      }
    };
    iniciar();

    return () => {
      cancelado = true;
      clearTimeout(avisoTimer);
      scanner.stop();
      scanner.destroy();
    };
  }, [intento]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div style={{ background: NAVY, paddingTop: SAFE_TOP }} className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="text-white font-medium" style={{ fontSize: 17 }}>Escanear código QR</div>
          <button onClick={onClose} title="Cerrar" className="text-white flex items-center gap-1.5" style={{ fontSize: 14 }}>
            <X size={22} /> Cerrar
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="w-full h-full" style={{ objectFit: "cover" }} playsInline muted />

        {estado === "iniciando" && (
          <div className="absolute inset-0 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>
        )}

        {estado === "listo" && (
          <div className="absolute left-0 right-0 flex justify-center px-4" style={{ bottom: "calc(28px + env(safe-area-inset-bottom))" }}>
            {aviso ? (
              <div className="rounded-xl px-4 py-2.5 font-medium" style={{ background: "#dc2626", color: "#fff", fontSize: 15 }}>{aviso}</div>
            ) : (
              <div className="rounded-xl px-4 py-2.5" style={{ background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 14 }}>
                Apunta la cámara al código QR del equipo
              </div>
            )}
          </div>
        )}

        {estado === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-black">
            <div className="bg-white rounded-xl p-5 text-center" style={{ maxWidth: 380 }}>
              <CameraOff size={30} className="mx-auto text-slate-400" />
              <div className="text-slate-700 mt-3" style={{ fontSize: 14 }}>{error}</div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white text-slate-600" style={{ minHeight: 46, fontSize: 14 }}>Cerrar</button>
                <button onClick={() => setIntento((n) => n + 1)} className="rounded-xl font-medium" style={{ minHeight: 46, fontSize: 14, background: AMBER, color: NAVY }}>Reintentar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
