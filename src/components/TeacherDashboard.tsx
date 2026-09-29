import React, { useState } from "react";
import { 
  BarChart3, 
  Clock, 
  Check, 
  Users, 
  Download, 
  Trash2, 
  Edit, 
  LogOut, 
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Sliders,
  Plus,
  PlusCircle,
  Search,
  Filter,
  Award,
  Sparkles,
  KeyRound,
  Timer,
  CheckCircle2,
  FileText,
  RotateCcw,
  BookOpen,
  ExternalLink,
  Presentation,
  FileCheck
} from "lucide-react";
import { 
  deleteBooking, 
  saveBooking, 
  Booking, 
  saveSlot, 
  deleteSlot, 
  Slot, 
  saveBookingGrade, 
  saveBookingStatus,
  EventConfig, 
  saveEventConfig, 
  DEFAULT_EVENT_CONFIG,
  updateTeacherPassword,
  BookingStatus,
  OFFICIAL_TURMAS,
  Turma,
  resetDefaultTurmaSlots,
  TeamMember
} from "../firebase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import EvaluationRubricModal from "./EvaluationRubricModal";
import LivePresentationTimer from "./LivePresentationTimer";
import UniCariocaLogo from "./UniCariocaLogo";
import StudentTicketModal from "./StudentTicketModal";
import PresentationViewerModal from "./PresentationViewerModal";

interface TeacherDashboardProps {
  bookings: Booking[];
  allSlots: Slot[];
  eventConfig?: EventConfig;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  onEventConfigUpdated?: (config: EventConfig) => void;
}

