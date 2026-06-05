import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'excerpt', standalone: true, pure: true })
export class ExcerptPipe implements PipeTransform {
  transform(text: string | null | undefined, words = 28): string {
    if (!text) return '';
    const w = text.split(' ');
    return w.length <= words ? text : w.slice(0, words).join(' ') + '…';
  }
}
