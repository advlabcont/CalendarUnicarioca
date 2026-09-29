import React, { useState } from "react";
import { X, Sliders, MessageSquare, AlertCircle, Save, Sparkles, Award } from "lucide-react";
import { Booking, BookingStatus, saveBookingEvaluation } from "../firebase";

interface EvaluationRubricModalProps {
  booking: Booking;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const CRITERIA = [
  { id: "content", label: "Domínio do Tema & Conteúdo", desc: "Fundamentação teórica, rigor conceitual e profundidade." },
  { id: "clarity", label: "Clareza, Postura & Oratória", desc: "Comunicação verbal, dicção e alinhamento dos membros da equipe." },
  { id: "visual", label: "Recursos Visuais & Apresentação", desc: "Qualidade dos slides, diagramas ou protótipos apresentados." },
  { id: "time", label: "Gestão do Tempo da Apresentação", desc: "Cumprimento pontual do tempo estipulado pela banca." },
  { id: "questions", label: "Respostas aos Questionamentos", desc: "Segurança e precisão técnica ao responder à banca docente." },
];

export default function EvaluationRubricModal({ booking, onClose, onSaved }: EvaluationRubricModalProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (booking.rubricScores) {
      return { ...booking.rubricScores };
    }
    const initialNumeric = parseFloat((booking.grade || "8.5").replace(",", "."));
    const base = isNaN(initialNumeric) ? 8.5 : Math.min(Math.max(initialNumeric, 0), 10);
    return {
      content: base,
      clarity: base,
      visual: base,
      time: 10,
      questions: base,
    };
  });

  const [feedback, setFeedback] = useState(booking.feedback || "");
  const [status, setStatus] = useState<BookingStatus>(booking.status || "concluido");
  const [customGrade, setCustomGrade] = useState(booking.grade || "");
  const [useCustomGrade, setUseCustomGrade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculatedAverage = React.useMemo(() => {
    const keys = CRITERIA.map(c => c.id);
    const sum = keys.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
    return (sum / keys.length).toFixed(1);
  }, [scores]);

  const activeFinalGrade = useCustomGrade ? customGrade : calculatedAverage;

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores(prev => ({ ...prev, [criterionId]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await saveBookingEvaluation(booking.id, {
        grade: activeFinalGrade.replace(".", ","),
        feedback: feedback.trim(),
        rubricScores: scores,
        status: status,
      });
      await onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar avaliação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1733]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#DFE4EE] shadow-2xl max-w-2xl w-full overflow-hidden my-6 relative">
        {/* UniCarioca Header */}
        <div className="bg-[#0A1733] text-white p-6 relative border-b-2 border-[#D0201A]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[#CBD4E8] hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
            aria-label="Fechar"
            id="close-rubric-btn"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[10px] font-bold uppercase tracking-wider">
              {booking.turmaCode || "Banca"}
            </span>
            <span className="font-mono text-xs text-[#CBD4E8] font-bold">
              Horário: {booking.slot}
            </span>
          </div>

          <h3 className="font-extrabold text-xl tracking-tight leading-snug text-white">
            {booking.projectTitle}
          </h3>
          <p className="text-[#CBD4E8] text-xs mt-1 font-medium line-clamp-1">
            Equipe: {booking.members}
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-[#FDECEA] border border-[#D0201A]/30 text-[#A3140F] text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Average Banner */}
          <div className="bg-[#F3F5FA] border border-[#DFE4EE] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0A1733] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                {activeFinalGrade}
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#D0201A] uppercase tracking-wider">Nota Final da Banca</p>
                <p className="text-xs font-medium text-[#34415E]">Média ponderada pelos 5 critérios avaliativos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[#34415E] font-medium flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomGrade}
                  onChange={(e) => setUseCustomGrade(e.target.checked)}
                  className="rounded accent-[#D0201A] w-4 h-4"
                />
                Nota Manual
              </label>

              {useCustomGrade && (
                <input
                  type="text"
                  placeholder="Ex: 9,5"
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value)}
                  className="w-20 bg-white border border-[#DFE4EE] focus:border-[#D0201A] px-2.5 py-1.5 rounded-lg text-xs font-bold text-center"
                />
              )}
            </div>
          </div>

          {/* Criteria Sliders */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#0A1733] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#D0201A]" />
              Critérios de Pontuação Docente (0.0 a 10.0)
            </h4>

            <div className="space-y-3">
              {CRITERIA.map((criterion) => {
                const val = scores[criterion.id] ?? 8.0;
                return (
                  <div key={criterion.id} className="p-3.5 bg-[#F3F5FA] border border-[#DFE4EE] rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-[#0A1733]">{criterion.label}</p>
                        <p className="text-[11px] text-[#66728C]">{criterion.desc}</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#D0201A] bg-[#FDECEA] border border-[#D0201A]/30 px-2 py-0.5 rounded-md">
                        {val.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={val}
                        onChange={(e) => handleScoreChange(criterion.id, parseFloat(e.target.value))}
                        className="flex-1 accent-[#D0201A] h-2 bg-[#DFE4EE] rounded-lg cursor-pointer"
                      />
                      <div className="flex gap-1">
                        {[7.0, 8.5, 10.0].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleScoreChange(criterion.id, preset)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition ${
                              val === preset
                                ? "bg-[#0A1733] text-white border-[#0A1733]"
                                : "bg-white text-[#34415E] border-[#DFE4EE] hover:bg-slate-100"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback & Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0A1733] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#D0201A]" />
              Observações & Parecer Construtivo da Banca
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Excelente clareza nos slides e protótipo demonstrado com fluidez. Boa articulação entre os membros da equipe..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full bg-[#F3F5FA] border border-[#DFE4EE] focus:border-[#D0201A] focus:bg-white p-3 rounded-xl text-xs font-medium text-[#34415E] focus:outline-none transition leading-relaxed"
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0A1733] block">
              Situação da Apresentação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "agendado", label: "Agendado" },
                { id: "presente", label: "Presente / Fila" },
                { id: "apresentando", label: "Apresentando" },
                { id: "concluido", label: "Concluído" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as BookingStatus)}
                  className={`p-2 rounded-xl text-xs font-bold border transition ${
                    status === s.id
                      ? "bg-[#D0201A] text-white border-[#D0201A]"
                      : "bg-[#F3F5FA] text-[#34415E] border-[#DFE4EE] hover:bg-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-pill-outline text-xs py-3"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-pill-red text-xs py-3 shadow-md disabled:opacity-75"
              id="save-rubric-btn"
            >
              <Save className="w-4 h-4" />
              {loading ? "Salvando Avaliação..." : "Confirmar Avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
