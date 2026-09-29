import React, { useState } from "react";
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Download, 
  Copy, 
  Check, 
  Award,
  ExternalLink,
  Presentation,
  FileCheck
} from "lucide-react";
import { Booking, EventConfig } from "../firebase";
import { jsPDF } from "jspdf";

interface StudentTicketModalProps {
  booking: Booking;
  eventConfig?: EventConfig;
  onClose: () => void;
}

export default function StudentTicketModal({ booking, onClose }: StudentTicketModalProps) {
  const [copied, setCopied] = useState(false);

  const cleanId = booking.id.replace(/[^a-zA-Z0-9]/g, "");
  const protocol = `UNI-${booking.turmaCode || "2026"}-${cleanId.slice(-4)}-${booking.createdAt.toString().slice(-4)}`;

  const handleCopy = () => {
    const text = `📋 COMPROVANTE OFICIAL • UniCarioca 2026/2\nProtocolo: ${protocol}\nTurma: ${booking.turmaCode || ""} - ${booking.turmaName || ""}\nData: ${booking.presentationDate || ""}\nHorário: ${booking.slot}\nProjeto: ${booking.projectTitle}\nIntegrantes:\n${booking.members}${booking.presentationLink ? `\nApresentação: ${booking.presentationLink}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTicketPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [105, 148] // A6 Ticket format
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

      // Section Data
      doc.setTextColor(10, 23, 51);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("DADOS DA APRESENTACAO:", 10, 38);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(52, 65, 94);
      doc.text(`Turma: ${booking.turmaCode || "Cadastrada"}`, 10, 44);
      doc.text(`Data: ${booking.presentationDate || "Dezembro/2026"}`, 10, 49);
      doc.text(`Horario: ${booking.slot}`, 10, 54);

      doc.setDrawColor(223, 228, 238);
      doc.line(10, 59, 95, 59);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(10, 23, 51);
      doc.text("Projeto / Tema:", 10, 65);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(52, 65, 94);
      const splitTitle = doc.splitTextToSize(booking.projectTitle, 85);
      doc.text(splitTitle, 10, 70);

      let yOffset = 70 + (splitTitle.length * 4.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(10, 23, 51);
      doc.text("Integrantes da Equipe:", 10, yOffset + 2);

      yOffset += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(102, 114, 140);

      if (booking.membersList && booking.membersList.length > 0) {
        booking.membersList.forEach((m, idx) => {
          if (yOffset < 125) {
            doc.text(`${idx + 1}. ${m.name} (Matr: ${m.matricula})`, 10, yOffset);
            yOffset += 4;
          }
        });
      } else {
        const splitMembers = doc.splitTextToSize(booking.members, 85);
        doc.text(splitMembers, 10, yOffset);
        yOffset += splitMembers.length * 4;
      }

      if (booking.presentationLink || booking.presentationFileName) {
        yOffset += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(208, 32, 26);
        doc.text("Apresentacao:", 10, yOffset);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(102, 114, 140);
        const pres = booking.presentationLink || `Arquivo: ${booking.presentationFileName}`;
        doc.text(doc.splitTextToSize(pres, 85), 10, yOffset + 4);
      }

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(163, 20, 15);
      doc.text("Apresente-se com 15 minutos de antecedencia ao seu horario.", 10, 140);
      doc.setTextColor(102, 114, 140);
      doc.setFontSize(6.5);
      doc.text("Criado por Anderson Vieira (@anderson.vieira.contabil)", 10, 144);

      doc.save(`Comprovante_${protocol}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF do comprovante.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1733]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#DFE4EE] shadow-2xl max-w-md w-full overflow-hidden relative my-6">
        
        {/* Ticket Top Ribbon */}
        <div className="bg-[#0A1733] text-white p-6 relative border-b-2 border-[#D0201A]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[#CBD4E8] hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
            aria-label="Fechar"
            id="close-ticket-btn"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[10px] font-bold uppercase tracking-wider">
              {booking.turmaCode || "UniCarioca"}
            </span>
            <span className="text-[11px] text-[#CBD4E8] font-medium">
              Comprovante de Inscrição
            </span>
          </div>

          <h3 className="font-extrabold text-xl tracking-tight text-white">
            Vaga Confirmada
          </h3>
          <p className="text-[#CBD4E8] text-xs font-mono mt-1">
            Protocolo: {protocol}
          </p>
        </div>

        {/* Ticket Details */}
        <div className="p-6 space-y-5">
          {/* Main Card */}
          <div className="bg-[#F3F5FA] border border-[#DFE4EE] rounded-xl p-4 space-y-3 relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#D0201A] uppercase tracking-wider block">
                  Projeto / Tema
                </span>
                <h4 className="font-bold text-[#0A1733] text-sm leading-snug mt-0.5">
                  {booking.projectTitle}
                </h4>
              </div>
              <span className="font-mono text-xs font-bold text-[#D0201A] bg-[#FDECEA] border border-[#D0201A]/30 px-2.5 py-1 rounded-full flex-shrink-0">
                {booking.slot}
              </span>
            </div>

            <div className="border-t border-[#DFE4EE] pt-2.5 space-y-2 text-xs text-[#34415E]">
              {booking.turmaName && (
                <p className="text-[11px] text-[#66728C] leading-snug">
                  <strong>Disciplina:</strong> {booking.turmaName}
                </p>
              )}
              {booking.presentationDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#D0201A]" />
                  <span><strong>Data:</strong> {booking.presentationDate}</span>
                </div>
              )}

              {/* Members List with Matrícula */}
              <div className="space-y-1">
                <span className="font-bold text-[#0A1733] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#66728C]" />
                  Integrantes da Equipe:
                </span>
                {booking.membersList && booking.membersList.length > 0 ? (
                  <ul className="pl-5 space-y-0.5 text-[11px] text-[#66728C] list-disc">
                    {booking.membersList.map((m, i) => (
                      <li key={i}>
                        <strong className="text-[#34415E]">{m.name}</strong> • Matrícula: {m.matricula}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-[#66728C] pl-2">{booking.members}</p>
                )}
              </div>

              {/* Presentation Link or Attachment */}
              {(booking.presentationLink || booking.presentationFileName) && (
                <div className="pt-2 border-t border-[#DFE4EE]">
                  <span className="font-bold text-[#0A1733] flex items-center gap-1.5 text-xs mb-1">
                    <Presentation className="w-3.5 h-3.5 text-[#D0201A]" />
                    Material da Apresentação:
                  </span>
                  {booking.presentationLink && (
                    <a
                      href={booking.presentationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D0201A] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Acessar Slides / Apresentação Online
                    </a>
                  )}
                  {booking.presentationFileName && (
                    <p className="text-[11px] text-[#66728C] flex items-center gap-1.5 mt-0.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Arquivo anexado: {booking.presentationFileName}
                    </p>
                  )}
                </div>
              )}
            </div>

            {booking.grade && (
              <div className="bg-[#FDECEA] border border-[#D0201A]/30 rounded-xl p-2.5 flex items-center justify-between text-xs mt-2">
                <span className="font-bold text-[#A3140F] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#D0201A]" />
                  Nota da Apresentação
                </span>
                <span className="font-mono font-bold text-[#D0201A] text-sm">{booking.grade}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleDownloadTicketPDF}
              className="w-full btn-pill-red text-xs py-3 shadow-md"
              id="download-ticket-pdf-btn"
            >
              <Download className="w-4 h-4" />
              Baixar Comprovante em PDF
            </button>

            <button
              onClick={handleCopy}
              className="w-full btn-pill-outline text-xs py-2.5"
            >
              {copied ? <Check className="w-4 h-4 text-[#D0201A]" /> : <Copy className="w-4 h-4 text-[#66728C]" />}
              {copied ? "Dados Copiados!" : "Copiar Dados da Inscrição"}
            </button>
          </div>

          <div className="space-y-1 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Guarde o número de protocolo ou o PDF para confirmar seu horário com a banca no dia da apresentação.
            </p>
            <p className="text-[10px] text-[#66728C] pt-1">
              Criado por <strong>Anderson Vieira</strong> •{" "}
              <a
                href="https://instagram.com/anderson.vieira.contabil"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D0201A] hover:underline font-bold"
              >
                @anderson.vieira.contabil
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
