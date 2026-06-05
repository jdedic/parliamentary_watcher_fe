import { TestBed } from '@angular/core/testing';
import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new MarkdownPipe(sanitizer);
  });

  it('converts markdown heading to HTML containing <h1>', () => {
    const result = pipe.transform('# Hello');
    expect(result).toContain('<h1>');
  });

  it('calls DomSanitizer.sanitize and never calls bypassSecurityTrustHtml', () => {
    const sanitizeSpy = vi.spyOn(sanitizer, 'sanitize');
    const bypassSpy = vi.spyOn(sanitizer, 'bypassSecurityTrustHtml');

    pipe.transform('# Hello');

    expect(sanitizeSpy).toHaveBeenCalledWith(SecurityContext.HTML, expect.any(String));
    expect(bypassSpy).not.toHaveBeenCalled();
  });
});
