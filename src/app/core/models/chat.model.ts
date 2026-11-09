export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChunkDetail {
  chunk_id: string;
  rrf_score: number;
  rerank_score: number | null;
  chunk_index: number | null;
  is_neighbor: boolean;
  speakers: string[];
}

export interface ChatResponse {
  answer: string;
  retrieved_chunk_ids: string[];
  matched_speakers: string[];
  retrieval_confidence: 'high' | 'medium' | 'low';
  generation_confidence: 'high' | 'medium' | 'low';
  judge_verdict: 'pass' | 'needs_review' | 'fail';
  accuracy_pct?: number;
  chunks: ChunkDetail[];
}
