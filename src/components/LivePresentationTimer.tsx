import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Volume2, 
  VolumeX, 
  Clock, 
  Award, 
  Maximize2,
  ExternalLink,
  Presentation,
  FileCheck,
  FileText
} from "lucide-react";
import { Booking, BookingStatus, saveBookingStatus } from "../firebase";
import PresentationViewerModal from "./PresentationViewerModal";

interface LivePresentationTimerProps {
  bookings: Booking[];
  onOpenRubric: (booking: Booking) => void;
  onRefresh: () => Promise<void>;
}

export default function LivePresentationTimer({ bookings, onOpenRubric, onRefresh }: LivePresentationTimerProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(() => {
    const pending = bookings.find(b => b.status !== "concluido");
    return pending ? pending.id : (bookings[0]?.id || "");
  });

  const [initialDuration, setInitialDuration] = useState<number>(20 * 60); // default 20 min in seconds
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [viewingPdf, setViewingPdf] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync selected booking if current one not found
  useEffect(() => {
    if (!selectedBookingId && bookings.length > 0) {
      setSelectedBookingId(bookings[0].id);
    }
  }, [bookings, selectedBookingId]);

  const currentBooking = bookings.find(b => b.id === selectedBookingId);

  // Auto-set duration based on turma
  useEffect(() => {
    if (currentBooking) {
      const is15Min = currentBooking.turmaId === "turma-4" || currentBooking.turmaId === "turma-5";
      const targetDuration = is15Min ? 15 * 60 : 20 * 60;
      setInitialDuration(targetDuration);
      if (!isRunning) {
        setTimeLeft(targetDuration);
      }
    }
  }, [selectedBookingId, currentBooking]);

  // Web Audio chime function
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playChime();
            return 0;
          }
          if (prev === 60 || prev === 300) {
            playChime(); // Alert at 5 min and 1 min
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
    if (!isRunning && currentBooking && currentBooking.status !== "apresentando") {
      saveBookingStatus(currentBooking.id, "apresentando").then(onRefresh);
    }
  };

  const handleReset = (duration: number = initialDuration) => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const handleAddMinutes = (mins: number) => {
    setTimeLeft(prev => Math.max(0, prev + mins * 60));
  };

  const handleSetPreset = (minutes: number) => {
    setIsRunning(false);
    setInitialDuration(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  const handleMarkStatus = async (status: BookingStatus) => {
    if (!currentBooking) return;
    await saveBookingStatus(currentBooking.id, status);
    await onRefresh();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const percentage = Math.round(((initialDuration - timeLeft) / initialDuration) * 100);
  const isDanger = timeLeft <= 60 && timeLeft > 0;
  const isWarning = timeLeft <= 300 && timeLeft > 60;
  const isFinished = timeLeft === 0;

  const timerColor = isFinished 
    ? "text-[#D0201A] bg-[#FDECEA] border-[#D0201A]" 
    : isDanger 
      ? "text-[#D0201A] bg-[#FDECEA] border-[#D0201A] animate-pulse" 
      : isWarning 
        ? "text-[#F4B740] bg-amber-50 border-[#F4B740]" 
        : "text-[#0A1733] bg-[#F3F5FA] border-[#DFE4EE]";

  return (
    <div className={`bg-white border border-[#DFE4EE] rounded-2xl p-6 sm:p-8 space-y-6 ${fullscreen ? "fixed inset-4 z-50 overflow-y-auto max-w-5xl mx-auto shadow-2xl" : "shadow-sm"}`}>
      {/* Top Deck Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE4EE] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[10px] font-bold uppercase tracking-wider">
              Console ao Vivo
            </span>
            <span className="text-xs font-semibold text-[#66728C]">Bancas UniCarioca 2026/2</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A1733] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D0201A]" />
            Cronômetro de Apresentação
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-full border transition ${
              soundEnabled 
                ? "bg-[#F3F5FA] border-[#DFE4EE] text-[#0A1733] hover:bg-slate-100" 
                : "bg-[#FDECEA] border-[#D0201A]/30 text-[#D0201A]"
            }`}
            title={soundEnabled ? "Sons ativados (clique para mutar)" : "Som desativado"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2.5 rounded-full border border-[#DFE4EE] bg-[#F3F5FA] hover:bg-slate-100 text-[#0A1733] transition"
            title={fullscreen ? "Sair da tela cheia" : "Modo Apresentação Expandido"}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Select Group & Current Presentation Info */}
      <div className="grid md:grid-cols-3 gap-6 items-center">
        {/* Group Selector Column */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-[#D0201A] uppercase tracking-wider block">
            Selecionar Apresentação
          </label>
          <select
            value={selectedBookingId}
            onChange={(e) => {
              setSelectedBookingId(e.target.value);
              handleReset();
            }}
            className="w-full bg-[#F3F5FA] border border-[#DFE4EE] focus:border-[#D0201A] p-3 rounded-xl text-xs font-bold text-[#0A1733] focus:outline-none transition cursor-pointer"
          >
            {bookings.length === 0 ? (
              <option value="">Nenhum agendamento cadastrado</option>
            ) : (
              bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.turmaCode || ""} • {b.slot} • {b.projectTitle.slice(0, 28)} ({b.status || "agendado"})
                </option>
              ))
            )}
          </select>

          {currentBooking && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-[#66728C] uppercase tracking-wider block mb-1.5">
                Status da Banca:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["presente", "apresentando", "concluido", "ausente"] as BookingStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleMarkStatus(st)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition border ${
                      currentBooking.status === st
                        ? "bg-[#D0201A] text-white border-[#D0201A]"
                        : "bg-[#F3F5FA] text-[#34415E] border-[#DFE4EE] hover:bg-slate-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Big Interactive Timer Counter */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[#DFE4EE] space-y-3 md:col-span-2 bg-gradient-to-b from-white to-[#F3F5FA]">
          {currentBooking && (
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-xs font-bold text-white bg-[#0A1733] px-2.5 py-0.5 rounded-full">
                  {currentBooking.turmaCode || "Turma"}
                </span>
                <span className="text-xs font-bold text-[#D0201A] bg-[#FDECEA] border border-[#D0201A]/30 px-2.5 py-0.5 rounded-full">
                  {currentBooking.slot}
                </span>
              </div>
              <h3 className="font-bold text-[#0A1733] text-lg sm:text-xl">
                {currentBooking.projectTitle}
              </h3>
              <p className="text-xs text-[#66728C] font-medium line-clamp-1 max-w-md">
                {currentBooking.members}
              </p>
              {(currentBooking.presentationLink || currentBooking.presentationFileName || currentBooking.presentationFileData) && (
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                  {currentBooking.presentationFileData && (
                    <button
                      onClick={() => setViewingPdf(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                      title="Acessar e visualizar o arquivo PDF da equipe"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Acessar PDF da Apresentação
                    </button>
                  )}
                  {currentBooking.presentationLink && (
                    <a
                      href={currentBooking.presentationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D0201A] text-white font-bold text-xs hover:bg-[#A3140F] transition shadow-xs"
                    >
                      <Presentation className="w-3.5 h-3.5" />
                      Abrir Slides Externos
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {currentBooking.presentationFileName && !currentBooking.presentationFileData && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs text-[#34415E]">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {currentBooking.presentationFileName}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Clock Display */}
          <div className={`px-8 py-3 rounded-2xl border font-mono font-bold text-5xl sm:text-7xl tracking-tighter ${timerColor} shadow-inner transition-colors`}>
            {formatTime(timeLeft)}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md bg-[#DFE4EE] h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isDanger ? "bg-[#D0201A]" : isWarning ? "bg-[#F4B740]" : "bg-[#0A1733]"
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-[#66728C] uppercase tracking-wider mr-1">Presets:</span>
            {[10, 15, 20, 25].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSetPreset(mins)}
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition ${
                  initialDuration === mins * 60
                    ? "bg-[#0A1733] text-white border-[#0A1733]"
                    : "bg-white text-[#34415E] border-[#DFE4EE] hover:bg-[#F3F5FA]"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Control Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleAddMinutes(-1)}
              className="p-3 bg-[#F3F5FA] hover:bg-slate-200 text-[#0A1733] rounded-full font-bold transition flex items-center gap-1 text-xs border border-[#DFE4EE]"
              title="Reduzir 1 minuto"
            >
              <Minus className="w-4 h-4" /> 1m
            </button>

            <button
              onClick={handleStartPause}
              className={`px-8 py-3 rounded-full text-white font-bold text-sm transition shadow-md flex items-center gap-2 ${
                isRunning
                  ? "bg-[#F4B740] hover:bg-amber-600"
                  : "btn-pill-red"
              }`}
              id="start-pause-timer-btn"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> Iniciar
                </>
              )}
            </button>

            <button
              onClick={() => handleReset()}
              className="p-3 bg-[#F3F5FA] hover:bg-slate-200 text-[#0A1733] rounded-full font-bold transition border border-[#DFE4EE]"
              title="Reiniciar cronômetro"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleAddMinutes(1)}
              className="p-3 bg-[#F3F5FA] hover:bg-slate-200 text-[#0A1733] rounded-full font-bold transition flex items-center gap-1 text-xs border border-[#DFE4EE]"
              title="Acrescentar 1 minuto"
            >
              <Plus className="w-4 h-4" /> 1m
            </button>
          </div>

          {/* Quick Evaluate Button */}
          {currentBooking && (
            <div className="pt-2 w-full max-w-sm flex gap-2">
              <button
                onClick={() => onOpenRubric(currentBooking)}
                className="flex-1 btn-pill-navy text-xs py-2.5"
              >
                <Award className="w-4 h-4 text-[#D0201A]" />
                Lançar Avaliação por Rubrica
              </button>
            </div>
          )}
        </div>
      </div>

      {viewingPdf && currentBooking && (
        <PresentationViewerModal
          booking={currentBooking}
          onClose={() => setViewingPdf(false)}
        />
      )}
    </div>
  );
}