// Inline component for fast grade recording
function GradeInput({ bookingId, initialGrade, onSave }: { bookingId: string; initialGrade: string; onSave: () => Promise<void> }) {
  const [grade, setGrade] = useState(initialGrade);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setGrade(initialGrade);
  }, [initialGrade]);

  const handleSave = async () => {
    const trimmed = grade.trim();
    if (trimmed === initialGrade && !saved) return;
    setIsSaving(true);
    try {
      await saveBookingGrade(bookingId, trimmed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 w-full max-w-[120px]">
      <input
        type="text"
        placeholder="Nota..."
        value={grade}
        onChange={(e) => {
          setGrade(e.target.value);
          setSaved(false);
        }}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave();
          }
        }}
        disabled={isSaving}
        className="w-full bg-[#F3F5FA] border border-[#DFE4EE] focus:border-[#D0201A] px-2 py-1 rounded-lg text-xs font-bold text-[#0A1733] placeholder-[#66728C] focus:outline-none transition text-center"
      />
      {isSaving ? (
        <span className="text-[10px] text-[#66728C] font-bold animate-pulse">...</span>
      ) : saved ? (
        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
      ) : grade !== initialGrade ? (
        <button
          onClick={handleSave}
          type="button"
          className="p-1 hover:bg-[#FDECEA] rounded text-[#D0201A] transition"
          title="Salvar Nota"
        >
          <Check className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}

export default function TeacherDashboard({ 
  bookings, 
  allSlots, 
  eventConfig = DEFAULT_EVENT_CONFIG, 
  onLogout, 
  onRefresh,
  onEventConfigUpdated
}: TeacherDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "live" | "bookings" | "slots">("dashboard");
  
  // Turma Filter
  const [selectedTurmaFilter, setSelectedTurmaFilter] = useState<string>("all");

  // Search & Filter state for bookings table
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [selectedBookingForRubric, setSelectedBookingForRubric] = useState<Booking | null>(null);
  const [selectedBookingForTicket, setSelectedBookingForTicket] = useState<Booking | null>(null);
  const [viewingPdfBooking, setViewingPdfBooking] = useState<Booking | null>(null);

  // States for editing booking
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMembers, setEditMembers] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editFeedback, setEditFeedback] = useState("");
  const [editStatus, setEditStatus] = useState<BookingStatus>("agendado");
  const [editPresentationLink, setEditPresentationLink] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // States for slot management
  const [newSlotTurma, setNewSlotTurma] = useState<string>("turma-1");
  const [newSlotStart, setNewSlotStart] = useState("");
  const [newSlotEnd, setNewSlotEnd] = useState("");
  const [slotError, setSlotError] = useState("");
  const [slotLoading, setSlotLoading] = useState(false);

  // Password Change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  // Filtered Bookings based on Turma filter and search
  const filteredBookings = bookings.filter((b) => {
    // Turma filter
    if (selectedTurmaFilter !== "all" && b.turmaId !== selectedTurmaFilter) {
      return false;
    }
    // Status filter
    if (statusFilter !== "all" && (b.status || "agendado") !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.projectTitle.toLowerCase().includes(q);
      const matchMembers = b.members.toLowerCase().includes(q);
      const matchSlot = b.slot.toLowerCase().includes(q);
      const matchCode = (b.turmaCode || "").toLowerCase().includes(q);
      return matchTitle || matchMembers || matchSlot || matchCode;
    }
    return true;
  });

  // Filtered Slots for the selected Turma
  const filteredSlots = allSlots.filter((s) => {
    if (selectedTurmaFilter === "all") return true;
    return s.turmaId === selectedTurmaFilter;
  });

  // Stats calculation
  const totalSlotsCount = filteredSlots.length;
  const bookedCount = filteredBookings.length;
  const availableCount = Math.max(0, totalSlotsCount - bookedCount);
  const fillingPercentage = totalSlotsCount > 0 ? Math.round((bookedCount / totalSlotsCount) * 100) : 0;

  // Grade stats
  const evaluatedBookings = filteredBookings.filter(b => b.grade && b.grade.trim() !== "");
  const evaluatedCount = evaluatedBookings.length;
  const averageGrade = React.useMemo(() => {
    if (evaluatedCount === 0) return "-";
    const numericGrades = evaluatedBookings
      .map(b => parseFloat(b.grade!.replace(",", ".")))
      .filter(n => !isNaN(n));
    if (numericGrades.length === 0) return "-";
    const sum = numericGrades.reduce((a, b) => a + b, 0);
    return (sum / numericGrades.length).toFixed(1).replace(".", ",");
  }, [evaluatedBookings, evaluatedCount]);

  // Handlers
  const handleDeleteBooking = async (bookingId: string, slotTime: string) => {
    if (window.confirm(`Tem certeza que deseja cancelar o agendamento de ${slotTime}?`)) {
      try {
        await deleteBooking(bookingId);
        await onRefresh();
      } catch (err) {
        alert("Erro ao excluir agendamento.");
      }
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotError("");
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newSlotStart) || !timeRegex.test(newSlotEnd)) {
      setSlotError("Use o formato de hora HH:MM (ex: 19:00)");
      return;
    }

    const startMinutes = parseInt(newSlotStart.split(":")[0]) * 60 + parseInt(newSlotStart.split(":")[1]);
    const endMinutes = parseInt(newSlotEnd.split(":")[0]) * 60 + parseInt(newSlotEnd.split(":")[1]);

    if (endMinutes <= startMinutes) {
      setSlotError("O horário de término deve ser após o de início");
      return;
    }

    setSlotLoading(true);
    try {
      const id = `${newSlotTurma}_${newSlotStart}`;
      const time = `${newSlotStart} - ${newSlotEnd}`;
      
      if (allSlots.some(s => s.id === id)) {
        setSlotError("Já existe uma vaga iniciando neste horário nesta turma");
        setSlotLoading(false);
        return;
      }

      await saveSlot({ id, time, turmaId: newSlotTurma });
      setNewSlotStart("");
      setNewSlotEnd("");
      await onRefresh();
    } catch (err) {
      setSlotError("Erro ao criar vaga no banco de dados.");
    } finally {
      setSlotLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string, slotTime: string, isBooked: boolean) => {
    let confirmMsg = `Tem certeza que deseja remover a vaga de ${slotTime}?`;
    if (isBooked) {
      confirmMsg = `ATENÇÃO: Este horário (${slotTime}) já possui uma equipe agendada. Se você excluir esta vaga, o agendamento correspondente também será cancelado. Deseja continuar?`;
    }
    
    if (window.confirm(confirmMsg)) {
      try {
        await deleteSlot(slotId);
        await onRefresh();
      } catch (err) {
        alert("Erro ao excluir vaga.");
      }
    }
  };

  const handleResetSlots = async () => {
    if (window.confirm("Deseja restaurar as vagas originais padrão de todas as 5 turmas?")) {
      try {
        await resetDefaultTurmaSlots();
        await onRefresh();
        alert("Horários padrão das 5 turmas restaurados com sucesso!");
      } catch (e) {
        console.error(e);
        alert("Erro ao restaurar horários.");
      }
    }
  };

  const handleStartEdit = (b: Booking) => {
    setEditingBooking(b);
    setEditTitle(b.projectTitle);
    setEditMembers(b.members);
    setEditGrade(b.grade || "");
    setEditFeedback(b.feedback || "");
    setEditStatus(b.status || "agendado");
    setEditPresentationLink(b.presentationLink || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setEditLoading(true);
    try {
      await saveBooking({
        ...editingBooking,
        projectTitle: editTitle.trim(),
        members: editMembers.trim(),
        grade: editGrade.trim(),
        feedback: editFeedback.trim(),
        status: editStatus,
        presentationLink: editPresentationLink.trim() || undefined
      });
      setEditingBooking(null);
      await onRefresh();
    } catch (err) {
      alert("Erro ao salvar alterações.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdMsg("");

    if (newPassword.length < 4) {
      setPwdError("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("As senhas não coincidem.");
      return;
    }

    try {
      await updateTeacherPassword(newPassword);
      setPwdMsg("Senha do docente atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdError("Erro ao salvar nova senha.");
    }
  };

  // Export to genuine Microsoft Excel (.xlsx) file
  const handleExportExcel = () => {
    try {
      const dataForExcel = filteredBookings.map((b, index) => {
        const membersFormatted = b.membersList && b.membersList.length > 0
          ? b.membersList.map((m, i) => `${i + 1}. ${m.name} (Matrícula: ${m.matricula})`).join("; ")
          : b.members;

        let presentationDesc = "Não enviado";
        if (b.presentationFileData && b.presentationLink) {
          presentationDesc = `Arquivo PDF: ${b.presentationFileName || "anexo.pdf"} | Link: ${b.presentationLink}`;
        } else if (b.presentationFileData) {
          presentationDesc = `Arquivo PDF: ${b.presentationFileName || "anexo.pdf"}`;
        } else if (b.presentationLink) {
          presentationDesc = `Link: ${b.presentationLink}`;
        }

        return {
          "Nº": index + 1,
          "Código da Turma": b.turmaCode || "-",
          "Nome da Disciplina": b.turmaName || "-",
          "Data da Apresentação": b.presentationDate || "-",
          "Horário Agendado": b.slot,
          "Título do Projeto / Tema": b.projectTitle,
          "Integrantes & Matrículas": membersFormatted,
          "Apresentação": presentationDesc,
          "Status da Banca": (b.status || "agendado").toUpperCase(),
          "Nota Final": b.grade || "-",
          "Observações / Parecer": b.feedback || "-",
          "Protocolo": b.id,
          "Data de Inscrição": new Date(b.createdAt).toLocaleString("pt-BR")
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 15 },
        { wch: 45 },
        { wch: 16 },
        { wch: 16 },
        { wch: 35 },
        { wch: 50 },
        { wch: 35 },
        { wch: 16 },
        { wch: 12 },
        { wch: 40 },
        { wch: 25 },
        { wch: 20 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Apresentações");

      const turmaLabel = selectedTurmaFilter === "all" ? "Geral_Todas_Turmas" : selectedTurmaFilter;
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `UniCarioca_Relatorio_${turmaLabel}_${dateStr}.xlsx`);
    } catch (e) {
      console.error("Erro ao gerar arquivo Excel:", e);
      alert("Erro ao exportar arquivo Excel. Tente novamente.");
    }
  };

  // Export functions
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape" });

      // Navy Header Banner
      doc.setFillColor(10, 23, 51);
      doc.rect(0, 0, 297, 24, "F");

      // Red Top Stripe
      doc.setFillColor(208, 32, 26);
      doc.rect(0, 0, 297, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("UniCarioca • Relatório Geral de Apresentações e Notas", 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 212, 232);
      const turmaLabel = selectedTurmaFilter === "all" ? "Todas as Turmas" : `Turma: ${selectedTurmaFilter}`;
      doc.text(`${turmaLabel} | Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 21);

      const tableData = filteredBookings.map((b, idx) => [
        `#${idx + 1}`,
        b.turmaCode || "-",
        b.presentationDate || "-",
        b.slot,
        b.projectTitle,
        b.members,
        b.presentationLink || (b.presentationFileName ? `Anexo: ${b.presentationFileName}` : "-"),
        b.status || "agendado",
        b.grade || "-",
        b.feedback ? b.feedback.slice(0, 40) + (b.feedback.length > 40 ? "..." : "") : "-"
      ]);

      autoTable(doc, {
        startY: 30,
        head: [["ID", "Turma", "Data", "Horário", "Projeto", "Integrantes (Nome e Matrícula)", "Apresentação", "Status", "Nota", "Observações"]],
        body: tableData,
        headStyles: {
          fillColor: [10, 23, 51],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 249, 252]
        }
      });

      doc.save(`UniCarioca_Apresentacoes_${selectedTurmaFilter}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar PDF.");
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Turma", "Data", "Horario", "Titulo_Projeto", "Integrantes_Matricula", "Apresentacao", "Status", "Nota", "Feedback"];
      const rows = filteredBookings.map(b => [
        `"${b.id}"`,
        `"${b.turmaCode || ""}"`,
        `"${b.presentationDate || ""}"`,
        `"${b.slot}"`,
        `"${b.projectTitle.replace(/"/g, '""')}"`,
        `"${b.members.replace(/"/g, '""')}"`,
        `"${(b.presentationLink || b.presentationFileName || "").replace(/"/g, '""')}"`,
        `"${b.status || "agendado"}"`,
        `"${b.grade || ""}"`,
        `"${(b.feedback || "").replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `UniCarioca_Apresentacoes_${selectedTurmaFilter}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar planilha.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5FA] flex flex-col font-sans selection:bg-[#D0201A] selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-[#0A1733] border-b-2 border-[#D0201A] text-white px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <UniCariocaLogo variant="on-navy" size="sm" />
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Painel do Docente
              </span>
              <p className="text-[10px] text-[#CBD4E8]">Gestão Acadêmica & Avaliações</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#13244A] p-1 rounded-full border border-white/10 self-stretch sm:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-[#D0201A] text-white shadow-sm"
                  : "text-[#CBD4E8] hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Visão Geral
            </button>

            <button
              onClick={() => setActiveTab("live")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "live"
                  ? "bg-[#D0201A] text-white shadow-sm"
                  : "text-[#CBD4E8] hover:text-white"
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Cronômetro ao Vivo</span>
              {bookings.some(b => b.status === "apresentando") && (
                <span className="relative flex h-2 w-2 ml-0.5" title="Apresentação em andamento">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "bookings"
                  ? "bg-[#D0201A] text-white shadow-sm"
                  : "text-[#CBD4E8] hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Inscrições & Notas ({filteredBookings.length})
            </button>

            <button
              onClick={() => setActiveTab("slots")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "slots"
                  ? "bg-[#D0201A] text-white shadow-sm"
                  : "text-[#CBD4E8] hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Configurar Horários
            </button>
          </div>

          {/* Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sessionStorage.removeItem("unicarioca_teacher_auth");
                onLogout();
              }}
              className="btn-pill-outline bg-transparent border-white/20 text-[#CBD4E8] hover:text-white hover:border-white/40 text-xs py-1.5 px-3.5"
              id="teacher-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Turma Switcher Bar (UniCarioca 5 Turmas selector) */}
      <section className="bg-white border-b border-[#DFE4EE] px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#D0201A] uppercase tracking-wider">
              Turma Ativa:
            </span>
            <select
              value={selectedTurmaFilter}
              onChange={(e) => setSelectedTurmaFilter(e.target.value)}
              className="bg-[#F3F5FA] border border-[#DFE4EE] text-[#0A1733] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D0201A]"
            >
              <option value="all">Todas as 5 Turmas ({bookings.length} grupos)</option>
              {OFFICIAL_TURMAS.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  Turma 0{idx + 1}: {t.code} • {t.shortName} ({t.presentationDate})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Turma Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedTurmaFilter("all")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                selectedTurmaFilter === "all"
                  ? "bg-[#0A1733] text-white"
                  : "bg-[#F3F5FA] text-[#66728C] hover:bg-slate-200"
              }`}
            >
              Todas
            </button>
            {OFFICIAL_TURMAS.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => setSelectedTurmaFilter(t.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ${
                  selectedTurmaFilter === t.id
                    ? "bg-[#D0201A] text-white"
                    : "bg-[#F3F5FA] text-[#66728C] hover:bg-slate-200"
                }`}
              >
                <span>T0{idx + 1}</span>
                <span className="text-[10px] opacity-80">({t.code})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 sm:py-8 space-y-6">
        
        {/* TAB 1: DASHBOARD VISÃO GERAL */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="unicarioca-card p-5 bg-white space-y-1">
                <span className="text-[11px] font-bold text-[#66728C] uppercase tracking-wider block">
                  Vagas Totais
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0A1733]">
                  {totalSlotsCount}
                </p>
                <p className="text-[11px] text-[#66728C]">
                  {selectedTurmaFilter === "all" ? "Todas as turmas" : "Nesta turma"}
                </p>
              </div>

              <div className="unicarioca-card p-5 bg-white space-y-1">
                <span className="text-[11px] font-bold text-[#D0201A] uppercase tracking-wider block">
                  Inscritos
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#D0201A]">
                  {bookedCount}
                </p>
                <p className="text-[11px] text-[#66728C]">
                  Ocupação: {fillingPercentage}%
                </p>
              </div>

              <div className="unicarioca-card p-5 bg-white space-y-1">
                <span className="text-[11px] font-bold text-[#66728C] uppercase tracking-wider block">
                  Vagas Disponíveis
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {availableCount}
                </p>
                <p className="text-[11px] text-[#66728C]">
                  Aguardando alunos
                </p>
              </div>

              <div className="unicarioca-card p-5 bg-white space-y-1">
                <span className="text-[11px] font-bold text-[#66728C] uppercase tracking-wider block">
                  Média de Notas
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0A1733]">
                  {averageGrade}
                </p>
                <p className="text-[11px] text-[#66728C]">
                  {evaluatedCount} grupos avaliados
                </p>
              </div>
            </div>

            {/* Turmas Overview Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0A1733]">
                    Status Individual por Turma
                  </h3>
                  <p className="text-xs text-[#66728C]">
                    Acompanhamento das bancas e prazos de cada disciplina
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition"
                    title="Exportar planilha formatada em Microsoft Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Relatório Excel (.xlsx)
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="btn-pill-navy text-xs py-2 px-4 inline-flex items-center gap-1.5"
                    title="Exportar relatório em formato PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="btn-pill-outline text-xs py-2 px-3 inline-flex items-center gap-1.5 bg-white"
                    title="Exportar dados em formato CSV"
                  >
                    CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {OFFICIAL_TURMAS.map((t, idx) => {
                  const turmaBookings = bookings.filter(b => b.turmaId === t.id);
                  const turmaSlots = allSlots.filter(s => s.turmaId === t.id);
                  const turmaEvaluated = turmaBookings.filter(b => b.grade && b.grade.trim() !== "").length;

                  return (
                    <div
                      key={t.id}
                      className="netflix-card unicarioca-card p-5 bg-white space-y-3 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#0A1733] text-white text-xs font-bold">
                          {t.code}
                        </span>
                        <span className="text-[11px] font-bold text-[#D0201A] uppercase">
                          Turma 0{idx + 1}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[#0A1733] line-clamp-2">
                          {t.name}
                        </h4>
                        <p className="text-xs text-[#66728C] mt-1">
                          {t.displayDate}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DFE4EE] text-center">
                        <div className="bg-[#F3F5FA] p-2 rounded-xl">
                          <span className="text-[10px] text-[#66728C] block uppercase font-bold">Vagas</span>
                          <span className="font-bold text-xs text-[#0A1733]">{turmaSlots.length}</span>
                        </div>
                        <div className="bg-[#FDECEA] p-2 rounded-xl">
                          <span className="text-[10px] text-[#A3140F] block uppercase font-bold">Inscritos</span>
                          <span className="font-bold text-xs text-[#D0201A]">{turmaBookings.length}</span>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl">
                          <span className="text-[10px] text-emerald-800 block uppercase font-bold">Avaliados</span>
                          <span className="font-bold text-xs text-emerald-700">{turmaEvaluated}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedTurmaFilter(t.id);
                          setActiveTab("bookings");
                        }}
                        className="w-full btn-pill-outline text-xs py-2 mt-2"
                      >
                        Ver Inscrições da Turma
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Live Presentation Section */}
            <div className="unicarioca-card p-6 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FDECEA] text-[#D0201A]">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#0A1733]">
                      Console de Apresentação em Tempo Real
                    </h3>
                    <p className="text-xs text-[#66728C]">
                      Inicie o cronômetro oficial da banca, acesse os slides da equipe e avalie por rubrica
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("live")}
                  className="btn-pill-red text-xs py-2 px-5"
                >
                  Abrir Cronômetro Completo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE TIMER */}
        {activeTab === "live" && (
          <LivePresentationTimer
            bookings={filteredBookings}
            onOpenRubric={(b) => setSelectedBookingForRubric(b)}
            onRefresh={onRefresh}
          />
        )}

        {/* TAB 3: BOOKINGS & GRADES TABLE */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="unicarioca-card p-4 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#66728C] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por equipe, aluno, matrícula, tema ou horário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F3F5FA] border border-[#DFE4EE] focus:border-[#D0201A] pl-10 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#F3F5FA] border border-[#DFE4EE] text-[#0A1733] font-semibold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#D0201A]"
                >
                  <option value="all">Todos os Status</option>
                  <option value="agendado">Agendado</option>
                  <option value="presente">Presente</option>
                  <option value="apresentando">Apresentando</option>
                  <option value="concluido">Concluído</option>
                  <option value="ausente">Ausente</option>
                </select>

                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs whitespace-nowrap inline-flex items-center gap-1.5 shadow-xs transition"
                  title="Baixar Relatório Completo em Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel (.xlsx)
                </button>

                <button
                  onClick={handleExportPDF}
                  className="btn-pill-navy text-xs py-2 px-3.5 whitespace-nowrap inline-flex items-center gap-1.5"
                  title="Exportar PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>

                <button
                  onClick={handleExportCSV}
                  className="btn-pill-outline text-xs py-2 px-3 whitespace-nowrap bg-white"
                  title="Exportar CSV"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="unicarioca-card overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0A1733] text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 rounded-tl-lg">Turma / Data</th>
                      <th className="py-3 px-4">Horário</th>
                      <th className="py-3 px-4">Projeto & Integrantes</th>
                      <th className="py-3 px-4">Apresentação</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Nota</th>
                      <th className="py-3 px-4 text-right rounded-tr-lg">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFE4EE] text-xs">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#66728C]">
                          Nenhum agendamento encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b, idx) => (
                        <tr 
                          key={b.id} 
                          className={`hover:bg-[#F3F5FA] transition-colors ${
                            idx % 2 === 1 ? "bg-[#F8F9FC]" : "bg-white"
                          }`}
                        >
                          {/* Turma & Date */}
                          <td className="py-3.5 px-4 font-semibold text-[#0A1733] whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-[#0A1733] text-white text-[10px] font-bold block w-fit mb-1">
                              {b.turmaCode || "Geral"}
                            </span>
                            <span className="text-[11px] text-[#66728C]">
                              {b.presentationDate || "-"}
                            </span>
                          </td>

                          {/* Time */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#D0201A] whitespace-nowrap">
                            {b.slot}
                          </td>

                          {/* Project & Members */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-bold text-[#0A1733] line-clamp-1">{b.projectTitle}</p>
                            
                            {/* Structured Members Display */}
                            {b.membersList && b.membersList.length > 0 ? (
                              <div className="mt-1 space-y-0.5">
                                {b.membersList.slice(0, 3).map((m, i) => (
                                  <p key={i} className="text-[11px] text-[#66728C] line-clamp-1">
                                    • {m.name} <span className="text-[10px] opacity-75">({m.matricula})</span>
                                  </p>
                                ))}
                                {b.membersList.length > 3 && (
                                  <p className="text-[10px] text-[#D0201A] font-semibold">
                                    +{b.membersList.length - 3} integrantes
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-[#66728C] line-clamp-2 mt-0.5">{b.members}</p>
                            )}

                            {b.feedback && (
                              <p className="text-[10px] text-indigo-700 italic mt-0.5 line-clamp-1">
                                Parecer: "{b.feedback}"
                              </p>
                            )}
                          </td>

                          {/* Presentation Material (Link and/or Uploaded PDF) */}
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Dedicated Button to Access and Download the student's PDF */}
                              {b.presentationFileData ? (
                                <button
                                  onClick={() => setViewingPdfBooking(b)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-[#D0201A] font-bold text-[11px] hover:bg-[#D0201A] hover:text-white border border-[#D0201A]/30 transition shadow-xs"
                                  title={`Acessar arquivo PDF: ${b.presentationFileName || "Apresentação"}`}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Acessar PDF</span>
                                </button>
                              ) : b.presentationFileName ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3F5FA] border border-[#DFE4EE] text-[11px] text-[#34415E] font-medium" title={b.presentationFileName}>
                                  <FileCheck className="w-3 h-3 text-emerald-600" />
                                  <span className="max-w-[90px] truncate">{b.presentationFileName}</span>
                                </span>
                              ) : null}

                              {/* Link to presentation slides (Google Slides, Canva, Drive) */}
                              {b.presentationLink ? (
                                <a
                                  href={b.presentationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#0A1733] font-bold text-[11px] hover:bg-[#0A1733] hover:text-white border border-[#0A1733]/20 transition"
                                  title="Abrir slides em nova aba"
                                >
                                  <Presentation className="w-3.5 h-3.5 text-[#0A1733]" />
                                  <span>Abrir Slides</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : null}

                              {!b.presentationFileData && !b.presentationFileName && !b.presentationLink && (
                                <span className="text-[11px] text-[#66728C] italic">Não enviado</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.status === "concluido"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "apresentando"
                                  ? "bg-amber-100 text-amber-800 animate-pulse"
                                  : b.status === "presente"
                                    ? "bg-blue-100 text-blue-800"
                                    : b.status === "ausente"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-[#F3F5FA] text-[#66728C]"
                            }`}>
                              {b.status || "agendado"}
                            </span>
                          </td>

                          {/* Grade Fast Input */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <GradeInput
                              bookingId={b.id}
                              initialGrade={b.grade || ""}
                              onSave={onRefresh}
                            />
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedBookingForRubric(b)}
                                className="p-1.5 rounded-lg bg-[#FDECEA] text-[#D0201A] hover:bg-[#D0201A] hover:text-white transition"
                                title="Avaliar com Rubrica"
                              >
                                <Award className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setSelectedBookingForTicket(b)}
                                className="p-1.5 rounded-lg bg-[#F3F5FA] text-[#0A1733] hover:bg-[#0A1733] hover:text-white transition"
                                title="Ver Comprovante Oficial"
                              >
                                <FileText className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleStartEdit(b)}
                                className="p-1.5 rounded-lg bg-[#F3F5FA] text-[#66728C] hover:bg-slate-200 transition"
                                title="Editar Inscrição"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteBooking(b.id, b.slot)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                                title="Excluir Agendamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SLOTS & SETTINGS */}
        {activeTab === "slots" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Slot & Slot List Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add New Slot Card */}
              <div className="unicarioca-card p-6 bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base text-[#0A1733] flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-[#D0201A]" />
                      Adicionar Nova Vaga de Horário
                    </h3>
                    <p className="text-xs text-[#66728C]">
                      Abra horários extras para apresentações na turma desejada
                    </p>
                  </div>

                  <button
                    onClick={handleResetSlots}
                    className="btn-pill-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                    title="Restaurar horários padrões de todas as 5 turmas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar Padrão
                  </button>
                </div>

                <form onSubmit={handleCreateSlot} className="space-y-4">
                  {slotError && (
                    <div className="p-3 bg-[#FDECEA] border border-[#D0201A]/30 text-[#A3140F] text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{slotError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#0A1733] uppercase">Turma</label>
                      <select
                        value={newSlotTurma}
                        onChange={(e) => setNewSlotTurma(e.target.value)}
                        className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-bold rounded-xl p-2.5 focus:border-[#D0201A]"
                      >
                        {OFFICIAL_TURMAS.map((t, idx) => (
                          <option key={t.id} value={t.id}>
                            T0{idx + 1}: {t.code} ({t.presentationDate})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#0A1733] uppercase">Início (HH:MM)</label>
                      <input
                        type="time"
                        required
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-bold rounded-xl p-2.5 focus:border-[#D0201A]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#0A1733] uppercase">Término (HH:MM)</label>
                      <input
                        type="time"
                        required
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-bold rounded-xl p-2.5 focus:border-[#D0201A]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={slotLoading}
                      className="btn-pill-red text-xs py-2.5 px-6 shadow-sm disabled:opacity-75"
                    >
                      <Plus className="w-4 h-4" />
                      {slotLoading ? "Adicionando..." : "Criar Vaga"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Slots List by Turma */}
              <div className="unicarioca-card p-6 bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base text-[#0A1733] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#0A1733]" />
                    Horários Cadastrados ({filteredSlots.length})
                  </h3>
                  <span className="text-xs text-[#66728C]">
                    {selectedTurmaFilter === "all" ? "Exibindo todas as turmas" : `Filtrado por turma`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredSlots.map((slot) => {
                    const booking = bookings.find(b => b.id === slot.id);
                    const isBooked = !!booking;
                    const turma = OFFICIAL_TURMAS.find(t => t.id === slot.turmaId);

                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                          isBooked 
                            ? "bg-[#FDECEA]/50 border-[#D0201A]/30 text-[#0A1733]" 
                            : "bg-[#F3F5FA] border-[#DFE4EE] text-[#34415E]"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-[#D0201A] block">{slot.time}</span>
                          <span className="text-[10px] text-[#66728C] block">
                            {turma ? `${turma.code} • ${turma.presentationDate}` : "Geral"}
                          </span>
                          <span className={`text-[10px] font-bold ${isBooked ? "text-[#D0201A]" : "text-emerald-700"}`}>
                            {isBooked ? `Reservado (${booking?.projectTitle.slice(0, 15)}...)` : "Disponível"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteSlot(slot.id, slot.time, isBooked)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition"
                          title="Remover Horário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Password Change Column */}
            <div className="space-y-6">
              <div className="unicarioca-card p-6 bg-white space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#D0201A]" />
                  <h3 className="font-bold text-base text-[#0A1733]">
                    Alterar Senha do Docente
                  </h3>
                </div>
                <p className="text-xs text-[#66728C]">
                  Modifique a senha de acesso a este painel administrativo.
                </p>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  {pwdError && (
                    <div className="p-3 bg-[#FDECEA] border border-[#D0201A]/30 text-[#A3140F] text-xs font-semibold rounded-xl">
                      {pwdError}
                    </div>
                  )}
                  {pwdMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{pwdMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#0A1733] uppercase">Nova Senha</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres..."
                      className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs rounded-xl p-2.5 focus:border-[#D0201A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#0A1733] uppercase">Confirmar Senha</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha..."
                      className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs rounded-xl p-2.5 focus:border-[#D0201A]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-pill-navy text-xs py-2.5 mt-2"
                  >
                    Salvar Nova Senha
                  </button>
                </form>
              </div>

              {/* Institutional Guidelines */}
              <div className="unicarioca-callout space-y-2">
                <p className="text-xs font-bold text-[#D0201A] uppercase tracking-wider">
                  Diretrizes Acadêmicas UniCarioca
                </p>
                <p className="text-xs text-[#34415E] leading-relaxed">
                  As notas e feedbacks lançados neste painel são sincronizados em tempo real e podem ser exportados a qualquer momento em PDF oficial para a ata de notas da coordenação.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer with Creator Credit */}
      <footer className="bg-white border-t border-[#DFE4EE] py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#66728C]">
          <div className="flex items-center gap-3">
            <UniCariocaLogo variant="seal-only" size="sm" />
            <div>
              <p className="font-semibold text-[#0A1733]">© 2026 UniCarioca • Painel de Gestão Docente</p>
              <p className="text-[11px] text-[#66728C] mt-0.5">
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
          </div>
        </div>
      </footer>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-[#0A1733]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#DFE4EE] shadow-2xl max-w-lg w-full overflow-hidden relative">
            <div className="bg-[#0A1733] text-white p-6 relative border-b-2 border-[#D0201A]">
              <h3 className="font-bold text-lg text-white">Editar Inscrição</h3>
              <p className="text-[#CBD4E8] text-xs mt-0.5">
                Turma: {editingBooking.turmaCode || "Geral"} • Horário: {editingBooking.slot}
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0A1733] uppercase">Título do Projeto</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-medium rounded-xl p-2.5 focus:border-[#D0201A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0A1733] uppercase">Integrantes (Nome e Matrícula)</label>
                <textarea
                  rows={3}
                  required
                  value={editMembers}
                  onChange={(e) => setEditMembers(e.target.value)}
                  className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-medium rounded-xl p-2.5 focus:border-[#D0201A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0A1733] uppercase">Link da Apresentação</label>
                <input
                  type="url"
                  value={editPresentationLink}
                  onChange={(e) => setEditPresentationLink(e.target.value)}
                  placeholder="https://docs.google.com/presentation/..."
                  className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-medium rounded-xl p-2.5 focus:border-[#D0201A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0A1733] uppercase">Nota</label>
                  <input
                    type="text"
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    placeholder="Ex: 9,5"
                    className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-bold rounded-xl p-2.5 focus:border-[#D0201A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0A1733] uppercase">Situação</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as BookingStatus)}
                    className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-bold rounded-xl p-2.5 focus:border-[#D0201A]"
                  >
                    <option value="agendado">Agendado</option>
                    <option value="presente">Presente</option>
                    <option value="apresentando">Apresentando</option>
                    <option value="concluido">Concluído</option>
                    <option value="ausente">Ausente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0A1733] uppercase">Parecer / Feedback</label>
                <textarea
                  rows={2}
                  value={editFeedback}
                  onChange={(e) => setEditFeedback(e.target.value)}
                  className="w-full bg-[#F3F5FA] border border-[#DFE4EE] text-xs font-medium rounded-xl p-2.5 focus:border-[#D0201A]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 btn-pill-outline text-xs py-2.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 btn-pill-red text-xs py-2.5 shadow-md disabled:opacity-75"
                >
                  {editLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rubric Evaluation Modal */}
      {selectedBookingForRubric && (
        <EvaluationRubricModal
          booking={selectedBookingForRubric}
          onClose={() => setSelectedBookingForRubric(null)}
          onSaved={async () => {
            await onRefresh();
            setSelectedBookingForRubric(null);
          }}
        />
      )}

      {/* Student Ticket Preview Modal */}
      {selectedBookingForTicket && (
        <StudentTicketModal
          booking={selectedBookingForTicket}
          onClose={() => setSelectedBookingForTicket(null)}
        />
      )}

      {/* Presentation Viewer & PDF Access Modal */}
      {viewingPdfBooking && (
        <PresentationViewerModal
          booking={viewingPdfBooking}
          onClose={() => setViewingPdfBooking(null)}
        />
      )}
    </div>
  );
}
