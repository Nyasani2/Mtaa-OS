// ASIS v1 - Context Builder
// Injects MTAA-wide user, community, business, and government context into prompts

import { AsisContext, AsisUserProfile, AsisWalletContext } from '../types';

export class ContextBuilder {
  /**
   * Build enriched context from all MTAA systems
   * This pulls from Supabase tables via the edge function
   */
  async build(request: {
    context: AsisContext;
    userId: string;
  }): Promise<AsisContext & { profile?: AsisUserProfile; wallet?: AsisWalletContext }> {
    const { context, userId } = request;

    // Fetch user profile from identity system
    const profile = await this.fetchUserProfile(userId);

    // Fetch wallet context if relevant
    const wallet = await this.fetchWalletContext(userId, context.currentApp);

    // Fetch community context if relevant
    const community = await this.fetchCommunityContext(userId);

    // Fetch recent activity across MTAA
    const recentActivity = await this.fetchRecentActivity(userId);

    return {
      ...context,
      profile,
      wallet,
      community,
      recentActivity,
    };
  }

  private async fetchUserProfile(userId: string): Promise<AsisUserProfile | undefined> {
    // Delegated to edge function — client never queries DB directly
    // Edge function queries: profiles, user_skills, user_education, user_businesses
    return undefined; // Placeholder — actual implementation in edge function
  }

  private async fetchWalletContext(
    userId: string,
    currentApp: string
  ): Promise<AsisWalletContext | undefined> {
    if (currentApp !== 'wallet' && !this.isWalletRelated(currentApp)) {
      return undefined;
    }
    // Edge function queries: wallets, transactions, payment_methods, fx_rates
    return undefined; // Placeholder
  }

  private async fetchCommunityContext(userId: string): Promise<any> {
    // Edge function queries: user_communities, community_stats, local_events
    return undefined;
  }

  private async fetchRecentActivity(userId: string): Promise<any> {
    // Edge function queries: recent_sessions, recent_actions, notifications
    return undefined;
  }

  private isWalletRelated(app: string): boolean {
    return ['marketplace', 'appstore', 'jobs', 'transport'].includes(app);
  }

  /**
   * Build wallet-specific context string for prompt injection
   */
  buildWalletContext(wallet: AsisWalletContext): string {
    const recentTx = wallet.recentTransactions
      .slice(0, 5)
      .map(tx => `${tx.type}: ${tx.amount} ${tx.currency} to ${tx.counterparty} (${tx.status})`)
      .join('\n');

    const paymentMethods = wallet.paymentMethods
      .map(pm => `${pm.type} (${pm.provider})${pm.isDefault ? ' [default]' : ''}`)
      .join(', ');

    return `
WALLET CONTEXT:
- Balance: ${wallet.balance} ${wallet.currency}
- Monthly spend: ${wallet.monthlySpend} ${wallet.currency}
- Monthly income: ${wallet.monthlyIncome} ${wallet.currency}
- Savings goal: ${wallet.savingsGoal || 'Not set'}
- Fraud score: ${wallet.fraudScore}/100 (lower is safer)
- Payment methods: ${paymentMethods}
- Recent transactions:
${recentTx}
- FX rates available: ${Object.keys(wallet.fxRates).join(', ')}
`;
  }

  /**
   * Build user profile context string
   */
  buildProfileContext(profile: AsisUserProfile): string {
    const skills = profile.skills.join(', ');
    const education = profile.education
      .map(ed => `${ed.qualification} in ${ed.field} from ${ed.institution} (${ed.year})`)
      .join('\n');
    const businesses = profile.businesses
      .map(b => `${b.name} (${b.type}) — ${b.status}`)
      .join(', ');

    return `
USER PROFILE:
- Name: ${profile.name}
- KYC Status: ${profile.kycStatus}
- Skills: ${skills}
- Education:
${education}
- Businesses: ${businesses || 'None'}
- Communities: ${profile.communities.join(', ')}
- Interests: ${profile.interests.join(', ')}
- Preferred language: ${profile.preferredLanguage}
`;
  }

  /**
   * Build community context string
   */
  buildCommunityContext(community: any): string {
    if (!community) return '';
    return `
COMMUNITY CONTEXT:
- Region: ${community.region || 'Unknown'}
- Local opportunities: ${community.opportunities || 'None identified'}
- Community needs: ${community.needs || 'None identified'}
- Safety status: ${community.safetyStatus || 'Unknown'}
`;
  }
}

export default ContextBuilder;
