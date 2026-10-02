import React, { useState } from "react";
import { 
  X, 
  Trash2, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  Eye, 
  EyeOff,
  ShieldAlert
} from "lucide-react";
import { Booking, cancelBookingWithPassword } from "../firebase";

interface CancelBookingModalProps {
  booking: Booking;
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancelBookingModal({
  booking,
  onClose,
  onCancelled
}: CancelBookingModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Por favor, digite a senha de cancelamento.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await cancelBookingWithPassword(booking.id, password);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onCancelled();
          onClose();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao processar o cancelamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1733]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#DFE4EE] shadow-2xl max-w-md w-full overflow-hidden relative my-6">
        
        {/* Header */}
        <div className="bg-[#0A1733] text-white p-6 relative border-b-2 border-[#D0201A]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[#CBD4E8] hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
            aria-label="Fechar"
            id="cancel-modal-close-btn"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[10px] font-bold uppercase tracking-wider">
              {booking.turmaCode || "UniCarioca"}
            </span>
            <span className="text-[11px] text-[#CBD4E8] font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D0201A]" />
              Área de Cancelamento
            </span>
          </div>

          <h3 className="font-extrabold text-xl tracking-tight text-white">
            Cancelar Agendamento
          </h3>
          <p className="text-[#CBD4E8] text-xs mt-1">
            Esta ação cancelará a inscrição e liberará o horário na grade.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#0A1733]">
                Agendamento Cancelado com Sucesso!
              </h4>
              <p className="text-xs text-[#66728C]">
                O horário das <strong className="text-[#0A1733]">{booking.slot}</strong> foi liberado e já está disponível para novos agendamentos.
              </p>
            </div>
          ) : (
            <>
              {/* Booking Summary Box */}
              <div className="bg-[#F3F5FA] border border-[#DFE4EE] rounded-xl p-4 space-y-2 text-xs text-[#34415E]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A1733] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#D0201A]" />
                    {booking.slot}
                  </span>
                  {booking.presentationDate && (
                    <span className="text-[11px] text-[#66728C] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {booking.presentationDate}
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-[#66728C] uppercase font-bold block">
                    Tema / Projeto
                  </span>
                  <p className="font-bold text-[#0A1733] text-xs">
                    {booking.projectTitle}
                  </p>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-[#66728C] uppercase font-bold block">
                    Integrantes da Equipe
                  </span>
                  {booking.membersList && booking.membersList.length > 0 ? (
                    <p className="text-xs text-[#66728C] line-clamp-2">
                      {booking.membersList.map(m => m.name).join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-[#66728C] line-clamp-2">
                      {booking.members}
                    </p>
                  )}
                </div>
              </div>

              {/* Warning Alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-800">
                    Atenção: Ação Irreversível
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Para garantir a segurança do grupo e evitar cancelamentos indevidos por terceiros, é obrigatório informar a <strong>Senha de Cancelamento</strong> gerada no agendamento.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-[#FDECEA] border border-[#D0201A]/30 text-[#A3140F] rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#D0201A]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A1733] mb-1.5">
                    Senha de Cancelamento / PIN do Agendamento
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#66728C]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Digite a senha do agendamento..."
                      className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#DFE4EE] rounded-xl text-xs text-[#0A1733] focus:border-[#D0201A] focus:ring-1 focus:ring-[#D0201A] outline-none font-mono"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#66728C] hover:text-[#0A1733]"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#66728C] mt-1.5 leading-relaxed">
                    * Esta senha foi exibida na confirmação e está registrada no seu <strong>Comprovante Oficial em PDF</strong>. O professor da disciplina também possui autorização para cancelar.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-pill-red text-xs py-3 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    id="confirm-cancel-booking-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                    {loading ? "Validando e cancelando..." : "Confirmar Cancelamento do Horário"}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full btn-pill-outline text-xs py-2.5"
                  >
                    Voltar / Manter Agendamento
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
