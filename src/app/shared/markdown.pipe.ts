import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | string[] | null | undefined): string {
    if (!value) return '';
    const text = Array.isArray(value) ? value.join('\n') : value;
    const rawHtml = marked(text) as string;
    return this.sanitizer.sanitize(SecurityContext.HTML, rawHtml) ?? '';
  }
}
