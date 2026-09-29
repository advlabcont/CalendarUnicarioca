import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  Sparkles, 
  Search, 
  ShieldCheck, 
  Users, 
  Layers, 
  GraduationCap, 
  FileCheck,
  ChevronRight,
  MapPin,
  FileText
} from "lucide-react";
import CoverPage from "./components/CoverPage";
import TeacherDashboard from "./components/TeacherDashboard";
import BookingModal from "./components/BookingModal";
import TeacherLoginModal from "./components/TeacherLoginModal";
import StudentTicketModal from "./components/StudentTicketModal";
import UniCariocaLogo from "./components/UniCariocaLogo";
import { motion, AnimatePresence } from "motion/react";
import { 
  Booking, 
  Slot, 
  Turma,
  OFFICIAL_TURMAS,
  EventConfig, 
  DEFAULT_EVENT_CONFIG, 
  getBookings, 
  getSlots, 
  getEventConfig, 
  saveBooking, 
  initializeTeacherPassword, 
  db,
  TeamMember 
} from "./firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";

type AppView = "cover" | "booking" | "teacher-dashboard";

export default function App() {
  const [view, setView] = useState<AppView>("cover");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("turma-1");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig>(DEFAULT_EVENT_CONFIG);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedSlot, setSelectedSlot] = useState<{ id: string; time: string } | null>(null);
  const [selectedTicketBooking, setSelectedTicketBooking] = useState<Booking | null>(null);
  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);

  // Student Timeline Search & Filter
  const [studentSearch, setStudentSearch] = useState("");
  const [timelineFilter, setTimelineFilter] = useState<"all" | "free" | "booked">("all");

  // Load initial data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
      const slotsData = await getSlots();
      setSlots(slotsData);
      const cfg = await getEventConfig();
      setEventConfig(cfg);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeTeacherPassword();
    fetchAllData();

    // Subscribe to Firestore bookings in real-time
    const unsubscribeBookings = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const bookingsList: Booking[] = [];
        snapshot.forEach((docSnap) => {
          bookingsList.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        });
        const sorted = bookingsList.sort((a, b) => a.id.localeCompare(b.id));
        setBookings(sorted);
        localStorage.setItem("unicarioca_bookings", JSON.stringify(sorted));
      },
      (error) => {
        console.warn("onSnapshot bookings error, fallback:", error);
        getBookings().then(setBookings);
      }
    );

    // Subscribe to Firestore slots in real-time
    const unsubscribeSlots = onSnapshot(
      collection(db, "slots"),
      async (snapshot) => {
        const slotsList: Slot[] = [];
        snapshot.forEach((docSnap) => {
          slotsList.push({ id: docSnap.id, ...docSnap.data() } as Slot);
        });

        if (slotsList.length === 0) {
          const seeded = await getSlots();
          setSlots(seeded);
          setLoading(false);
        } else {
          const sorted = slotsList.sort((a, b) => a.id.localeCompare(b.id));
          setSlots(sorted);
          localStorage.setItem("unicarioca_slots", JSON.stringify(sorted));
          setLoading(false);
        }
      },
      (error) => {
        console.warn("onSnapshot slots error, fallback:", error);
        getSlots().then((data) => {
          setSlots(data);
          setLoading(false);
        });
      }
    );

    // Subscribe to Event Config in real-time
    const unsubscribeConfig = onSnapshot(
      doc(db, "config", "eventSettings"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<EventConfig>;
          const merged: EventConfig = {
            title: data.title || DEFAULT_EVENT_CONFIG.title,
            date: data.date || DEFAULT_EVENT_CONFIG.date,
            location: data.location || DEFAULT_EVENT_CONFIG.location,
            course: data.course || DEFAULT_EVENT_CONFIG.course,
            duration: data.duration || DEFAULT_EVENT_CONFIG.duration,
            instructions: data.instructions || DEFAULT_EVENT_CONFIG.instructions,
          };
          setEventConfig(merged);
          localStorage.setItem("unicarioca_event_config", JSON.stringify(merged));
        }
      },
      (error) => {
        console.warn("onSnapshot config error:", error);
      }
    );

    return () => {
      unsubscribeBookings();
      unsubscribeSlots();
      unsubscribeConfig();
    };
  }, []);

  const handleOpenTeacherArea = () => {
    const isAuth = sessionStorage.getItem("unicarioca_teacher_auth") === "true";
    if (isAuth) {
      setView("teacher-dashboard");
    } else {
      setIsTeacherLoginOpen(true);
    }
  };

  const handleTeacherLoginSuccess = () => {
    setIsTeacherLoginOpen(false);
    setView("teacher-dashboard");
  };

  const currentTurma: Turma = OFFICIAL_TURMAS.find(t => t.id === selectedTurmaId) || OFFICIAL_TURMAS[0];

  // Slots belonging to the current turma
  const currentTurmaSlots = slots.filter(s => s.turmaId === currentTurma.id);

  // Filter slots for student view
  const filteredSlotsForStudent = currentTurmaSlots.filter((slot) => {
    const b = bookings.find((bk) => bk.id === slot.id);
    const isBooked = !!b;

    if (timelineFilter === "free" && isBooked) return false;
    if (timelineFilter === "booked" && !isBooked) return false;

    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      const matchTime = slot.time.toLowerCase().includes(q);
      const matchTitle = b && b.projectTitle.toLowerCase().includes(q);
      const matchMembers = b && b.members.toLowerCase().includes(q);
      return matchTime || matchTitle || matchMembers;
    }

    return true;
  });

  const turmaBookings = bookings.filter(b => b.turmaId === currentTurma.id);
  const bookedCount = turmaBookings.length;
  const freeCount = Math.max(0, currentTurmaSlots.length - bookedCount);
  const occupancyPercent = currentTurmaSlots.length > 0 
    ? Math.round((bookedCount / currentTurmaSlots.length) * 100) 
    : 0;

  const handleConfirmBooking = async (details: {
    projectTitle: string;
    members: string;
    membersList?: TeamMember[];
    presentationLink?: string;
    presentationFileName?: string;
    presentationFileData?: string;
    materials: string[];
    customMaterials: string;
    turmaId?: string;
    turmaCode?: string;
    turmaName?: string;
    presentationDate?: string;
  }) => {
    if (!selectedSlot) return;

    const newBooking: Booking = {
      id: selectedSlot.id,
      slot: selectedSlot.time,
      status: "agendado",
      turmaId: currentTurma.id,
      turmaCode: currentTurma.code,
      turmaName: currentTurma.name,
      presentationDate: currentTurma.presentationDate,
      createdAt: Date.now(),
      ...details
    };

    await saveBooking(newBooking);
  };

  return (
    <div className="min-h-screen bg-[#F3F5FA] flex flex-col font-sans selection:bg-[#D0201A] selection:text-white">
      {view === "cover" ? (
        <>
          <CoverPage 
            onSelectTurma={(turmaId) => {
              setSelectedTurmaId(turmaId);
              setView("booking");
            }}
            onEnter={() => setView("booking")} 
            onTeacherLoginClick={handleOpenTeacherArea} 
          />
          <TeacherLoginModal
            isOpen={isTeacherLoginOpen}
            onClose={() => setIsTeacherLoginOpen(false)}
            onSuccess={handleTeacherLoginSuccess}
          />
        </>
      ) : view === "teacher-dashboard" ? (
        <TeacherDashboard 
          bookings={bookings} 
          allSlots={slots} 
          eventConfig={eventConfig}
          onLogout={() => setView("cover")} 
          onRefresh={fetchAllData} 
          onEventConfigUpdated={(cfg) => setEventConfig(cfg)}
        />
      ) : (
        <div className="min-h-screen bg-[#F3F5FA] flex flex-col">
          {/* Institutional Header Bar */}
          <header className="bg-[#0A1733] border-b-2 border-[#D0201A] text-white px-6 py-4 sticky top-0 z-30 shadow-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <button
                onClick={() => setView("cover")}
                className="btn-pill-outline bg-transparent border-white/20 text-[#CBD4E8] hover:text-white hover:border-white/40 text-xs py-1.5 px-4 transition"
                id="back-to-cover-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Capa Inicial</span>
              </button>

              <UniCariocaLogo variant="on-navy" size="sm" />

              <button
                onClick={handleOpenTeacherArea}
                className="btn-pill-outline bg-transparent border-white/20 text-[#CBD4E8] hover:text-white hover:border-white/40 text-xs py-1.5 px-4 transition"
                id="header-teacher-login-btn"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#D0201A]" />
                <span>Área do Docente</span>
              </button>
            </div>
          </header>

          {/* Turma Switcher Tab Strip */}
          <section className="bg-white border-b border-[#DFE4EE] px-6 py-3 shadow-xs">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-[#66728C] uppercase tracking-wider mr-2 hidden sm:inline-block">
                  Turmas:
                </span>
                {OFFICIAL_TURMAS.map((t, idx) => {
                  const isSelected = t.id === currentTurma.id;
                  const tBooked = bookings.filter(b => b.turmaId === t.id).length;
                  const tSlots = slots.filter(s => s.turmaId === t.id).length;

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTurmaId(t.id);
                        setStudentSearch("");
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap border ${
                        isSelected
                          ? "bg-[#0A1733] text-white border-[#0A1733] shadow-sm"
                          : "bg-[#F3F5FA] text-[#34415E] border-[#DFE4EE] hover:bg-slate-200"
                      }`}
                    >
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isSelected ? "bg-[#D0201A] text-white" : "bg-[#DFE4EE] text-[#0A1733]"
                      }`}>
                        T0{idx + 1}
                      </span>
                      <span>{t.code}</span>
                      <span className="text-[10px] opacity-75">
                        • {t.presentationDate.slice(0, 5)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-white text-[#66728C]"
                      }`}>
                        {tBooked}/{tSlots}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Main timeline page container */}
          <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-6">
            
            {/* Turma Information Hero Card */}
            <div className="relative overflow-hidden bg-[#0A1733] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-[#D0201A] shadow-md">
              {/* Radial gradient graphic accent */}
              <div 
                className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none opacity-80 z-0"
                style={{
                  background: "radial-gradient(circle at 35% 35%, #EC3B2E 0%, #C81A14 45%, #8E110D 100%)"
                }}
              />

              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[10px] font-bold uppercase tracking-wider">
                    {currentTurma.code}
                  </span>
                  <span className="text-xs text-[#CBD4E8] font-medium">
                    Semestre 2026/2 • Apresentação de Trabalhos
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                  {currentTurma.name}
                </h2>

                <p className="text-xs sm:text-sm text-[#CBD4E8] leading-relaxed max-w-3xl">
                  {currentTurma.description}
                </p>

                {/* Meta data row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] text-[#CBD4E8] font-bold uppercase block">Data da Banca</span>
                    <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D0201A]" />
                      {currentTurma.displayDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#CBD4E8] font-bold uppercase block">Faixa de Horário</span>
                    <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#CBD4E8]" />
                      {currentTurma.timeRange}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#CBD4E8] font-bold uppercase block">Tempo por Grupo</span>
                    <span className="font-bold text-white mt-0.5 block">
                      {currentTurma.intervalMinutes} minutos
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#CBD4E8] font-bold uppercase block">Vagas Livres</span>
                    <span className="font-extrabold text-[#F4B740] mt-0.5 block">
                      {freeCount} de {currentTurmaSlots.length}
                    </span>
                  </div>
                </div>

                {/* Netflix/Hotmart style Live Occupancy Progress Bar */}
                <div className="pt-3 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#CBD4E8]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Status de Ocupação da Turma:
                    </span>
                    <span className="font-mono font-bold text-white">
                      {bookedCount} de {currentTurmaSlots.length} vagas agendadas ({occupancyPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 via-[#F4B740] to-[#D0201A] progress-bar-animated rounded-full"
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Callout per UniCarioca Design System */}
            <div className="unicarioca-callout">
              <p className="text-xs font-bold text-[#D0201A] uppercase tracking-wider mb-1">
                Orientações para Inscrição da Equipe
              </p>
              <p className="text-xs text-[#34415E] leading-relaxed">
                Selecione um dos horários disponíveis abaixo, insira o título do projeto e os nomes completos de todos os membros do grupo. Ao concluir, emita e guarde seu <strong>Comprovante Oficial em PDF</strong> para apresentar no dia da banca.
              </p>
            </div>

            {/* Timeline Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#66728C] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Buscar horários ou projetos na turma ${currentTurma.code}...`}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-white border border-[#DFE4EE] focus:border-[#D0201A] pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition shadow-xs text-[#34415E]"
                  id="student-search-input"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#DFE4EE] shadow-xs self-start sm:self-auto">
                <button
                  onClick={() => setTimelineFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    timelineFilter === "all"
                      ? "bg-[#0A1733] text-white shadow-xs"
                      : "text-[#66728C] hover:text-[#0A1733]"
                  }`}
                >
                  Todos ({currentTurmaSlots.length})
                </button>
                <button
                  onClick={() => setTimelineFilter("free")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    timelineFilter === "free"
                      ? "bg-[#D0201A] text-white shadow-xs"
                      : "text-[#66728C] hover:text-[#0A1733]"
                  }`}
                >
                  Livres ({freeCount})
                </button>
                <button
                  onClick={() => setTimelineFilter("booked")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    timelineFilter === "booked"
                      ? "bg-[#0A1733] text-white shadow-xs"
                      : "text-[#66728C] hover:text-[#0A1733]"
                  }`}
                >
                  Inscritos ({bookedCount})
                </button>
              </div>
            </div>

            {/* Timeline Slot List Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0A1733] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D0201A]" />
                  Grade de Horários • {currentTurma.displayDate}
                </h3>
                <span className="text-xs text-[#66728C]">
                  Duração: {currentTurma.intervalMinutes} min por grupo
                </span>
              </div>

              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-[#D0201A] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#66728C] font-medium">Carregando horários da turma...</p>
                </div>
              ) : filteredSlotsForStudent.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-[#DFE4EE] p-8 space-y-2">
                  <Clock className="w-8 h-8 text-[#66728C] mx-auto opacity-50" />
                  <p className="text-sm font-bold text-[#0A1733]">Nenhum horário encontrado</p>
                  <p className="text-xs text-[#66728C]">Tente ajustar o termo de busca ou o filtro acima.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSlotsForStudent.map((slot) => {
                    const booking = bookings.find((b) => b.id === slot.id);
                    const isBooked = !!booking;

                    return (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`netflix-card unicarioca-card p-5 relative overflow-hidden transition-all ${
                          isBooked
                            ? "bg-white border-[#DFE4EE]"
                            : "bg-white border-[#DFE4EE] hover:border-[#D0201A]"
                        }`}
                      >
                        {/* Accent line on left */}
                        <div
                          className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                            isBooked ? "bg-[#D0201A]" : "bg-emerald-500"
                          }`}
                        />

                        <div className="pl-1.5 space-y-3">
                          {/* Slot Time Header */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-extrabold text-[#0A1733] flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-[#D0201A]" />
                              {slot.time}
                            </span>

                            {isBooked ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                booking.status === "concluido"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : booking.status === "apresentando"
                                    ? "bg-amber-100 text-amber-800 animate-pulse"
                                    : "bg-[#FDECEA] text-[#D0201A]"
                              }`}>
                                {booking.status === "concluido" ? "Concluído" : "Reservado"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Vaga Disponível
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          {isBooked ? (
                            <div className="space-y-2 pt-1 text-xs">
                              <div>
                                <span className="text-[10px] text-[#66728C] uppercase font-bold block">Tema / Projeto</span>
                                <h4 className="font-bold text-[#0A1733] text-sm leading-snug">
                                  {booking.projectTitle}
                                </h4>
                              </div>

                              <div>
                                <span className="text-[10px] text-[#66728C] uppercase font-bold block">Equipe</span>
                                {booking.membersList && booking.membersList.length > 0 ? (
                                  <div className="space-y-0.5 mt-0.5">
                                    {booking.membersList.slice(0, 3).map((m, i) => (
                                      <p key={i} className="text-xs text-[#34415E] line-clamp-1">
                                        • {m.name} <span className="text-[11px] text-[#66728C]">({m.matricula})</span>
                                      </p>
                                    ))}
                                    {booking.membersList.length > 3 && (
                                      <p className="text-[10px] text-[#D0201A] font-semibold">
                                        +{booking.membersList.length - 3} integrantes
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#34415E] leading-relaxed line-clamp-2">
                                    {booking.members}
                                  </p>
                                )}
                              </div>

                              {(booking.presentationLink || booking.presentationFileName) && (
                                <div className="pt-0.5">
                                  {booking.presentationLink ? (
                                    <a
                                      href={booking.presentationLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDECEA] text-[#D0201A] text-[11px] font-bold hover:bg-[#D0201A] hover:text-white transition"
                                    >
                                      <span>Slides da Apresentação</span>
                                    </a>
                                  ) : booking.presentationFileData ? (
                                    <a
                                      href={booking.presentationFileData}
                                      download={booking.presentationFileName || "Apresentacao.pdf"}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-[#D0201A] hover:bg-[#D0201A] hover:text-white border border-[#D0201A]/30 text-[11px] font-bold transition shadow-xs"
                                      title="Baixar arquivo PDF da apresentação"
                                    >
                                      <FileCheck className="w-3.5 h-3.5" />
                                      <span>PDF Anexado</span>
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-[#66728C]">
                                      Arquivo anexo: <strong>{booking.presentationFileName}</strong>
                                    </span>
                                  )}
                                </div>
                              )}

                              {booking.grade && (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#FDECEA] text-[#A3140F] text-xs font-bold mt-1">
                                  <span>Nota Final da Banca:</span>
                                  <span className="font-mono text-sm text-[#D0201A] font-extrabold">{booking.grade}</span>
                                </div>
                              )}

                              <div className="pt-2">
                                <button
                                  onClick={() => setSelectedTicketBooking(booking)}
                                  className="w-full btn-pill-outline text-xs py-2"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  Visualizar Comprovante Oficial
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1">
                              <p className="text-xs text-[#66728C]">
                                Horário aberto para inscrição de equipes da turma <strong className="text-[#0A1733]">{currentTurma.code}</strong>.
                              </p>

                              <button
                                onClick={() => setSelectedSlot({ id: slot.id, time: slot.time })}
                                className="w-full btn-pill-red btn-glow-red text-xs py-2.5 shadow-sm transform active:scale-[0.98] font-bold"
                                id={`book-slot-${slot.id.replace(/[^a-zA-Z0-9]/g, "-")}`}
                              >
                                <span>Agendar Este Horário</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* Footer per UniCarioca Design System with Creator Credit */}
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
                  {currentTurma.code} • {currentTurma.shortName}
                </span>
                <span>•</span>
                <button
                  onClick={handleOpenTeacherArea}
                  className="text-[#D0201A] hover:underline font-semibold"
                >
                  Acesso Docente
                </button>
              </div>
            </div>
          </footer>

          {/* Modals */}
          {selectedSlot && (
            <BookingModal
              slotId={selectedSlot.id}
              slotTime={selectedSlot.time}
              turma={currentTurma}
              onClose={() => setSelectedSlot(null)}
              onConfirm={async (details) => {
                await handleConfirmBooking(details);
                setSelectedSlot(null);
              }}
            />
          )}

          {selectedTicketBooking && (
            <StudentTicketModal
              booking={selectedTicketBooking}
              eventConfig={eventConfig}
              onClose={() => setSelectedTicketBooking(null)}
            />
          )}

          <TeacherLoginModal
            isOpen={isTeacherLoginOpen}
            onClose={() => setIsTeacherLoginOpen(false)}
            onSuccess={handleTeacherLoginSuccess}
          />
        </div>
      )}
    </div>
  );
}
