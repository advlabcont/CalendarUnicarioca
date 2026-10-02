import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, X, AlertCircle, KeyRound } from "lucide-react";
import { getTeacherPassword } from "../firebase";
import UniCariocaLogo from "./UniCariocaLogo";

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeacherLoginModal({ isOpen, onClose, onSuccess }: TeacherLoginModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const stored = await getTeacherPassword();
      const trimmed = password.trim();

      if (trimmed === stored || (stored === "senha" && trimmed === "senha")) {
        if (rememberSession) {
          localStorage.setItem("unicarioca_teacher_auth", "true");
        }
        onSuccess();
      } else {
        setError("Senha incorreta. Verifique a credencial de acesso do docente.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao verificar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1733]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#DFE4EE] shadow-2xl max-w-md w-full overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#0A1733] text-white p-6 relative border-b-2 border-[#D0201A]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[#CBD4E8] hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
            aria-label="Fechar"
            id="close-login-btn"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[10px] font-bold uppercase tracking-wider">
              Área Restrita
            </span>
            <span className="text-xs text-[#CBD4E8]">UniCarioca 2026/2</span>
          </div>
          
          <h3 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D0201A]" />
            Acesso do Docente
          </h3>
          <p className="text-[#CBD4E8] text-xs mt-1">
            Informe a senha cadastrada para acessar notas, cronômetro e gestão das bancas.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FDECEA] border border-[#D0201A]/30 text-[#A3140F] text-xs font-semibold rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D0201A]" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#0A1733] uppercase tracking-wider block">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#66728C]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Digite a senha docente..."
                className="w-full bg-[#F3F5FA] border border-[#DFE4EE] focus:border-[#D0201A] focus:bg-white pl-10 pr-10 py-2.5 rounded-xl text-xs font-medium text-[#34415E] focus:outline-none transition"
                id="teacher-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#66728C] hover:text-[#0A1733] transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember-session"
              checked={rememberSession}
              onChange={(e) => setRememberSession(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D0201A]"
            />
            <label htmlFor="remember-session" className="text-xs text-[#34415E] font-medium cursor-pointer">
              Manter autenticado nesta sessão
            </label>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-pill-outline text-xs py-2.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-pill-red text-xs py-2.5 shadow-md disabled:opacity-70"
              id="confirm-teacher-login-btn"
            >
              <Lock className="w-3.5 h-3.5" />
              {loading ? "Verificando..." : "Entrar no Painel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
