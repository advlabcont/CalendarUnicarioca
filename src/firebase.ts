import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDocFromServer
} from "firebase/firestore";
import firebaseConfigData from "../firebase-applet-config.json";

// Initialize Firebase SDK safely (handling reloads and multi-evaluation)
const app = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();

export const db = (() => {
  try {
    return getFirestore(app, firebaseConfigData.firestoreDatabaseId);
  } catch (err) {
    console.warn("Failed with custom database ID, falling back to default database:", err);
    return getFirestore(app);
  }
})();

// Test connection on boot
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "config", "teacher"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("client is offline")) {
      console.warn("Firestore client offline, using cached data.");
    } else {
      console.warn("Firestore connection check note:", error instanceof Error ? error.message : error);
    }
  }
}
testFirestoreConnection();

export type BookingStatus = "agendado" | "presente" | "apresentando" | "concluido" | "ausente";

export interface TeamMember {
  name: string;
  matricula: string;
}

export interface Turma {
  id: string; // e.g. "turma-1"
  code: string; // "SM26291"
  name: string; // "GFN_DESAFIO 2: PRÁTICAS APLICADAS À GESTÃO FINANCEIRA 2026/2"
  shortName: string;
  presentationDate: string; // "08/12/2026"
  displayDate: string; // "Terça-feira, 08 de Dezembro de 2026"
  timeRange: string; // "19:00 às 21:40"
  intervalMinutes: number; // 20
  location: string;
  description: string;
}

export interface Booking {
  id: string; // e.g. "turma-1_19:00"
  slot: string; // e.g. "19:00 - 19:20"
  turmaId?: string; // e.g. "turma-1"
  turmaCode?: string; // "SM26291"
  turmaName?: string; // subject full title
  presentationDate?: string; // "08/12/2026"
  projectTitle: string;
  members: string; // Formatted summary text for backwards compatibility
  membersList?: TeamMember[]; // Structured up to 10 members with name & matricula
  presentationLink?: string; // Google Slides, Canva, OneDrive, etc.
  presentationFileName?: string; // Uploaded presentation file name (.pdf, .pptx)
  presentationFileData?: string; // Data URL for attached presentation file
  materials?: string[]; // Kept empty for schema compatibility
  customMaterials?: string;
  grade?: string; // Nota atribuída
  status?: BookingStatus; // "agendado" | "presente" | "apresentando" | "concluido" | "ausente"
  feedback?: string; // Observações e parecer do professor
  rubricScores?: Record<string, number>; // Notas por critério
  createdAt: number;
}

export interface Slot {
  id: string; // e.g. "turma-1_19:00"
  time: string; // e.g. "19:00 - 19:20"
  turmaId?: string; // e.g. "turma-1"
}

export interface EventConfig {
  title: string;
  date: string;
  location: string;
  course: string;
  duration: string;
  instructions: string;
}

