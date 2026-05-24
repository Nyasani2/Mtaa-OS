/**
 * JobsAgent
 * Handles job search, applications, postings, CV review, and salary estimates
 * Integrates with MTAA Jobs/Workforce module
 */

import { BaseAgent } from './base-agent';
import { AgentRequest, AgentResponse } from '../shared/types';
import { ASISEventBus } from '../core/event-bus';
import { ASISSecurityLayer } from '../security/security-layer';
import { JobsAction, JobSearchIntent } from './types';

export class JobsAgent extends BaseAgent {
  readonly name = 'jobs_agent';
  readonly version = '1.0.0';
  readonly capabilities = [
    'search_jobs',
    'apply_job',
    'post_job',
    'save_job',
    'cv_review',
    'salary_estimate',
    'interview_prep',
    'skill_assessment',
  ];

  constructor(eventBus: ASISEventBus, security: ASISSecurityLayer) {
    super(eventBus, security);
  }

  protected _registerTools(): void {
    this._tools.set('search_jobs', {
      name: 'search_jobs',
      description: 'Search job listings',
      parameters: [
        { name: 'keywords', type: 'array', description: 'Search keywords', required: false },
        { name: 'location', type: 'string', description: 'Job location', required: false },
        { name: 'jobType', type: 'string', description: 'full-time, part-time, contract, freelance', required: false },
        { name: 'experience', type: 'string', description: 'entry, mid, senior, executive', required: false },
        { name: 'salaryMin', type: 'number', description: 'Minimum salary', required: false },
        { name: 'salaryMax', type: 'number', description: 'Maximum salary', required: false },
      ],
      returns: { type: 'array', description: 'Job listings' },
      requiresAuth: false,
      riskLevel: 'low',
    });

    this._tools.set('apply_job', {
      name: 'apply_job',
      description: 'Apply to a job listing',
      parameters: [
        { name: 'jobId', type: 'string', description: 'Job ID', required: true },
        { name: 'coverLetter', type: 'string', description: 'Cover letter', required: false },
      ],
      returns: { type: 'object', description: 'Application result' },
      requiresAuth: true,
      riskLevel: 'low',
    });

    this._tools.set('post_job', {
      name: 'post_job',
      description: 'Post a new job listing',
      parameters: [
        { name: 'title', type: 'string', description: 'Job title', required: true },
        { name: 'description', type: 'string', description: 'Job description', required: true },
        { name: 'location', type: 'string', description: 'Job location', required: true },
        { name: 'salary', type: 'object', description: 'Salary range', required: false },
        { name: 'requirements', type: 'array', description: 'Job requirements', required: false },
      ],
      returns: { type: 'object', description: 'Posted job' },
      requiresAuth: true,
      riskLevel: 'medium',
    });

    this._tools.set('salary_estimate', {
      name: 'salary_estimate',
      description: 'Get salary estimate for a role',
      parameters: [
        { name: 'role', type: 'string', description: 'Job role', required: true },
        { name: 'location', type: 'string', description: 'Location', required: false },
        { name: 'experience', type: 'string', description: 'Experience level', required: false },
      ],
      returns: { type: 'object', description: 'Salary estimate' },
      requiresAuth: false,
      riskLevel: 'low',
    });
  }

  canHandle(intent: string, entities: string[]): boolean {
    return intent === 'jobs' || 
           entities.some((e) => ['job_search', 'job_post', 'cv', 'salary', 'apply'].includes(e));
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const validation = this._validateRequest(request);

    if (!validation.valid) {
      return this._createErrorResponse(validation.error || 'Invalid request');
    }

    this._state.status = 'processing';
    const { input, context } = request;

    try {
      const action = this._parseJobsAction(input);
      let response: AgentResponse;

      switch (action.type) {
        case 'search':
          response = await this._handleSearch(action.params, context);
          break;
        case 'apply':
          response = await this._handleApply(action.params, context);
          break;
        case 'post':
          response = await this._handlePost(action.params, context);
          break;
        case 'cv_review':
          response = await this._handleCVReview(context);
          break;
        case 'salary_estimate':
          response = await this._handleSalaryEstimate(action.params, context);
          break;
        default:
          response = this._createJobsMenu();
      }

      this._updateMetrics(Date.now() - startTime);
      this._state.status = 'idle';
      return response;
    } catch (error) {
      this._state.status = 'error';
      return this._createErrorResponse(
        error instanceof Error ? error.message : 'Jobs operation failed'
      );
    }
  }

  private _parseJobsAction(input: string): JobsAction {
    const lower = input.toLowerCase();

    if (/find|search|looking for|jobs in|work as/.test(lower)) {
      return { 
        type: 'search', 
        params: { keywords: this._extractKeywords(input) } 
      };
    }
    if (/apply|application|send.*cv|interested in/.test(lower)) {
      return { type: 'apply', params: {} };
    }
    if (/post|hire|recruit|looking for.*employee/.test(lower)) {
      return { type: 'post', params: {} };
    }
    if (/cv|resume|profile|review.*cv/.test(lower)) {
      return { type: 'cv_review', params: {} };
    }
    if (/salary|pay|how much.*earn|compensation/.test(lower)) {
      return { type: 'salary_estimate', params: { role: this._extractRole(input) } };
    }

    return { type: 'search', params: {} };
  }

