import React, { useState } from "react";
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Sparkles, 
  ShieldCheck,
  FileCheck,
  Users,
  Timer,
  Play,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Flame,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import UniCariocaLogo from "./UniCariocaLogo";
import { OFFICIAL_TURMAS, Turma } from "../firebase";

interface CoverPageProps {
  onSelectTurma: (turmaId: string) => void;
  onEnter: () => void;
  onTeacherLoginClick: () => void;
}

export default function CoverPage({ onSelectTurma, onEnter, onTeacherLoginClick }: CoverPageProps) {
  const [shiftFilter, setShiftFilter] = useState<"all" | "night" | "morning">("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredTurmas = OFFICIAL_TURMAS.filter((t) => {
    if (shiftFilter === "night") return t.timeRange.includes("19:00");
    if (shiftFilter === "morning") return t.timeRange.includes("09:00") || t.timeRange.includes("10:00");
    return true;
  });

  const featuredTurma = OFFICIAL_TURMAS[0]; // Turma 1 - Primeira a apresentar em 08/12

  const faqs = [
    {
      q: "Quantos integrantes posso cadastrar no agendamento?",
      a: "É possível cadastrar até 10 alunos por grupo, informando obrigatoriamente o nome completo e a matrícula de cada participante."
    },
    {
      q: "Como envio os slides ou o PDF da apresentação?",
      a: "No momento da reserva você pode anexar diretamente seu arquivo PDF (de até 750 KB para salvamento rápido) ou adicionar o link compartilhado da apresentação (Google Slides, Canva ou OneDrive)."
    },
    {
      q: "Apenas um integrante precisa realizar a inscrição?",
      a: "Sim. Apenas um representante do grupo realiza o agendamento da vaga. Ao concluir, o sistema gera o Comprovante Oficial com Protocolo em PDF para a equipe."
    },
    {
      q: "Como o professor orientador avalia as apresentações?",
      a: "O docente possui acesso restrito com cronômetro oficial de banca, acesso direto aos PDFs e links enviados, avaliação por rubricas em tempo real e exportação dos relatórios completos em Excel (.xlsx) e PDF."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F3F5FA] flex flex-col font-sans selection:bg-[#D0201A] selection:text-white overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. CINEMATIC HERO SECTION (Netflix & Hotmart Inspired)        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#070E20] via-[#0A1733] to-[#0D1E45] text-white pt-6 pb-16 lg:pb-24 border-b border-[#1A2C56]">
        {/* UniCarioca Iconic Red Circle Disc with Animated Glow */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 sm:w-[480px] sm:h-[480px] lg:w-[620px] lg:h-[620px] rounded-full pointer-events-none opacity-85 select-none z-0 animate-glow"
          style={{
            background: "radial-gradient(circle at 35% 35%, #EC3B2E 0%, #C81A14 45%, #8E110D 100%)",
            boxShadow: "0 0 100px rgba(208, 32, 26, 0.45)"
          }}
        />

        {/* Floating Ambient Light Orbs */}
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-[#D0201A]/15 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute bottom-4 right-1/4 w-96 h-36 bg-[#1A3A7A]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navigation Bar */}
        <header className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 flex justify-between items-center mb-10 sm:mb-16">
          <UniCariocaLogo variant="on-navy" size="md" />

          <div className="flex items-center gap-3">
            <button
              onClick={onTeacherLoginClick}
              className="btn-pill-outline bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40 text-xs sm:text-sm font-semibold transition backdrop-blur-xs flex items-center gap-1.5"
              id="teacher-login-btn"
            >
              <ShieldCheck className="w-4 h-4 text-[#CBD4E8]" />
              <span>Área do Docente</span>
            </button>
          </div>
        </header>

        {/* Hero Headline Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Headline and Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Hotmart-style Live Beacon Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EC3B2E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D0201A]"></span>
                </span>
                <span>Semestre 2026/2 • Inscrições Oficiais Abertas</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Agendamento de <br />
                <span className="bg-gradient-to-r from-white via-[#CBD4E8] to-[#FDECEA] bg-clip-text text-transparent">
                  Apresentações de Bancas
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#CBD4E8] leading-relaxed max-w-xl font-normal">
                Garanta o horário da sua equipe para os <strong className="text-white font-medium">Projetos de Extensão</strong> e <strong className="text-white font-medium">Desafios Acadêmicos</strong> da UniCarioca. Sistema em tempo real com comprovante oficial em PDF.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onEnter}
                  className="btn-pill-red btn-glow-red text-sm sm:text-base py-3.5 px-8 shadow-xl shadow-[#D0201A]/35 font-bold flex items-center gap-2"
                  id="enter-booking-btn"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Escolher Turma & Horário</span>
                  <ChevronRight className="w-5 h-5 ml-1" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onTeacherLoginClick}
                  className="btn-pill-outline bg-white/5 border-white/20 text-[#CBD4E8] hover:text-white hover:border-white/40 text-sm py-3.5 px-6 backdrop-blur-xs flex items-center gap-2"
                >
                  <Timer className="w-4 h-4 text-[#D0201A]" />
                  <span>Painel & Cronômetro Docente</span>
                </motion.button>
              </div>

              {/* Micro Trust metrics (Hotmart style) */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#CBD4E8]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Até 10 alunos por grupo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Upload direto de PDF</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Comprovante com Protocolo</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Netflix-style Featured Spotlight Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-2xl p-6 bg-gradient-to-br from-[#13244A]/90 to-[#0A1733]/90 border border-white/15 backdrop-blur-md shadow-2xl overflow-hidden group">
                {/* Accent glow on card hover */}
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#D0201A]/30 rounded-full blur-2xl group-hover:bg-[#D0201A]/50 transition-all duration-500" />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F4B740] uppercase tracking-wider bg-[#F4B740]/10 px-2.5 py-1 rounded-full border border-[#F4B740]/25">
                      <Flame className="w-3.5 h-3.5" />
                      Destaque do Calendário
                    </span>
                    <span className="text-xs font-mono font-bold text-white/70">
                      {featuredTurma.code}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#CBD4E8] uppercase tracking-wider font-semibold">
                      Primeira Rodada de Apresentações
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                      {featuredTurma.name}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-white/10 text-xs text-[#CBD4E8]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#D0201A]" />
                        Data da Banca:
                      </span>
                      <strong className="text-white font-medium">{featuredTurma.displayDate}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#CBD4E8]" />
                        Horário:
                      </span>
                      <span className="text-white">{featuredTurma.timeRange}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#CBD4E8]" />
                        Duração por banca:
                      </span>
                      <span className="text-white font-bold">{featuredTurma.intervalMinutes} minutos</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => onSelectTurma(featuredTurma.id)}
                      className="w-full btn-pill-red text-xs py-2.5 font-bold shadow-md hover:bg-[#A3140F] transition flex items-center justify-center gap-2 group/btn"
                    >
                      <span>Inscrever Esta Turma</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Live Metrics Counter Bar (Hotmart Style) */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 mt-14 pt-8 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">05</span>
              <p className="text-xs text-[#CBD4E8] mt-0.5">Turmas Oficiais Ativas</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#D0201A] font-mono">20/15</span>
              <p className="text-xs text-[#CBD4E8] mt-0.5">Minutos por Apresentação</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">100%</span>
              <p className="text-xs text-[#CBD4E8] mt-0.5">Digital com Comprovante PDF</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">Rubricas</span>
              <p className="text-xs text-[#CBD4E8] mt-0.5">Avaliação Docente em Tempo Real</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. TURMAS BROWSE SECTION (Netflix-style Discovery Rows)       */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-12 sm:py-16 space-y-10">
        
        {/* Section Header with Shift Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-[#DFE4EE]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#D0201A] font-mono">01</span>
              <span className="text-[11px] font-bold text-[#66728C] uppercase tracking-wider">
                Catálogo de Turmas
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A1733] tracking-tight">
              Selecione sua disciplina para agendar
            </h2>
            <p className="text-xs sm:text-sm text-[#66728C]">
              Escolha abaixo a turma correspondente ao seu curso e visualize as vagas abertas.
            </p>
          </div>

          {/* Interactive Filter Pills (Hotmart & Netflix Filter Row) */}
          <div className="inline-flex items-center p-1 bg-white border border-[#DFE4EE] rounded-full shadow-xs self-start md:self-auto">
            <button
              onClick={() => setShiftFilter("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                shiftFilter === "all"
                  ? "bg-[#0A1733] text-white shadow-xs"
                  : "text-[#66728C] hover:text-[#0A1733]"
              }`}
            >
              Todas as 5 Turmas
            </button>
            <button
              onClick={() => setShiftFilter("night")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                shiftFilter === "night"
                  ? "bg-[#0A1733] text-white shadow-xs"
                  : "text-[#66728C] hover:text-[#0A1733]"
              }`}
            >
              Noite (19h - 21:40)
            </button>
            <button
              onClick={() => setShiftFilter("morning")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                shiftFilter === "morning"
                  ? "bg-[#0A1733] text-white shadow-xs"
                  : "text-[#66728C] hover:text-[#0A1733]"
              }`}
            >
              Manhã (09h - 11h)
            </button>
          </div>
        </div>

        {/* 5 Turmas Cards Grid with Netflix-inspired hover scale & glow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTurmas.map((turma, idx) => (
            <motion.div
              key={turma.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              onClick={() => onSelectTurma(turma.id)}
              className="netflix-card unicarioca-card p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden bg-white border border-[#DFE4EE]"
            >
              {/* Netflix-style Top Edge Red Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#DFE4EE] group-hover:bg-[#D0201A] transition-colors" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-md bg-[#0A1733] text-white text-xs font-mono font-bold tracking-wider">
                    {turma.code}
                  </span>
                  <span className="text-[11px] font-bold text-[#D0201A] uppercase tracking-wider">
                    Turma 0{OFFICIAL_TURMAS.findIndex(t => t.id === turma.id) + 1}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0A1733] group-hover:text-[#D0201A] transition-colors leading-snug line-clamp-2">
                    {turma.name}
                  </h3>
                  <p className="text-xs text-[#66728C] mt-2 line-clamp-2 leading-relaxed">
                    {turma.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#DFE4EE] text-xs text-[#34415E]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D0201A] flex-shrink-0" />
                    <span className="font-semibold text-[#0A1733]">{turma.displayDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#66728C] flex-shrink-0" />
                    <span>{turma.timeRange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#66728C] flex-shrink-0" />
                    <span className="text-[#66728C] truncate">{turma.location}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="mt-6 pt-4 border-t border-[#DFE4EE] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#0A1733] bg-[#F3F5FA] px-2.5 py-1 rounded-full border border-[#DFE4EE]">
                  {turma.intervalMinutes} min / banca
                </span>
                
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D0201A] group-hover:translate-x-1.5 transition-transform">
                  Ver Horários & Agendar
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          ))}

          {/* Instructions & Help Card */}
          <div className="unicarioca-card p-6 bg-gradient-to-br from-[#F8FAFD] to-[#F1F4FA] border-dashed border-[#DFE4EE] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#D0201A]/10 text-[#D0201A] flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0A1733]">
                Orientações para o Aluno
              </h3>
              <ul className="text-xs text-[#66728C] space-y-2 list-disc list-inside leading-relaxed">
                <li>Apenas 1 aluno por grupo realiza o agendamento da vaga.</li>
                <li>Cadastre o nome e a matrícula de todos os integrantes (até 10 alunos).</li>
                <li>Anexe o arquivo em PDF ou o link dos slides (Canva/Google Drive).</li>
                <li>Baixe o Comprovante Oficial em PDF gerado imediatamente.</li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={onEnter}
                className="w-full btn-pill-navy text-xs py-2.5 font-bold shadow-xs hover:bg-[#13244A] transition"
              >
                Explorar Todas as Vagas Livres
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. STEP-BY-STEP WORKFLOW (Hotmart Style)                     */}
        {/* ============================================================ */}
        <section className="pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <span className="text-[11px] font-bold text-[#D0201A] uppercase tracking-wider">
              Passo a Passo Simples
            </span>
            <h3 className="text-2xl font-bold text-[#0A1733]">
              Como funciona o agendamento em 3 etapas
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-white border border-[#DFE4EE] space-y-3 text-center md:text-left hover:shadow-md transition">
              <span className="text-3xl font-black text-[#D0201A] font-mono">01</span>
              <h4 className="font-bold text-[#0A1733] text-sm">
                Escolha a Turma e o Horário
              </h4>
              <p className="text-xs text-[#66728C] leading-relaxed">
                Encontre sua disciplina e selecione um dos horários disponíveis na grade oficial de 15 ou 20 minutos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#DFE4EE] space-y-3 text-center md:text-left hover:shadow-md transition">
              <span className="text-3xl font-black text-[#0A1733] font-mono">02</span>
              <h4 className="font-bold text-[#0A1733] text-sm">
                Cadastre o Projeto e a Equipe
              </h4>
              <p className="text-xs text-[#66728C] leading-relaxed">
                Informe o tema do trabalho e insira os nomes e números de matrícula dos participantes (até 10 alunos).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#DFE4EE] space-y-3 text-center md:text-left hover:shadow-md transition">
              <span className="text-3xl font-black text-[#D0201A] font-mono">03</span>
              <h4 className="font-bold text-[#0A1733] text-sm">
                Anexe o PDF e Baixe o Comprovante
              </h4>
              <p className="text-xs text-[#66728C] leading-relaxed">
                Anexe o arquivo em PDF ou link da apresentação e emita o PDF oficial com protocolo único da sua banca.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. INTERACTIVE FAQ ACCORDION                                 */}
        {/* ============================================================ */}
        <section className="pt-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="text-center space-y-1 mb-6">
              <span className="text-[11px] font-bold text-[#D0201A] uppercase tracking-wider">
                Dúvidas Frequentes
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0A1733]">
                Perguntas Frequentes dos Alunos
              </h3>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div 
                    key={index}
                    className="bg-white border border-[#DFE4EE] rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#0A1733] hover:text-[#D0201A] transition"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-[#66728C] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#D0201A]" : ""}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 text-xs text-[#66728C] leading-relaxed border-t border-[#DFE4EE]/60 pt-3"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Callout Notice per Design System */}
        <div className="unicarioca-callout mt-8">
          <p className="text-xs font-bold text-[#D0201A] uppercase tracking-wider mb-1">
            Aviso aos Estudantes e Docentes
          </p>
          <p className="text-xs text-[#34415E] leading-relaxed">
            As apresentações ocorrerão pontualmente conforme o cronômetro do sistema. Em caso de dúvidas sobre a alocação de turmas ou alteração de horário, procure seu professor orientador ou a coordenação de curso.
          </p>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 5. FOOTER WITH CREATOR CREDIT & INSTAGRAM LINK                */}
      {/* ============================================================ */}
      <footer className="bg-white border-t border-[#DFE4EE] py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#66728C]">
          <div className="flex items-center gap-3">
            <UniCariocaLogo variant="seal-only" size="sm" />
            <div>
              <p className="text-xs text-[#66728C]">
                Crédito de Criação: <strong className="text-[#0A1733]">Anderson Vieira</strong> •{" "}
                <a
                  href="https://instagram.com/anderson.vieira.contabil"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D0201A] hover:underline font-bold inline-flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5 fill-current inline-block" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @anderson.vieira.contabil
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] bg-[#F3F5FA] text-[#0A1733] font-semibold px-3 py-1 rounded-full border border-[#DFE4EE]">
              Criado por Anderson Vieira • @anderson.vieira.contabil
            </span>
            <span>•</span>
            <button 
              onClick={onTeacherLoginClick} 
              className="text-[#D0201A] hover:underline font-semibold"
            >
              Painel Docente
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