// Official 5 Turmas configured per academic specifications
export const OFFICIAL_TURMAS: Turma[] = [
  {
    id: "turma-1",
    code: "SM26291",
    name: "GFN_DESAFIO 2: PRÁTICAS APLICADAS À GESTÃO FINANCEIRA 2026/2",
    shortName: "Gestão Financeira",
    presentationDate: "08/12/2026",
    displayDate: "Terça-feira, 08 de Dezembro de 2026",
    timeRange: "19h00 às 21h40 (de 20 em 20 min)",
    intervalMinutes: 20,
    location: "UniCarioca • Auditório Principal",
    description: "Apresentação dos projetos práticos do Desafio 2 em Gestão Financeira."
  },
  {
    id: "turma-2",
    code: "SM26231",
    name: "GES_DESAFIO1:PRÁTICAS EM GESTÃO E IMPACTOS DA IA 2026/2",
    shortName: "Gestão & Impactos da IA (Turma 2)",
    presentationDate: "15/12/2026",
    displayDate: "Terça-feira, 15 de Dezembro de 2026",
    timeRange: "19h00 às 21h40 (de 20 em 20 min)",
    intervalMinutes: 20,
    location: "UniCarioca • Sala de Inovação & IA",
    description: "Apresentação dos projetos do Desafio 1: Práticas em Gestão e Impactos da IA."
  },
  {
    id: "turma-3",
    code: "SM26288B",
    name: "GES_DESAFIO1:PRÁTICAS EM GESTÃO E IMPACTOS DA IA 2026/2",
    shortName: "Gestão & Impactos da IA (Turma 3)",
    presentationDate: "10/12/2026",
    displayDate: "Quinta-feira, 10 de Dezembro de 2026",
    timeRange: "19h00 às 21h40 (de 20 em 20 min)",
    intervalMinutes: 20,
    location: "UniCarioca • Sala de Inovação & IA",
    description: "Apresentação dos projetos do Desafio 1: Práticas em Gestão e Impactos da IA."
  },
  {
    id: "turma-4",
    code: "SM262234",
    name: "_PROJETO DE EXTENSÃO EM VALUATION 2026/2",
    shortName: "Extensão em Valuation",
    presentationDate: "10/12/2026",
    displayDate: "Quinta-feira, 10 de Dezembro de 2026 (Manhã)",
    timeRange: "09h00 às 10h00 (de 15 em 15 min)",
    intervalMinutes: 15,
    location: "UniCarioca • Laboratório de Finanças",
    description: "Apresentação das bancas dos Projetos de Extensão em Valuation."
  },
  {
    id: "turma-5",
    code: "SM262316",
    name: "_ORIENTAÇÃO E PRÁTICAS DE EXTENSÃO EM PROCESSOS GERENCIAIS 2026/2",
    shortName: "Extensão em Processos Gerenciais",
    presentationDate: "11/12/2026",
    displayDate: "Sexta-feira, 11 de Dezembro de 2026 (Manhã)",
    timeRange: "10h00 às 11h00 (de 15 em 15 min)",
    intervalMinutes: 15,
    location: "UniCarioca • Sala Multimídia",
    description: "Apresentação dos projetos de extensão focados em Processos Gerenciais."
  }
];

// Helper to generate slots
function generateTurmaSlots(turmaId: string, startHour: number, startMin: number, endHour: number, endMin: number, stepMin: number): Slot[] {
  const result: Slot[] = [];
  let curHour = startHour;
  let curMin = startMin;

  const totalEndMin = endHour * 60 + endMin;

  while (curHour * 60 + curMin < totalEndMin) {
    const nextTotalMin = curHour * 60 + curMin + stepMin;
    const nextHour = Math.floor(nextTotalMin / 60);
    const nextMin = nextTotalMin % 60;

    const pad = (n: number) => String(n).padStart(2, "0");
    const startTimeStr = `${pad(curHour)}:${pad(curMin)}`;
    const endTimeStr = `${pad(nextHour)}:${pad(nextMin)}`;

    result.push({
      id: `${turmaId}_${startTimeStr}`,
      time: `${startTimeStr} - ${endTimeStr}`,
      turmaId: turmaId
    });

    curHour = nextHour;
    curMin = nextMin;
  }

  return result;
}

// Generate all initial default slots for all 5 turmas
export const DEFAULT_SLOTS: Slot[] = [
  ...generateTurmaSlots("turma-1", 19, 0, 22, 0, 20),
  ...generateTurmaSlots("turma-2", 19, 0, 22, 0, 20),
  ...generateTurmaSlots("turma-3", 19, 0, 22, 0, 20),
  ...generateTurmaSlots("turma-4", 9, 0, 10, 0, 15),
  ...generateTurmaSlots("turma-5", 10, 0, 11, 0, 15),
];

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  title: "Agendamento de Apresentações Acadêmicas",
  date: "Dezembro de 2026",
  location: "UniCarioca • Auditório & Salas",
  course: "Projetos de Extensão & Desafios 2026/2",
  duration: "20 min / 15 min conforme turma",
  instructions: "Selecione a sua turma abaixo, escolha um horário disponível, insira o título do projeto, nome e matrícula dos integrantes e o material da apresentação."
};

const BOOKINGS_COLLECTION = "bookings";
const SLOTS_COLLECTION = "slots";
const CONFIG_COLLECTION = "config";
const CONFIG_TEACHER_DOC = "teacher";
const CONFIG_EVENT_DOC = "eventSettings";

