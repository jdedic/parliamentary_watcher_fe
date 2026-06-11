export interface PlenarySessionListItem {
  id: string;
  title: string | null;
  date: string | null;
  room: string | null;
  chair: string | null;
  summary: string | null;
  summary_en: string | null;
  status: SessionStatus | null;
  meeting_number: number | null;
  parliamentary_year: string | null;
}

export interface SessionListResponse {
  total: number;
  sessions: PlenarySessionListItem[];
}

export interface PlenarySession {
  id: string;
  title: string | null;
  date: string | null;
  parliamentary_year: string | null;
  meeting_number: number | null;
  room: string | null;
  chair: string | null;
  status: SessionStatus | null;
  summary: string | null;
  stances: StancesResponse | null;
  summary_sources: SummarySource[] | null;
  summary_en: string | null;
  stances_en: StancesResponse | null;
  documents: SessionDocument[];
}

export type SessionStatus = 'DOWNLOADED' | 'FAILED' | 'CHUNK_SUMMARISED' | 'SUMMARISED';

export interface StancesResponse {
  extracted_at: string;
  model: string;
  stances: Stance[];
}

export interface Stance {
  speaker: string;
  party: string | null;
  activity: string;
  stance: 'support' | 'oppose' | 'unclear';
  summary: string;
  evidence: string;
  utterance_ids: string[];
}

export interface SummarySource {
  chunk_id: string;
  utterance_ids: string[];
}

export interface SessionDocument {
  id: number;
  document_id: string;
  file_path: string | null;
  downloaded_at: string;
}
