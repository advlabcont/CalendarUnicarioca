import React from "react";
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Presentation, 
  Users, 
  Calendar, 
  Clock, 
  FileCheck,
  AlertCircle
} from "lucide-react";
import { Booking } from "../firebase";

interface PresentationViewerModalProps {
  booking: Booking;
  onClose: () => void;
}

export default function PresentationViewerModal({ booking, onClose }: PresentationViewerModalProps) {
  const isPdf = booking.presentationFileData?.startsWith("data:application/pdf") || 
                booking.presentationFileName?.toLowerCase().endsWith(".pdf");
  
  const isImage = booking.presentationFileData?.startsWith("data:image/") ||
                  booking.presentationFileName?.match(/\.(png|jpe?g|webp)$/i);

  const handleOpenInNewTab = () => {
    if (booking.presentationFileData) {
      // Create a blob URL for smooth new tab viewing
      try {
        const byteCharacters = atob(booking.presentationFileData.split(",")[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const mimeType = isPdf ? "application/pdf" : "application/octet-stream";
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } catch {
        window.open(booking.presentationFileData, "_blank");
      }
    } else if (booking.presentationLink) {
      window.open(booking.presentationLink, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#DFE4EE] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Navy Header per UniCarioca Design System */}
        <div className="bg-[#0A1733] border-b-2 border-[#D0201A] px-6 py-4 text-white flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[10px] font-bold uppercase tracking-wider">
                {booking.turmaCode || "Turma"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#CBD4E8] font-medium">
                <Calendar className="w-3 h-3 text-[#D0201A]" />
                {booking.presentationDate || "Data agendada"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#CBD4E8] font-medium">
                <Clock className="w-3 h-3 text-[#D0201A]" />
                {booking.slot}
              </span>
            </div>
            
            <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
              {booking.projectTitle}
            </h2>
            
            {/* Team Members List */}
            {booking.membersList && booking.membersList.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#CBD4E8] pt-0.5">
                <span className="font-semibold text-white">Integrantes:</span>
                {booking.membersList.map((m, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1">
                    {m.name} <span className="text-[10px] text-[#CBD4E8]/80">({m.matricula})</span>
                    {idx < (booking.membersList?.length || 0) - 1 && " •"}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#CBD4E8] line-clamp-1">
                <span className="font-semibold text-white">Integrantes:</span> {booking.members}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition flex-shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-[#F3F5FA] border-b border-[#DFE4EE] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-[#0A1733]">
              {booking.presentationFileName || "Arquivo de Apresentação"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {booking.presentationFileData && (
              <>
                <a
                  href={booking.presentationFileData}
                  download={booking.presentationFileName || `Apresentacao_${booking.turmaCode || "UniCarioca"}.pdf`}
                  className="btn-pill-navy text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Arquivo PDF
                </a>

                <button
                  onClick={handleOpenInNewTab}
                  className="btn-pill-outline text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 bg-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir em Nova Aba
                </button>
              </>
            )}

            {booking.presentationLink && (
              <a
                href={booking.presentationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-red text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 shadow-xs"
              >
                <Presentation className="w-3.5 h-3.5" />
                Acessar Slides Externos
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#EBEFF7] flex flex-col items-center justify-center min-h-[400px]">
          {booking.presentationFileData ? (
            isPdf ? (
              <div className="w-full h-full flex flex-col space-y-2">
                <iframe
                  src={booking.presentationFileData}
                  className="w-full h-[60vh] sm:h-[65vh] rounded-xl border border-[#DFE4EE] bg-white shadow-inner"
                  title="Pré-visualização do PDF"
                />
                <p className="text-[11px] text-[#66728C] text-center">
                  Dica: Se a visualização inline for bloqueada pela segurança do navegador, utilize os botões <strong>"Baixar Arquivo PDF"</strong> ou <strong>"Abrir em Nova Aba"</strong> acima.
                </p>
              </div>
            ) : isImage ? (
              <div className="w-full flex justify-center">
                <img
                  src={booking.presentationFileData}
                  alt={booking.presentationFileName || "Apresentação"}
                  className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-md border border-[#DFE4EE] bg-white"
                />
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-2xl border border-[#DFE4EE] shadow-sm max-w-md">
                <FileText className="w-12 h-12 text-[#D0201A] mx-auto mb-3" />
                <h4 className="font-bold text-[#0A1733] text-sm mb-1">
                  Arquivo Anexado com Sucesso
                </h4>
                <p className="text-xs text-[#66728C] mb-4">
                  {booking.presentationFileName}
                </p>
                <a
                  href={booking.presentationFileData}
                  download={booking.presentationFileName || "apresentacao.pdf"}
                  className="btn-pill-navy text-xs py-2 px-5 inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar Arquivo para o Computador
                </a>
              </div>
            )
          ) : booking.presentationLink ? (
            <div className="text-center p-8 bg-white rounded-2xl border border-[#DFE4EE] shadow-sm max-w-lg">
              <Presentation className="w-14 h-14 text-[#D0201A] mx-auto mb-3" />
              <h4 className="font-bold text-[#0A1733] text-base mb-1">
                Apresentação Hospedada na Nuvem
              </h4>
              <p className="text-xs text-[#66728C] mb-4 leading-relaxed">
                A equipe disponibilizou os slides através de um link externo (Canva, Google Slides ou OneDrive).
              </p>
              <div className="p-3 bg-[#F3F5FA] rounded-xl text-xs font-mono text-[#34415E] mb-5 truncate border border-[#DFE4EE]">
                {booking.presentationLink}
              </div>
              <a
                href={booking.presentationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-red text-xs py-2.5 px-6 inline-flex items-center gap-2 shadow-sm font-bold"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Apresentação no Navegador
              </a>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-[#DFE4EE] shadow-sm max-w-md">
              <AlertCircle className="w-12 h-12 text-[#66728C] mx-auto mb-3" />
              <h4 className="font-bold text-[#0A1733] text-sm mb-1">
                Nenhum Arquivo ou Link Enviado
              </h4>
              <p className="text-xs text-[#66728C]">
                A equipe ainda não anexou o PDF ou o link da apresentação deste agendamento.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-white border-t border-[#DFE4EE] px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#66728C]">
          <span>
            UniCarioca 2026/2 • Painel de Acesso Docente às Bancas
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#0A1733] font-medium">
              Idealizado por <strong>Anderson Vieira</strong> (@anderson.vieira.contabil)
            </span>
            <button
              onClick={onClose}
              className="btn-pill-outline text-xs py-1.5 px-4 font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
