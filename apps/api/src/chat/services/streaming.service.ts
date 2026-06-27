import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface StreamEvent {
  type: 'token' | 'citations' | 'done' | 'error' | 'metadata';
  data: unknown;
}

@Injectable()
export class StreamingService {
  private readonly streams = new Map<string, Subject<StreamEvent>>();

  createStream(conversationId: string): Subject<StreamEvent> {
    const subject = new Subject<StreamEvent>();
    this.streams.set(conversationId, subject);
    return subject;
  }

  getStream(conversationId: string): Subject<StreamEvent> | undefined {
    return this.streams.get(conversationId);
  }

  getStream$(conversationId: string): Observable<StreamEvent> | undefined {
    const subject = this.streams.get(conversationId);
    return subject?.asObservable();
  }

  stopStream(conversationId: string): boolean {
    const subject = this.streams.get(conversationId);
    if (subject) {
      subject.complete();
      this.streams.delete(conversationId);
      return true;
    }
    return false;
  }

  cleanupStream(conversationId: string) {
    this.streams.delete(conversationId);
  }
}