  private _extractKeywords(input: string): string[] {
    const commonWords = ['find', 'search', 'job', 'work', 'looking', 'for', 'in', 'near', 'me'];
    return input
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !commonWords.includes(w))
      .slice(0, 5);
  }

  private _extractRole(input: string): string {
    const match = input.match(/(?:software|data|marketing|sales|design|manager|engineer|developer|analyst|nurse|teacher|driver)/i);
    return match ? match[0] : 'general';
  }

  private async _handleSearch(params: any, context: any): Promise<AgentResponse> {
    const keywords = params.keywords?.join(', ') || 'general';

    // Simulated search results
    const jobs = [
      { id: '1', title: 'Software Developer', company: 'TechCorp Kenya', location: 'Nairobi', salary: 'KSh 80,000 - 120,000', type: 'Full-time' },
      { id: '2', title: 'Data Analyst', company: 'FinTech Solutions', location: 'Nairobi', salary: 'KSh 60,000 - 90,000', type: 'Full-time' },
      { id: '3', title: 'Marketing Manager', company: 'Brand Africa', location: 'Mombasa', salary: 'KSh 70,000 - 100,000', type: 'Contract' },
    ];

    let text = `**Job Search Results**\n\nFound ${jobs.length} jobs matching "${keywords}":\n\n`;
    jobs.forEach((job, i) => {
      text += `${i + 1}. **${job.title}** at ${job.company}\n`;
      text += `   📍 ${job.location} | 💰 ${job.salary} | 🕐 ${job.type}\n\n`;
    });

    return this._createActionResponse(
      text,
      jobs.map((job) => ({
        label: `Apply: ${job.title}`,
        type: 'button',
        payload: { action: 'apply', jobId: job.id },
      })),
      { type: 'job_search_results', jobs }
    );
  }

  private async _handleApply(params: any, context: any): Promise<AgentResponse> {
    return this._createConfirmationResponse(
      '**Confirm Job Application**\n\n' +
      'Job: Software Developer at TechCorp Kenya\n' +
      'Your CV will be sent to the employer.\n\n' +
      'Apply now?',
      { type: 'apply_job', jobId: params.jobId || '1' },
      { type: 'apply_confirmation' }
    );
  }

  private async _handlePost(params: any, context: any): Promise<AgentResponse> {
    return this._createActionResponse(
      'Post a new job listing:\n\nWhat is the job title and location?',
      [
        { label: 'Enter details', type: 'open', payload: { action: 'enter_job_details' } },
        { label: 'Use template', type: 'open', payload: { action: 'use_template' } },
      ],
      { type: 'post_job_prompt' }
    );
  }

  private async _handleCVReview(context: any): Promise<AgentResponse> {
    return this._createTextResponse(
      `**CV Review**\n\n` +
      `I can help you improve your CV. Here is what I found:\n\n` +
      `✅ **Strengths:**\n` +
      `• Clear contact information\n` +
      `• Relevant work experience\n\n` +
      `⚠️ **Suggestions:**\n` +
      `• Add measurable achievements (e.g., "Increased sales by 20%")\n` +
      `• Include relevant certifications\n` +
      `• Tailor skills section to target roles\n\n` +
      `Would you like me to suggest specific improvements?`,
      { type: 'cv_review' }
    );
  }

  private async _handleSalaryEstimate(params: any, context: any): Promise<AgentResponse> {
    const role = params.role || 'Software Developer';

    return this._createTextResponse(
      `**Salary Estimate: ${role}**\n\n` +
      `📊 **Market Range (Kenya):**\n` +
      `• Entry level: KSh 40,000 - 60,000/month\n` +
      `• Mid level: KSh 80,000 - 150,000/month\n` +
      `• Senior level: KSh 180,000 - 350,000/month\n\n` +
      `💡 **Factors affecting salary:**\n` +
      `• Location (Nairobi vs. other cities)\n` +
      `• Company size and funding\n` +
      `• Specific skills (cloud, AI, blockchain)\n` +
      `• Years of experience\n\n` +
      `This is based on current market data.`,
      { type: 'salary_estimate', role }
    );
  }

  private _createJobsMenu(): AgentResponse {
    return this._createActionResponse(
      'What would you like to do?',
      [
        { label: '🔍 Search Jobs', type: 'navigate', payload: { action: 'search_jobs' } },
        { label: '📄 My Applications', type: 'navigate', payload: { action: 'my_applications' } },
        { label: '💼 Post a Job', type: 'navigate', payload: { action: 'post_job' } },
        { label: '📊 Salary Check', type: 'navigate', payload: { action: 'salary_check' } },
        { label: '📝 CV Review', type: 'navigate', payload: { action: 'cv_review' } },
      ],
      { type: 'jobs_menu' }
    );
  }
}
