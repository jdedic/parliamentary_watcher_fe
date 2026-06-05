import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlenarySession, SessionListResponse } from '../models/session.model';
import { ChatMessage, ChatResponse } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getSessions(skip = 0, limit = 20, title?: string): Observable<SessionListResponse> {
    let params = new HttpParams().set('skip', skip).set('limit', limit).set('status', 'SUMMARISED');
    if (title) params = params.set('title', title);
    return this.http.get<SessionListResponse>(`${this.base}/sessions`, { params });
  }

  getSession(id: string): Observable<PlenarySession> {
    return this.http.get<PlenarySession>(`${this.base}/sessions/${id}`);
  }

  chat(sessionId: string, message: string, history: ChatMessage[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/sessions/${sessionId}/chat`, { message, history });
  }
}
