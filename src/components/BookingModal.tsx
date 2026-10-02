import React, { useState } from "react";
import { 
  X, 
  Check, 
  ArrowRight, 
  BookOpen, 
  Users, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Download,
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  Upload, 
  FileCheck, 
  ExternalLink,
  Presentation,
  Key,
  Copy,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { Turma, TeamMember } from "../firebase";
import { jsPDF } from "jspdf";

interface BookingModalProps {
  slotId: string;
  slotTime: string;
  turma?: Turma;
  onClose: () => void;
  onConfirm: (bookingDetails: {
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
    cancelPassword?: string;
    protocol?: string;
  }) => Promise<void>;
}

export default function BookingModal({ slotId, slotTime, turma, onClose, onConfirm }: BookingModalProps) {
  const [projectTitle, setProjectTitle] = useState("");
  
  // Team members list with up to 10 entries (Nome + Matrícula)
  const [membersList, setMembersList] = useState<TeamMember[]>([
    { name: "", matricula: "" }
  ]);

  // Presentation materials (link and/or uploaded file)
  const [presentationLink, setPresentationLink] = useState("");
  const [presentationFileName, setPresentationFileName] = useState("");
  const [presentationFileData, setPresentationFileData] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Cancellation Password / PIN
  const [cancelPassword, setCancelPassword] = useState(() => 
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const cleanSlot = slotId.replace(/[^a-zA-Z0-9]/g, "");
  const protocol = `UNI-${turma?.code || "2026"}-${cleanSlot.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleRegeneratePassword = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setCancelPassword(newPin);
  };

  // Member management handlers
  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    setMembersList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddMember = () => {
    if (membersList.length >= 10) return;
    setMembersList(prev => [...prev, { name: "", matricula: "" }]);
  };

  const handleRemoveMember = (index: number) => {
    if (membersList.length <= 1) return;
    setMembersList(prev => prev.filter((_, i) => i !== index));
  };

  // Presentation file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 750 KB for safe Firestore document storage and instant loading)
    if (file.size > 750 * 1024) {
      setUploadError("O arquivo PDF para anexo direto deve ter até 750 KB. Para apresentações maiores, cole o link (Google Drive, Canva ou OneDrive) no campo acima.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPresentationFileName(file.name);
      setPresentationFileData(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError("Erro ao processar o arquivo. Tente novamente.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setPresentationFileName("");
    setPresentationFileData("");
    setUploadError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!projectTitle.trim()) {
      setError("Por favor, informe o título/tema do projeto.");
      return;
    }

    // Validate members
    const validMembers = membersList.filter(m => m.name.trim() !== "");
    if (validMembers.length === 0) {
      setError("Por favor, informe ao menos 1 integrante com nome e matrícula.");
      return;
    }

    // Check if any added member has empty matricula
    const missingMatricula = validMembers.some(m => !m.matricula.trim());
    if (missingMatricula) {
      setError("Por favor, preencha a matrícula de todos os integrantes informados.");
      return;
    }

    const finalPassword = cancelPassword.trim() || Math.floor(100000 + Math.random() * 900000).toString();

    // Format summary string
    const membersSummary = validMembers
      .map(m => `${m.name.trim()} (Matr: ${m.matricula.trim()})`)
      .join(", ");

    setLoading(true);
    try {
      const payload: any = {
        projectTitle: projectTitle.trim(),
        members: membersSummary,
        membersList: validMembers,
        presentationLink: presentationLink.trim(),
        materials: [],
        customMaterials: "",
        turmaId: turma?.id || "",
        turmaCode: turma?.code || "",
        turmaName: turma?.name || "",
        presentationDate: turma?.presentationDate || "",
        cancelPassword: finalPassword,
        protocol: protocol
      };

      if (presentationFileName.trim()) {
        payload.presentationFileName = presentationFileName.trim();
      }
      if (presentationFileData) {
        payload.presentationFileData = presentationFileData;
      }

      await onConfirm(payload);
      setSuccess(true);
    } catch (err) {
      setError("Houve um erro ao realizar o agendamento. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [105, 148]
      });

      // UniCarioca Navy Header (#0A1733)
      doc.setFillColor(10, 23, 51);
      doc.rect(0, 0, 105, 30, "F");

      // Red Stripe Accent (#D0201A)
      doc.setFillColor(208, 32, 26);
      doc.rect(0, 0, 105, 3.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("UniCarioca - 2026/2", 10, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(203, 212, 232);
      doc.text("Comprovante Oficial de Agendamento", 10, 20);
      doc.text(`Protocolo: ${protocol}`, 10, 25);

      // Presentation Details
      doc.setTextColor(10, 23, 51);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("DADOS DA BANCADA:", 10, 38);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(52, 65, 94);
      doc.text(`Turma: ${turma?.code || "Geral"} - ${turma?.shortName || ""}`, 10, 44);
      doc.text(`Data: ${turma?.displayDate || "Dezembro/2026"}`, 10, 49);
      doc.text(`Horario: ${slotTime}`, 10, 54);
      doc.text(`Local: ${turma?.location || "UniCarioca"}`, 10, 59);

      doc.setDrawColor(223, 228, 238);
      doc.line(10, 62, 95, 62);

      // Project Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(10, 23, 51);
      doc.text("Tema / Projeto:", 10, 67);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(52, 65, 94);
      const splitTitle = doc.splitTextToSize(projectTitle, 85);
      doc.text(splitTitle, 10, 71);

      // Members List (Nome + Matricula)
      let yOffset = 71 + (splitTitle.length * 4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(10, 23, 51);
      doc.text("Equipe (Nome e Matricula):", 10, yOffset + 2);

      yOffset += 5.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(52, 65, 94);

      const validMembers = membersList.filter(m => m.name.trim() !== "");
      validMembers.forEach((m, idx) => {
        if (yOffset < 112) {
          doc.text(`${idx + 1}. ${m.name.trim()} - Matr: ${m.matricula.trim()}`, 10, yOffset);
          yOffset += 3.5;
        }
      });

      // Cancellation Password Box (Crucial Requirement)
      yOffset += 2;
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(10, yOffset, 85, 13, 2, 2, "F");
      doc.setDrawColor(208, 32, 26);
      doc.roundedRect(10, yOffset, 85, 13, 2, 2, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(163, 20, 15);
      doc.text("CHAVE / SENHA DE CANCELAMENTO:", 13, yOffset + 4.5);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(208, 32, 26);
      doc.text(cancelPassword, 13, yOffset + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(102, 114, 140);
      doc.text("(Necessaria caso precise cancelar)", 50, yOffset + 10);

      // Presentation Link or File
      yOffset += 16;
      if (presentationLink || presentationFileName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(208, 32, 26);
        doc.text("Material da Apresentacao:", 10, yOffset);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(102, 114, 140);
        const presText = presentationLink || `Arquivo anexo: ${presentationFileName}`;
        doc.text(doc.splitTextToSize(presText, 85), 10, yOffset + 3.5);
      }

      // Footer notice
      doc.setFontSize(6.5);
      doc.setTextColor(163, 20, 15);
      doc.text("Apresente-se com 15 minutos de antecedencia ao seu horario.", 10, 139);
      doc.setTextColor(102, 114, 140);
      doc.setFontSize(6);
      doc.text("Criado por Anderson Vieira (@anderson.vieira.contabil)", 10, 143);

      doc.save(`Comprovante_${protocol}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF.");
    }
  };

  if (success) {
    const validMembers = membersList.filter(m => m.name.trim() !== "");

    return (
      <div className="fixed inset-0 bg-[#0A1733]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
        <div className="bg-white rounded-2xl p-7 max-w-md w-full border border-[#DFE4EE] shadow-2xl text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-[#FDECEA] text-[#D0201A] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#D0201A]/20">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FDECEA] text-[#D0201A] rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            Protocolo: {protocol}
          </div>

          <h3 className="font-extrabold text-[#0A1733] text-xl tracking-tight mb-1">
            Agendamento Confirmado!
          </h3>
          <p className="text-xs text-[#66728C] mb-3 leading-relaxed">
            Sua apresentação foi confirmada para <strong className="text-[#0A1733]">{slotTime}</strong> no dia <strong className="text-[#0A1733]">{turma?.presentationDate}</strong>.
          </p>

          {/* Cancellation Password Highlight Box */}
          <div className="bg-[#FEF2F2] border-2 border-dashed border-[#D0201A]/40 rounded-xl p-4 mb-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A3140F] flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#D0201A]" />
                Sua Senha de Cancelamento:
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(cancelPassword);
                  setCopiedPassword(true);
                  setTimeout(() => setCopiedPassword(false), 2000);
                }}
                className="text-[11px] font-bold text-[#D0201A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedPassword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPassword ? "Copiada!" : "Copiar Senha"}
              </button>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-[#D0201A] tracking-wider">
                {cancelPassword}
              </span>
            </div>
            <p className="text-[10px] text-[#66728C] mt-1 leading-tight">
              ⚠️ Guarde esta senha com sua equipe. Se precisar cancelar ou trocar o agendamento, ela será solicitada.
            </p>
          </div>

          <div className="bg-[#F3F5FA] border border-[#DFE4EE] rounded-xl p-3.5 mb-4 text-left space-y-1.5 text-xs text-[#34415E]">
            <p><strong>Turma:</strong> {turma?.code} • {turma?.shortName}</p>
            <p><strong>Data:</strong> {turma?.displayDate}</p>
            <p><strong>Horário:</strong> {slotTime}</p>
            <p><strong>Projeto:</strong> {projectTitle}</p>
            <div>
              <strong>Integrantes ({validMembers.length}):</strong>
              <ul className="mt-0.5 space-y-0.5 text-[11px] text-[#66728C]">
                {validMembers.map((m, i) => (
                  <li key={i}>• {m.name} (Matrícula: {m.matricula})</li>
                ))}
              </ul>
            </div>
            {(presentationLink || presentationFileName) && (
              <p className="pt-0.5 text-[11px] text-[#D0201A]">
                <strong>Apresentação anexada:</strong> {presentationFileName || presentationLink}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={handleDownloadPDF}
              className="w-full btn-pill-red text-xs py-3 shadow-md"
              id="download-booking-receipt-btn"
            >
              <Download className="w-4 h-4" />
              Baixar Comprovante Oficial (PDF)
            </button>

            <button
              onClick={onClose}
              className="w-full btn-pill-outline text-xs py-2.5"
              id="success-close-btn"
            >
              Concluir & Retornar à Grade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A1733]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#DFE4EE] shadow-2xl max-w-xl w-full overflow-hidden my-6 relative">
        {/* Header */}
        <div className="bg-[#0A1733] text-white p-6 relative border-b-2 border-[#D0201A]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[#CBD4E8] hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
            aria-label="Fechar"
            id="booking-modal-close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[10px] font-bold uppercase tracking-wider">
              {turma?.code || "TURMA"}
            </span>
            <span className="text-[11px] text-[#CBD4E8] font-medium">
              Agendamento de Apresentação
            </span>
          </div>

          <h3 className="font-extrabold text-xl tracking-tight">
            {turma?.shortName || "Formulário de Inscrição"}
          </h3>
          <p className="text-xs text-[#CBD4E8] mt-1 font-mono">
            {slotTime} • {turma?.presentationDate}
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-[#FDECEA] border border-[#D0201A]/30 text-[#A3140F] rounded-xl text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D0201A]" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold text-[#0A1733] mb-1.5">
              Título / Tema da Apresentação <span className="text-[#D0201A]">*</span>
            </label>
            <input
              type="text"
              required
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Ex: Análise de Custos e Viabilidade Financeira na Empresa X"
              className="w-full px-3.5 py-2.5 bg-white border border-[#DFE4EE] rounded-xl text-xs text-[#0A1733] placeholder:text-[#66728C] focus:border-[#D0201A] focus:ring-1 focus:ring-[#D0201A] outline-none transition"
              id="input-project-title"
            />
          </div>

          {/* Team Members List (Nome + Matrícula) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-[#0A1733] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#D0201A]" />
                  Integrantes do Grupo (Nome e Matrícula) <span className="text-[#D0201A]">*</span>
                </label>
                <p className="text-[11px] text-[#66728C]">
                  Adicione até 10 integrantes com nome completo e número de matrícula.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMember}
                disabled={membersList.length >= 10}
                className="btn-pill-outline text-xs px-2.5 py-1 flex items-center gap-1 text-[#D0201A] hover:bg-[#FDECEA] disabled:opacity-40"
                id="add-member-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Aluno</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {membersList.map((member, index) => (
                <div key={index} className="flex items-center gap-2 bg-[#F3F5FA] p-2.5 rounded-xl border border-[#DFE4EE]">
                  <span className="text-[11px] font-bold text-[#66728C] w-5 text-center flex-shrink-0">
                    #{index + 1}
                  </span>

                  <input
                    type="text"
                    required
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                    placeholder="Nome completo do aluno"
                    className="flex-1 px-3 py-1.5 bg-white border border-[#DFE4EE] rounded-lg text-xs text-[#0A1733] outline-none focus:border-[#D0201A]"
                  />

                  <input
                    type="text"
                    required
                    value={member.matricula}
                    onChange={(e) => handleMemberChange(index, "matricula", e.target.value)}
                    placeholder="Matrícula"
                    className="w-28 px-3 py-1.5 bg-white border border-[#DFE4EE] rounded-lg text-xs text-[#0A1733] outline-none focus:border-[#D0201A] font-mono"
                  />

                  {membersList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(index)}
                      className="p-1.5 text-[#66728C] hover:text-[#D0201A] hover:bg-[#FDECEA] rounded-lg transition"
                      title="Remover integrante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Presentation Attachment / Link */}
          <div className="space-y-3 pt-1 border-t border-[#DFE4EE]">
            <div>
              <label className="text-xs font-bold text-[#0A1733] flex items-center gap-1.5">
                <Presentation className="w-4 h-4 text-[#D0201A]" />
                Material da Apresentação (Slides / Arquivo PDF)
              </label>
              <p className="text-[11px] text-[#66728C]">
                Você pode fornecer um link para slides online OU anexar o arquivo PDF diretamente.
              </p>
            </div>

            {/* Option 1: URL Link */}
            <div className="space-y-1">
              <label className="text-[11px] text-[#66728C] font-semibold flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-[#D0201A]" />
                Link da Apresentação (Canva, Google Slides, OneDrive, etc.):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={presentationLink}
                  onChange={(e) => setPresentationLink(e.target.value)}
                  placeholder="https://docs.google.com/presentation/... ou https://canva.com/..."
                  className="flex-1 px-3.5 py-2 bg-white border border-[#DFE4EE] rounded-xl text-xs text-[#0A1733] outline-none focus:border-[#D0201A]"
                />
                {presentationLink && (
                  <a
                    href={presentationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-pill-outline text-xs px-3 py-2 flex items-center gap-1"
                    title="Testar link em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Testar
                  </a>
                )}
              </div>
            </div>

            {/* Option 2: Upload File */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] text-[#66728C] font-semibold flex items-center gap-1">
                <Upload className="w-3 h-3 text-[#D0201A]" />
                Ou Anexar Arquivo da Apresentação (.pdf - até 750 KB):
              </label>

              {presentationFileName ? (
                <div className="flex items-center justify-between p-3 bg-[#FDECEA] border border-[#D0201A]/30 rounded-xl text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileCheck className="w-4 h-4 text-[#D0201A] flex-shrink-0" />
                    <span className="font-semibold text-[#0A1733] truncate">
                      {presentationFileName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-[#A3140F] hover:text-[#D0201A] font-bold text-xs p-1"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-[#DFE4EE] hover:border-[#D0201A] rounded-xl cursor-pointer bg-[#F3F5FA] hover:bg-white transition text-center">
                  <Upload className="w-5 h-5 text-[#66728C] mb-1" />
                  <span className="text-xs font-semibold text-[#0A1733]">
                    Clique para selecionar arquivo de apresentação
                  </span>
                  <span className="text-[10px] text-[#66728C]">
                    Formatos aceitos: PDF, PPT, PPTX
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {uploadError && (
                <p className="text-[11px] text-[#D0201A] font-medium mt-1">
                  {uploadError}
                </p>
              )}
            </div>
          </div>

          {/* Cancellation Password Section (Requested by User) */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#DFE4EE] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0A1733] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D0201A]" />
                Senha de Cancelamento do Agendamento <span className="text-[#D0201A]">*</span>
              </label>
              <button
                type="button"
                onClick={handleRegeneratePassword}
                className="text-[10px] text-[#66728C] hover:text-[#D0201A] flex items-center gap-1 cursor-pointer"
                title="Gerar nova senha"
              >
                <RefreshCw className="w-3 h-3" />
                Gerar Outro PIN
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={cancelPassword}
                onChange={(e) => setCancelPassword(e.target.value)}
                placeholder="PIN ou senha da equipe"
                className="flex-1 px-3.5 py-2 bg-white border border-[#DFE4EE] rounded-xl text-sm font-mono font-bold text-[#D0201A] tracking-wider outline-none focus:border-[#D0201A]"
                id="input-cancel-password"
              />
            </div>
            <p className="text-[10px] text-[#66728C] leading-relaxed">
              * Esta senha será exigida caso sua equipe precise <strong>cancelar</strong> este agendamento posteriormente. Ela constará no seu <strong>Comprovante Oficial em PDF</strong>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t border-[#DFE4EE]">
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
              className="flex-1 btn-pill-red text-xs py-3 shadow-md disabled:opacity-70"
              id="confirm-booking-btn"
            >
              {loading ? (
                <span>Salvando reserva...</span>
              ) : (
                <>
                  <span>Confirmar Agendamento</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
