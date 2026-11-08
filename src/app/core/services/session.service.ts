import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlenarySession, SessionListResponse } from '../models/session.model';
import { ChatMessage, ChatResponse } from '../models/chat.model';
import { ChatAuthService } from './chat-auth.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);
  private chatAuth = inject(ChatAuthService);
  private base = environment.apiUrl;

  getSessions(skip = 0, limit = 20, title?: string, isFinal?: boolean): Observable<SessionListResponse> {
    let params = new HttpParams().set('skip', skip).set('limit', limit).set('status', 'SUMMARISED');
    if (title) params = params.set('title', title);
    if (isFinal !== undefined) params = params.set('is_final', isFinal);
    return this.http.get<SessionListResponse>(`${this.base}/sessions`, { params });
  }

  getSession(id: string): Observable<PlenarySession> {
    return this.http.get<PlenarySession>(`${this.base}/sessions/${id}`);
  }

  chat(sessionId: string, message: string, history: ChatMessage[]): Observable<ChatResponse> {
    const key = this.chatAuth.key();
    const headers = key ? new HttpHeaders({ 'X-Chat-Key': key }) : undefined;
    return this.http.post<ChatResponse>(`${this.base}/sessions/${sessionId}/chat`, { message, history }, { headers });
  }

  verifyChat(password: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/chat`, { password });
  }
}
