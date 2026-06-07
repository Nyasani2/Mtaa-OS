/**
 * ASIS Message Renderer
 * Renders messages with markdown support, cards, and action buttons
 * Handles both plain text and rich content
 */

import { ChatMessage, MessageCard, ChatAction, RenderOptions, MarkdownConfig } from './types';
import { Text } from 'react-native';


export class ASISMessageRenderer {
  private _markdownConfig: MarkdownConfig;

  constructor(config?: Partial<MarkdownConfig>) {
    this._markdownConfig = {
      enabled: true,
      allowLinks: true,
      allowCode: true,
      allowTables: false,
      maxHeadingLevel: 3,
      ...config,
    };
  }

  /**
   * Renders a message to HTML/React-compatible format
   */
  render(message: ChatMessage, options?: Partial<RenderOptions>): string {
    const opts: RenderOptions = {
      animate: true,
      showTimestamp: true,
      showStatus: true,
      compact: false,
      maxLines: 0,
      ...options,
    };

    let html = '';

    // Render content based on type
    switch (message.type) {
      case 'text':
      case 'stream':
        html = this._renderText(message.content, opts);
        break;
      case 'card':
        html = message.card ? this._renderCard(message.card, opts) : this._renderText(message.content, opts);
        break;
      case 'action':
        html = this._renderText(message.content, opts);
        if (message.actions) {
          html += this._renderActions(message.actions);
        }
        break;
      case 'error':
        html = this._renderError(message.content);
        break;
      case 'system':
        html = this._renderSystem(message.content);
        break;
      default:
        html = this._renderText(message.content, opts);
    }

    return html;
  }

  /**
   * Renders text with markdown support
   */
  private _renderText(content: string, options: RenderOptions): string {
    if (!this._markdownConfig.enabled) {
      return this._escapeHtml(content).replace(/\n/g, '');
    }

    let html = content;

    // Escape HTML first
    html = this._escapeHtml(html);

    // Headers
    if (this._markdownConfig.maxHeadingLevel >= 1) {
      html = html.replace(/^# (.*$)/gim, '<Text>$1</Text>');
    }
    if (this._markdownConfig.maxHeadingLevel >= 2) {
      html = html.replace(/^## (.*$)/gim, '<Text>$1</Text>');
    }
    if (this._markdownConfig.maxHeadingLevel >= 3) {
      html = html.replace(/^### (.*$)/gim, '<Text>$1</Text>');
    }

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code inline
    if (this._markdownConfig.allowCode) {
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    // Links
    if (this._markdownConfig.allowLinks) {
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<View>$1</View>');
    html = html.replace(/(<View>.*<\/li>)/s, '<View>$1</View>');

    // Line breaks
    html = html.replace(/\n/g, '');

    // Compact mode: truncate if needed
    if (options.compact && options.maxLines > 0) {
      const lines = html.split('');
      if (lines.length > options.maxLines) {
        html = lines.slice(0, options.maxLines).join('') + '...';
      }
    }

    return html;
  }

  /**
   * Renders a card component
   */
  private _renderCard(card: MessageCard, options: RenderOptions): string {
    const parts: string[] = ['<View class="asis-card">'];

    if (card.image) {
      parts.push(`<Image src="${card.image}" alt="${card.title}" class="asis-card-image" />`);
    }

    parts.push('<View class="asis-card-content">');
    parts.push(`<h4 class="asis-card-title">${this._escapeHtml(card.title)}</h4>`);

    if (card.subtitle) {
      parts.push(`<Text class="asis-card-subtitle">${this._escapeHtml(card.subtitle)}</Text>`);
    }

    if (card.description) {
      parts.push(`<Text class="asis-card-description">${this._renderText(card.description, options)}</Text>`);
    }

    if (card.metadata) {
      parts.push('<dl class="asis-card-metadata">');
      for (const [key, value] of Object.entries(card.metadata)) {
        parts.push(`<dt>${this._escapeHtml(key)}</dt>`);
        parts.push(`<dd>${this._escapeHtml(value)}</dd>`);
      }
      parts.push('</dl>');
    }

    parts.push('</View>');

    if (card.actions) {
      parts.push(this._renderActions(card.actions));
    }

    parts.push('</View>');

    return parts.join('\n');
  }

  /**
   * Renders action buttons
   */
  private _renderActions(actions: ChatAction[]): string {
    const buttons = actions.map((action) => {
      const variantClass = `asis-btn-${action.variant}`;
      const disabled = action.disabled ? 'disabled' : '';
      const loading = action.loading ? 'asis-btn-loading' : '';

      return `<TouchableOpacity 
        class="asis-btn ${variantClass} ${loading}" 
        data-action-id="${action.id}"
        ${disabled}
      >
        ${action.icon ? `<Text class="asis-btn-icon">${action.icon}</Text>` : ''}
        <Text class="asis-btn-label">${this._escapeHtml(action.label)}</Text>
      </TouchableOpacity>`;
    });

    return `<View class="asis-actions">${buttons.join('')}</View>`;
  }

  /**
   * Renders error message
   */
  private _renderError(content: string): string {
    return `<View class="asis-error">
      <Text class="asis-error-icon">⚠️</Text>
      <Text class="asis-error-text">${this._escapeHtml(content)}</Text>
    </View>`;
  }

  /**
   * Renders system message
   */
  private _renderSystem(content: string): string {
    return `<View class="asis-system-message">
      <Text class="asis-system-icon">ℹ️</Text>
      <Text class="asis-system-text">${this._escapeHtml(content)}</Text>
    </View>`;
  }

  /**
   * Extracts plain text from a message (for accessibility)
   */
  extractPlainText(message: ChatMessage): string {
    // Strip markdown and HTML
    let text = message.content;
    text = text.replace(/[#*_`\[\]\(\)]/g, '');
    text = text.replace(/\n/g, ' ');
    return text.trim();
  }

  /**
   * Generates accessibility label for a message
   */
  getAccessibilityLabel(message: ChatMessage): string {
    const role = message.role === 'user' ? 'You said' : message.role === 'asis' ? 'ASIS said' : 'System';
    const text = this.extractPlainText(message);
    const time = new Date(message.timestamp).toLocaleTimeString();
    return `${role} at ${time}: ${text}`;
  }

  private _escapeHtml(text: string): string {
    const div = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, (m) => div[m as keyof typeof div]);
  }
}