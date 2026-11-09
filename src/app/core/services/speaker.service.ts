import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Speaker } from '../models/speaker.model';

@Injectable({ providedIn: 'root' })
export class SpeakerService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getSpeaker(id: number): Observable<Speaker> {
    return this.http.get<Speaker>(`${this.base}/speakers/${id}`);
  }

  getSpeakerImage(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/speakers/${id}/image`, { responseType: 'blob' });
  }
}
