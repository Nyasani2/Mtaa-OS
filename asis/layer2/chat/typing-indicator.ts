/**
 * ASIS Typing Indicator
 * Manages typing state and animated indicator
 */

import { TypingIndicatorProps } from './types';

export class ASISTypingIndicator {
  private _visible: boolean = false;
  private _text: string = 'ASIS is typing';
  private _dots: number = 3;
  private _interval: any = null;
  private _currentDots: number = 0;
  private _listeners: Set<(state: TypingIndicatorProps) => void> = new Set();

  get state(): TypingIndicatorProps {
    return {
      visible: this._visible,
      text: this._text,
      dots: this._dots,
    };
  }

  subscribe(listener: (state: TypingIndicatorProps) => void): () => void {
    this._listeners.add(listener);
    listener(this.state);
    return () => this._listeners.delete(listener);
  }

  show(text?: string): void {
    this._visible = true;
    if (text) this._text = text;
    this._startAnimation();
    this._notify();
  }

  hide(): void {
    this._visible = false;
    this._stopAnimation();
    this._notify();
  }

  setText(text: string): void {
    this._text = text;
    this._notify();
  }

  private _startAnimation(): void {
    this._stopAnimation();
    this._currentDots = 0;
    this._interval = setInterval(() => {
      this._currentDots = (this._currentDots + 1) % (this._dots + 1);
      this._notify();
    }, 500);
  }

  private _stopAnimation(): void {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._currentDots = 0;
  }

  getAnimatedText(): string {
    if (!this._visible) return '';
    const dots = '.'.repeat(this._currentDots);
    return `${this._text}${dots}`;
  }

  private _notify(): void {
    const state = this.state;
    this._listeners.forEach((l) => l(state));
  }
}