// Get all slots (seeded with the 5 turmas if empty)
export async function getSlots(): Promise<Slot[]> {
  try {
    const colRef = collection(db, SLOTS_COLLECTION);
    const querySnapshot = await getDocs(colRef);
    const slotsList: Slot[] = [];
    querySnapshot.forEach((docSnap) => {
      slotsList.push({ id: docSnap.id, ...docSnap.data() } as Slot);
    });

    if (slotsList.length === 0) {
      for (const slot of DEFAULT_SLOTS) {
        await setDoc(doc(db, SLOTS_COLLECTION, slot.id), slot);
      }
      localStorage.setItem("unicarioca_slots", JSON.stringify(DEFAULT_SLOTS));
      return DEFAULT_SLOTS;
    }

    const sorted = slotsList.sort((a, b) => a.id.localeCompare(b.id));
    localStorage.setItem("unicarioca_slots", JSON.stringify(sorted));
    return sorted;
  } catch (error) {
    console.warn("Erro ao buscar slots no Firestore, usando fallback local:", error);
    const local = localStorage.getItem("unicarioca_slots");
    if (local) {
      try {
        return JSON.parse(local) as Slot[];
      } catch (e) {
        return DEFAULT_SLOTS;
      }
    }
    return DEFAULT_SLOTS;
  }
}

// Save a slot
export async function saveSlot(slot: Slot): Promise<void> {
  const local = localStorage.getItem("unicarioca_slots");
  let slotsList: Slot[] = [];
  if (local) {
    try {
      slotsList = JSON.parse(local) as Slot[];
    } catch (e) {
      slotsList = [];
    }
  }
  slotsList = slotsList.filter((s) => s.id !== slot.id);
  slotsList.push(slot);
  slotsList.sort((a, b) => a.id.localeCompare(b.id));
  localStorage.setItem("unicarioca_slots", JSON.stringify(slotsList));

  try {
    const docRef = doc(db, SLOTS_COLLECTION, slot.id);
    await setDoc(docRef, slot);
  } catch (error) {
    console.error("Erro ao salvar slot no Firestore:", error);
  }
}

// Delete a slot
export async function deleteSlot(slotId: string): Promise<void> {
  const local = localStorage.getItem("unicarioca_slots");
  if (local) {
    try {
      let slotsList = JSON.parse(local) as Slot[];
      slotsList = slotsList.filter((s) => s.id !== slotId);
      localStorage.setItem("unicarioca_slots", JSON.stringify(slotsList));
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const docRef = doc(db, SLOTS_COLLECTION, slotId);
    await deleteDoc(docRef);
    const bookingRef = doc(db, BOOKINGS_COLLECTION, slotId);
    await deleteDoc(bookingRef);
  } catch (error) {
    console.error("Erro ao excluir slot no Firestore:", error);
  }
}

// Reset/Re-seed slots to standard 5 Turmas
export async function resetDefaultTurmaSlots(): Promise<Slot[]> {
  for (const slot of DEFAULT_SLOTS) {
    await setDoc(doc(db, SLOTS_COLLECTION, slot.id), slot);
  }
  localStorage.setItem("unicarioca_slots", JSON.stringify(DEFAULT_SLOTS));
  return DEFAULT_SLOTS;
}

// Teacher Password Management
export async function initializeTeacherPassword() {
  try {
    if (!localStorage.getItem("unicarioca_teacher_password")) {
      localStorage.setItem("unicarioca_teacher_password", "senha");
    }

    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_TEACHER_DOC);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, { password: "senha" });
    } else {
      const dbPwd = docSnap.data().password || "senha";
      localStorage.setItem("unicarioca_teacher_password", dbPwd);
    }
  } catch (error) {
    console.warn("Inicialização de senha em modo offline:", error);
  }
}

export async function getTeacherPassword(): Promise<string> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_TEACHER_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const pwd = docSnap.data().password || "senha";
      localStorage.setItem("unicarioca_teacher_password", pwd);
      return pwd;
    }
  } catch (error) {
    console.warn("Erro ao buscar senha no Firestore, usando local:", error);
  }
  return localStorage.getItem("unicarioca_teacher_password") || "senha";
}

