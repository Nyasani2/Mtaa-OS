// @ts-nocheck
/**
 * ASIS Global Command Engine
 * Executes OS-wide commands from voice or text
 * Maps natural language to app navigation and actions
 */

import { useRouter } from 'expo-router';

export interface CommandResult {
  success: boolean;
  action: string;
  message: string;
  data?: any;
}

export class GlobalCommandEngine {
  private router: any;
  
  constructor(router: any) {
    this.router = router;
  }

  async execute(command: string): Promise<CommandResult> {
    const lower = command.toLowerCase();

    // Navigation commands
    if (lower.includes('open') || lower.includes('go to') || lower.includes('navigate to')) {
      return this.handleNavigation(lower);
    }

    // Booking commands
    if (lower.includes('book') || lower.includes('reserve')) {
      return this.handleBooking(lower);
    }

    // Search commands
    if (lower.includes('search') || lower.includes('find')) {
      return this.handleSearch(lower);
    }

    // Wallet commands
    if (lower.includes('wallet') || lower.includes('balance') || lower.includes('send money')) {
      return this.handleWallet(lower);
    }

    // Health commands
    if (lower.includes('health') || lower.includes('doctor') || lower.includes('appointment')) {
      return this.handleHealth(lower);
    }

    // Transport commands
    if (lower.includes('taxi') || lower.includes('ride') || lower.includes('truck')) {
      return this.handleTransport(lower);
    }

    return {
      success: false,
      action: 'unknown',
      message: "I didn't understand that command. Try 'open wallet' or 'book a taxi'.",
    };
  }

  private handleNavigation(command: string): CommandResult {
    const routes: Record<string, string> = {
      'wallet': '/(os)/wallet',
      'health': '/(os)/health',
      'education': '/(os)/education',
      'shop': '/(os)/shop',
      'market': '/(os)/marketplace',
      'taxi': '/(os)/mtaxi',
      'truck': '/(os)/mtruck',
      'stay': '/(os)/stay',
      'profile': '/(os)/profile',
      'settings': '/(os)/settings',
      'calendar': '/(os)/calendar',
      'phone': '/(os)/phone',
      'contacts': '/(os)/contacts',
    };

    for (const [key, route] of Object.entries(routes)) {
      if (command.includes(key)) {
        try {
          this.router.push(route);
          return {
            success: true,
            action: 'navigate',
            message: `Opening ${key}...`,
            data: { route, app: key },
          };
        } catch (error) {
          return {
            success: false,
            action: 'navigate',
            message: `Failed to open ${key}`,
          };
        }
      }
    }

    return {
      success: false,
      action: 'navigate',
      message: "I couldn't find that app. Available apps: wallet, health, education, shop, taxi, truck, stay.",
    };
  }

  private async handleBooking(command: string): Promise<CommandResult> {
    if (command.includes('stay') || command.includes('apartment') || command.includes('hotel')) {
      // Extract budget and dates
      const budgetMatch = command.match(/budget.*?(\d+)/);
      const budget = budgetMatch ? parseInt(budgetMatch[1]) * 1000 : null;
      
      const daysMatch = command.match(/(\d+)\s*days?/);
      const days = daysMatch ? parseInt(daysMatch[1]) : 1;

      try {
        this.router.push('/(os)/stay');
        return {
          success: true,
          action: 'book_stay',
          message: `Opening Stay app${budget ? ` with budget KES ${budget}` : ''}${days ? ` for ${days} days` : ''}`,
          data: { budget, days },
        };
      } catch (error) {
        return {
          success: false,
          action: 'book_stay',
          message: 'Failed to open Stay app',
        };
      }
    }

    if (command.includes('taxi') || command.includes('ride')) {
      try {
        this.router.push('/(os)/mtaxi');
        return {
          success: true,
          action: 'book_taxi',
          message: 'Opening MTaxi to book a ride...',
        };
      } catch (error) {
        return {
          success: false,
          action: 'book_taxi',
          message: 'Failed to open MTaxi',
        };
      }
    }

    if (command.includes('appointment') || command.includes('doctor')) {
      try {
        this.router.push('/(os)/health');
        return {
          success: true,
          action: 'book_appointment',
          message: 'Opening Health app to book appointment...',
        };
      } catch (error) {
        return {
          success: false,
          action: 'book_appointment',
          message: 'Failed to open Health app',
        };
      }
    }

    return {
      success: false,
      action: 'book',
      message: "I can help you book a stay, taxi, or doctor appointment. What would you like to book?",
    };
  }

  private handleSearch(command: string): CommandResult {
    // This would integrate with ASIS search engine
    return {
      success: true,
      action: 'search',
      message: `Searching for: ${command.replace(/search|find/gi, '').trim()}`,
    };
  }

  private handleWallet(command: string): CommandResult {
    if (command.includes('balance') || command.includes('how much')) {
      return {
        success: true,
        action: 'check_balance',
        message: 'Checking your wallet balance...',
      };
    }

    if (command.includes('send')) {
      try {
        this.router.push('/(os)/wallet/transfer');
        return {
          success: true,
          action: 'send_money',
          message: 'Opening wallet to send money...',
        };
      } catch (error) {
        return {
          success: false,
          action: 'send_money',
          message: 'Failed to open wallet',
        };
      }
    }

    try {
      this.router.push('/(os)/wallet');
      return {
        success: true,
        action: 'open_wallet',
        message: 'Opening wallet...',
      };
    } catch (error) {
      return {
        success: false,
        action: 'open_wallet',
        message: 'Failed to open wallet',
      };
    }
  }

  private handleHealth(command: string): CommandResult {
    try {
      this.router.push('/(os)/health');
      return {
        success: true,
        action: 'open_health',
        message: 'Opening Health app...',
      };
    } catch (error) {
      return {
        success: false,
        action: 'open_health',
        message: 'Failed to open Health app',
      };
    }
  }

  private handleTransport(command: string): CommandResult {
    if (command.includes('taxi') || command.includes('ride')) {
      try {
        this.router.push('/(os)/mtaxi');
        return {
          success: true,
          action: 'open_taxi',
          message: 'Opening MTaxi...',
        };
      } catch (error) {
        return {
          success: false,
          action: 'open_taxi',
          message: 'Failed to open MTaxi',
        };
      }
    }

    if (command.includes('truck')) {
      try {
        this.router.push('/(os)/mtruck');
        return {
          success: true,
          action: 'open_truck',
          message: 'Opening MTruck...',
        };
      } catch (error) {
        return {
          success: false,
          action: 'open_truck',
          message: 'Failed to open MTruck',
        };
      }
    }

    return {
      success: false,
      action: 'transport',
      message: "I can help with taxi or truck. Which one?",
    };
  }
}
