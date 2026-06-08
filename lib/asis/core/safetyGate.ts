// ASIS v1 - Safety Gate
// Enforces the safe-evolution-gate: ASIS cannot modify kernel/auth/system files

import { AsisRequest, AsisSafetyCheck, SafetyViolation } from '../types';

export class SafetyGate {
  // Patterns that indicate attempts to bypass security or modify system
  private readonly DANGEROUS_PATTERNS = [
    // Kernel/auth bypass attempts
    /bypass\s+(pin|password|auth|mfa|biometric)/i,
    /disable\s+(security|auth|verification|rls)/i,
    /modify\s+(kernel|system|auth|security)\s+(file|config|setting)/i,
    /delete\s+(user|admin|system)\s+(account|record|data)/i,
    /grant\s+(admin|superuser|root)\s+(access|privilege)/i,
    /inject\s+(sql|code|script|command)/i,
    /exploit\s+(vulnerability|bug|flaw)/i,
    /hack\s+(system|database|wallet|account)/i,

    // Data exposure attempts
    /show\s+(all|every)\s+(user|wallet|transaction|password)/i,
    /dump\s+(database|table|schema)/i,
    /export\s+(all|every)\s+(user|record)/i,
    /access\s+(other|someone|another)\s+(wallet|account|data)/i,

    // Instruction injection
    /ignore\s+(previous|above|earlier)\s+(instruction|rule|prompt)/i,
    /override\s+(system|safety|security)\s+(instruction|rule|prompt)/i,
    /pretend\s+(you are|to be)\s+(admin|root|system)/i,
    /act\s+as\s+(admin|root|superuser)/i,
    /new\s+instruction:/i,
    /system\s+prompt\s+leak/i,

    // Harmful content
    /create\s+(malware|virus|ransomware|trojan)/i,
    /phishing\s+(email|site|page)/i,
    /steal\s+(data|money|identity|credentials)/i,
    /fraudulent\s+(transaction|claim|application)/i,
  ];

  // Allowed operations that might look suspicious but are legitimate
  private readonly ALLOWED_PATTERNS = [
    /how\s+(do|can|to)\s+(i|you)\s+(change|update|reset)\s+my\s+pin/i,
    /i\s+forgot\s+my\s+pin/i,
    /how\s+to\s+secure\s+my\s+account/i,
    /enable\s+(two.factor|2fa|mfa)/i,
    /what\s+is\s+my\s+(balance|transaction\s+history)/i,
    /help\s+me\s+understand\s+my\s+(spending|income|budget)/i,
  ];

  async check(request: AsisRequest): Promise<AsisSafetyCheck> {
    const violations: SafetyViolation[] = [];
    const message = request.message.toLowerCase();

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(message)) {
        const match = message.match(pattern);
        const isAllowed = this.ALLOWED_PATTERNS.some(allowed => allowed.test(message));

        if (!isAllowed) {
          violations.push({
            type: this.classifyViolation(pattern),
            severity: this.assessSeverity(pattern, message),
            description: `Detected potentially harmful pattern: "${match?.[0] || 'unknown'}"`,
            blocked: true,
          });
        }
      }
    }

    // Check for kernel/auth context in system prompts
    if (request.context.currentApp === 'kernel' || request.context.currentApp === 'auth') {
      violations.push({
        type: 'kernel_access',
        severity: 'critical',
        description: 'ASIS cannot operate in kernel or auth context. Requests must be routed through proper channels.',
        blocked: true,
      });
    }

    // Check message length (basic DoS prevention)
    if (request.message.length > 10000) {
      violations.push({
        type: 'instruction_injection',
        severity: 'medium',
        description: 'Message exceeds maximum length (10000 characters).',
        blocked: true,
      });
    }

    // Check for excessive special characters (obfuscation attempts)
    const specialCharRatio = (request.message.match(/[^\w\s]/g) || []).length / request.message.length;
    if (specialCharRatio > 0.5 && request.message.length > 100) {
      violations.push({
        type: 'instruction_injection',
        severity: 'medium',
        description: 'High ratio of special characters detected — possible obfuscation attempt.',
        blocked: true,
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      sanitizedMessage: violations.length > 0 ? undefined : request.message,
    };
  }

  private classifyViolation(pattern: RegExp): SafetyViolation['type'] {
    const patternStr = pattern.toString();
    if (patternStr.includes('bypass') || patternStr.includes('disable') || patternStr.includes('grant')) {
      return 'auth_bypass';
    }
    if (patternStr.includes('show') || patternStr.includes('dump') || patternStr.includes('export') || patternStr.includes('access')) {
      return 'data_exposure';
    }
    if (patternStr.includes('ignore') || patternStr.includes('override') || patternStr.includes('pretend') || patternStr.includes('act as') || patternStr.includes('instruction')) {
      return 'instruction_injection';
    }
    if (patternStr.includes('malware') || patternStr.includes('phishing') || patternStr.includes('steal') || patternStr.includes('fraudulent')) {
      return 'harmful_content';
    }
    return 'kernel_access';
  }

  private assessSeverity(pattern: RegExp, message: string): SafetyViolation['severity'] {
    const patternStr = pattern.toString().toLowerCase();

    // Critical: Direct system compromise attempts
    if (patternStr.includes('kernel') || patternStr.includes('auth') || patternStr.includes('system file') || patternStr.includes('rls')) {
      return 'critical';
    }

    // High: Data exposure or privilege escalation
    if (patternStr.includes('admin') || patternStr.includes('dump') || patternStr.includes('all user') || patternStr.includes('exploit')) {
      return 'high';
    }

    // Medium: Injection or obfuscation
    if (patternStr.includes('inject') || patternStr.includes('instruction') || patternStr.includes('override')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Sanitize user message for safe processing
   * Removes potential prompt injection sequences
   */
  sanitize(message: string): string {
    return message
      .replace(/<\/?system>/gi, '')
      .replace(/\[\s\S]*?\]/g, '')
      .replace(/\{\s*\"role\"\s*:\s*\"system\"[\s\S]*?\}/gi, '')
      .replace(/ignore all previous instructions/gi, '')
      .replace(/you are now .*? mode/gi, '')
      .replace(/new persona:/gi, '')
      .trim();
  }
}

export default SafetyGate;