export async function updateTeacherPassword(newPassword: string): Promise<boolean> {
  try {
    localStorage.setItem("unicarioca_teacher_password", newPassword);
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_TEACHER_DOC);
    await setDoc(docRef, { password: newPassword }, { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao salvar senha no Firestore:", error);
    return true;
  }
}

// Event Configuration Management
export async function getEventConfig(): Promise<EventConfig> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_EVENT_DOC);
    const docSnap = await getDoc(docRef);
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
      localStorage.setItem("unicarioca_event_config", JSON.stringify(merged));
      return merged;
    }
  } catch (error) {
    console.warn("Erro ao buscar config do evento:", error);
  }

  const local = localStorage.getItem("unicarioca_event_config");
  if (local) {
    try {
      return JSON.parse(local) as EventConfig;
    } catch (e) {
      return DEFAULT_EVENT_CONFIG;
    }
  }
  return DEFAULT_EVENT_CONFIG;
}

export async function saveEventConfig(config: EventConfig): Promise<void> {
  localStorage.setItem("unicarioca_event_config", JSON.stringify(config));
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_EVENT_DOC);
    await setDoc(docRef, config);
  } catch (error) {
    console.error("Erro ao salvar config do evento no Firestore:", error);
  }
}

// Bookings Management
export async function getBookings(): Promise<Booking[]> {
  try {
    const colRef = collection(db, BOOKINGS_COLLECTION);
    const querySnapshot = await getDocs(colRef);
    const bookings: Booking[] = [];
    querySnapshot.forEach((docSnap) => {
      bookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
    });
    const sorted = bookings.sort((a, b) => a.id.localeCompare(b.id));
    localStorage.setItem("unicarioca_bookings", JSON.stringify(sorted));
    return sorted;
  } catch (error) {
    console.warn("Erro ao carregar agendamentos do Firestore, usando local:", error);
    const local = localStorage.getItem("unicarioca_bookings");
    if (local) {
      try {
        return JSON.parse(local) as Booking[];
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

export async function saveBooking(booking: Omit<Booking, "createdAt"> & { createdAt?: number }): Promise<void> {
  const fullBooking: Booking = {
    ...booking,
    createdAt: booking.createdAt || Date.now(),
    status: booking.status || "agendado"
  };

  const local = localStorage.getItem("unicarioca_bookings");
  let bookings: Booking[] = [];
  if (local) {
    try {
      bookings = JSON.parse(local) as Booking[];
    } catch (e) {
      bookings = [];
    }
  }
  bookings = bookings.filter((b) => b.id !== booking.id);
  bookings.push(fullBooking);
  bookings.sort((a, b) => a.id.localeCompare(b.id));
  localStorage.setItem("unicarioca_bookings", JSON.stringify(bookings));

  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, booking.id);
    await setDoc(docRef, fullBooking);
  } catch (error) {
    console.error("Erro ao salvar agendamento no Firestore:", error);
  }
}

export async function deleteBooking(bookingId: string): Promise<void> {
  const local = localStorage.getItem("unicarioca_bookings");
  if (local) {
    try {
      let bookings = JSON.parse(local) as Booking[];
      bookings = bookings.filter((b) => b.id !== bookingId);
      localStorage.setItem("unicarioca_bookings", JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erro ao deletar agendamento no Firestore:", error);
  }
}

export async function saveBookingGrade(bookingId: string, grade: string): Promise<void> {
  const local = localStorage.getItem("unicarioca_bookings");
  if (local) {
    try {
      let bookings = JSON.parse(local) as Booking[];
      bookings = bookings.map((b) => b.id === bookingId ? { ...b, grade } : b);
      localStorage.setItem("unicarioca_bookings", JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await setDoc(docRef, { grade }, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar nota no Firestore:", error);
  }
}

export async function saveBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const local = localStorage.getItem("unicarioca_bookings");
  if (local) {
    try {
      let bookings = JSON.parse(local) as Booking[];
      bookings = bookings.map((b) => b.id === bookingId ? { ...b, status } : b);
      localStorage.setItem("unicarioca_bookings", JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await setDoc(docRef, { status }, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar status no Firestore:", error);
  }
}

export async function saveBookingEvaluation(
  bookingId: string, 
  data: { 
    grade: string; 
    feedback?: string; 
    rubricScores?: Record<string, number>;
    status?: BookingStatus;
  }
): Promise<void> {
  const local = localStorage.getItem("unicarioca_bookings");
  if (local) {
    try {
      let bookings = JSON.parse(local) as Booking[];
      bookings = bookings.map((b) => b.id === bookingId ? { ...b, ...data } : b);
      localStorage.setItem("unicarioca_bookings", JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar avaliação no Firestore:", error);
  }
}
