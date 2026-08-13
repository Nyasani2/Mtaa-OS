/**
 * ASIS v7 Intent Router
 * Classifies user queries into intent categories using pattern matching
 * + user context + Kamos Theory observation history
 * No ML model needed — deterministic, fast, explainable
 * Kamos Theory: observation of past patterns → growth → better classification
 */

import {
  IntentResult, IntentCategory, Entity, EntityType,
  ContextVector, KamosState, ToolType,
} from '../types';

// ─── Intent Pattern Definitions ─────────────────────────────────

interface IntentPattern {
  category: IntentCategory;
  keywords: string[];
  phrases: string[];
  entityTypes: EntityType[];
  requiredTools: ToolType[];
  confidenceBoost: number;
  contextHints: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  // ─── Weather ─────────────────────────────────────────────────
  {
    category: 'weather',
    keywords: ['weather', 'temperature', 'temp', 'rain', 'raining', 'sunny', 'cloudy', 'forecast', 'humidity', 'wind', 'storm', 'snow', 'hot', 'cold', 'warm', 'chilly', 'degrees', 'celsius', 'fahrenheit'],
    phrases: [
      'what\'s the weather', 'how\'s the weather', 'will it rain', 'is it going to rain',
      'weather today', 'weather tomorrow', 'weather forecast', 'temperature today',
      'how hot is it', 'how cold is it', 'what\'s the temp', 'current weather',
    ],
    entityTypes: ['location', 'date', 'time'],
    requiredTools: ['search', 'weather_parse'],
    confidenceBoost: 0.9,
    contextHints: ['location_known'],
  },
  // ─── News ────────────────────────────────────────────────────
  {
    category: 'news',
    keywords: ['news', 'headlines', 'breaking', 'latest', 'update', 'happening', 'current events', 'today in', 'what happened', 'report'],
    phrases: [
      'what are the news', 'latest news', 'breaking news', 'news headlines',
      'what happened today', 'current events', 'news update', 'top stories',
      'what\'s happening', 'news about', 'tell me about',
    ],
    entityTypes: ['date', 'location'],
    requiredTools: ['search', 'news_rss'],
    confidenceBoost: 0.85,
    contextHints: [],
  },
  // ─── Math / Calculator ───────────────────────────────────────
  {
    category: 'math',
    keywords: ['calculate', 'compute', 'solve', 'math', 'equation', 'formula', 'sum', 'difference', 'product', 'quotient', 'square root', 'log', 'sin', 'cos', 'tan', 'derivative', 'integral', 'algebra', 'geometry', 'statistics'],
    phrases: [
      'what is', 'calculate', 'solve for', 'find the value', 'compute',
      'how much is', 'what\'s', 'math problem', 'equation',
    ],
    entityTypes: ['number', 'operation'],
    requiredTools: ['code_execute', 'calculator'],
    confidenceBoost: 0.95,
    contextHints: ['numbers_in_query'],
  },
  // ─── Code Help ───────────────────────────────────────────────
  {
    category: 'code_help',
    keywords: ['code', 'programming', 'bug', 'error', 'fix', 'debug', 'function', 'class', 'variable', 'syntax', 'compile', 'runtime', 'api', 'library', 'framework', 'react', 'javascript', 'typescript', 'python', 'sql', 'html', 'css'],
    phrases: [
      'how to code', 'write a function', 'fix this bug', 'debug',
      'programming help', 'code review', 'how do i', 'syntax error',
      'not working', 'throwing error', 'exception',
    ],
    entityTypes: ['app_name'],
    requiredTools: ['search', 'code_execute'],
    confidenceBoost: 0.9,
    contextHints: ['developer_mode'],
  },
  // ─── Code Execution ──────────────────────────────────────────
  {
    category: 'code_execution',
    keywords: ['run', 'execute', 'eval', 'test', 'try', 'console', 'print', 'output', 'result'],
    phrases: [
      'run this code', 'execute', 'what does this do', 'test this',
      'evaluate', 'compute this',
    ],
    entityTypes: [],
    requiredTools: ['code_execute'],
    confidenceBoost: 0.9,
    contextHints: ['code_block_detected'],
  },
  // ─── Database Query ──────────────────────────────────────────
  {
    category: 'database_query',
    keywords: ['show me', 'find', 'query', 'data', 'records', 'transactions', 'table', 'database', 'rows', 'select', 'where', 'order by', 'count', 'sum', 'average'],
    phrases: [
      'show my', 'find my', 'get my', 'list my', 'how many',
      'what are my', 'display my', 'search for', 'lookup',
    ],
    entityTypes: ['table_name', 'date'],
    requiredTools: ['database_query'],
    confidenceBoost: 0.85,
    contextHints: ['user_authenticated'],
  },
  // ─── Device Photos ───────────────────────────────────────────
  {
    category: 'device_photos',
    keywords: ['photo', 'picture', 'image', 'pic', 'selfie', 'screenshot', 'gallery', 'album', 'camera roll'],
    phrases: [
      'find my photo', 'show me pictures', 'my photos from',
      'images of', 'photo of', 'picture from', 'selfie from',
    ],
    entityTypes: ['date', 'location', 'person'],
    requiredTools: ['device_photos'],
    confidenceBoost: 0.85,
    contextHints: ['photos_permission'],
  },
  // ─── Device Documents ────────────────────────────────────────
  {
    category: 'device_documents',
    keywords: ['document', 'file', 'pdf', 'doc', 'text', 'note', 'memo', 'spreadsheet', 'presentation'],
    phrases: [
      'find my document', 'show me files', 'my documents',
      'file named', 'document about', 'pdf of',
    ],
    entityTypes: ['file_type', 'date'],
    requiredTools: ['device_documents'],
    confidenceBoost: 0.8,
    contextHints: ['files_permission'],
  },
  // ─── Wallet Query ────────────────────────────────────────────
  {
    category: 'wallet_query',
    keywords: ['balance', 'transaction', 'payment', 'send', 'transfer', 'withdraw', 'deposit', 'top up', 'wallet', 'money', 'funds', 'mpesa', 'credit', 'debit', 'statement', 'history'],
    phrases: [
      'my balance', 'check balance', 'send money', 'transfer funds',
      'wallet balance', 'transaction history', 'payment status',
      'how much do i have', 'my wallet',
    ],
    entityTypes: ['currency', 'number', 'date'],
    requiredTools: ['database_query'],
    confidenceBoost: 0.9,
    contextHints: ['wallet_app_open'],
  },
  // ─── Wallet Action ───────────────────────────────────────────
  {
    category: 'wallet_action',
    keywords: ['send', 'transfer', 'pay', 'withdraw', 'deposit', 'top up', 'buy', 'purchase', 'checkout'],
    phrases: [
      'send money to', 'transfer to', 'pay for', 'buy',
      'top up my', 'withdraw from', 'send',
    ],
    entityTypes: ['number', 'currency', 'phone_number'],
    requiredTools: ['database_query'],
    confidenceBoost: 0.9,
    contextHints: ['wallet_app_open'],
  },
  // ─── Health Query ────────────────────────────────────────────
  {
    category: 'health_query',
    keywords: ['health', 'doctor', 'hospital', 'appointment', 'symptom', 'medicine', 'prescription', 'lab', 'test', 'clinic', 'pharmacy', 'nurse', 'patient', 'medical', 'diagnosis'],
    phrases: [
      'book appointment', 'find doctor', 'my health records',
      'symptom checker', 'nearest hospital', 'pharmacy near me',
      'my prescriptions', 'lab results',
    ],
    entityTypes: ['location', 'date'],
    requiredTools: ['database_query', 'search'],
    confidenceBoost: 0.85,
    contextHints: ['health_app_open'],
  },
  // ─── Education Query ─────────────────────────────────────────
  {
    category: 'education_query',
    keywords: ['school', 'class', 'assignment', 'grade', 'exam', 'course', 'student', 'teacher', 'lesson', 'homework', 'study', 'learn', 'education', 'university', 'college'],
    phrases: [
      'my assignments', 'class schedule', 'exam results',
      'enroll in', 'course material', 'my grades',
      'school fees', 'student portal',
    ],
    entityTypes: ['date'],
    requiredTools: ['database_query'],
    confidenceBoost: 0.85,
    contextHints: ['education_app_open'],
  },
  // ─── Transport ───────────────────────────────────────────────
  {
    category: 'transport_query',
    keywords: ['taxi', 'ride', 'cab', 'driver', 'truck', 'logistics', 'delivery', 'shipping', 'cargo', 'freight', 'mtaxi', 'mtruck', 'boda', 'fare', 'route'],
    phrases: [
      'book a ride', 'find a taxi', 'my deliveries',
      'track shipment', 'driver status', 'fare estimate',
      'nearest driver', 'logistics quote',
    ],
    entityTypes: ['location', 'date'],
    requiredTools: ['database_query', 'search'],
    confidenceBoost: 0.85,
    contextHints: ['transport_app_open'],
  },
  // ─── Civic ───────────────────────────────────────────────────
  {
    category: 'civic_query',
    keywords: ['police', 'court', 'revenue', 'government', 'permit', 'license', 'tax', 'passport', 'id', 'registration', 'civic', 'official', 'authority'],
    phrases: [
      'report incident', 'court case', 'pay tax',
      'apply for permit', 'check status', 'government service',
      'my case', 'license renewal',
    ],
    entityTypes: ['location'],
    requiredTools: ['database_query'],
    confidenceBoost: 0.85,
    contextHints: ['civic_app_open'],
  },
  // ─── App Navigation ──────────────────────────────────────────
  {
    category: 'app_navigation',
    keywords: ['open', 'launch', 'go to', 'navigate', 'start', 'run', 'switch to', 'take me to'],
    phrases: [
      'open', 'launch', 'go to', 'take me to', 'switch to',
      'start', 'open the', 'launch',
    ],
    entityTypes: ['app_name'],
    requiredTools: [],
    confidenceBoost: 0.95,
    contextHints: [],
  },
  // ─── Onboarding ──────────────────────────────────────────────
  {
    category: 'onboarding',
    keywords: ['how do i', 'help me', 'guide', 'tutorial', 'new to', 'first time', 'getting started', 'beginner', 'explain', 'what is', 'how does', 'how to use'],
    phrases: [
      'how do i', 'help me with', 'guide me', 'tutorial for',
      'getting started', 'new to', 'first time using',
      'explain how', 'what is', 'how does this work',
    ],
    entityTypes: ['app_name'],
    requiredTools: ['knowledge_base', 'search'],
    confidenceBoost: 0.8,
    contextHints: ['new_user'],
  },
  // ─── Translation ─────────────────────────────────────────────
  {
    category: 'translation',
    keywords: ['translate', 'in english', 'in swahili', 'in french', 'meaning', 'say in', 'how do you say', 'what is', 'word for'],
    phrases: [
      'translate to', 'how do you say', 'what is in',
      'meaning of', 'say in', 'convert to',
    ],
    entityTypes: ['language'],
    requiredTools: ['translation', 'search'],
    confidenceBoost: 0.9,
    contextHints: [],
  },
  // ─── Writing Help ────────────────────────────────────────────
  {
    category: 'writing_help',
    keywords: ['write', 'draft', 'compose', 'create', 'generate', 'text', 'email', 'message', 'post', 'caption', 'essay', 'letter', 'proposal', 'report'],
    phrases: [
      'write a', 'draft a', 'compose', 'create a',
      'help me write', 'generate', 'write me',
    ],
    entityTypes: [],
    requiredTools: ['knowledge_base'],
    confidenceBoost: 0.8,
    contextHints: [],
  },
  // ─── Image Analysis ──────────────────────────────────────────
  {
    category: 'image_analysis',
    keywords: ['image', 'picture', 'photo', 'what is this', 'describe', 'analyze', 'scan', 'ocr', 'read this', 'what does this say'],
    phrases: [
      'what is in this image', 'describe this', 'analyze photo',
      'what does this say', 'read this', 'scan this',
    ],
    entityTypes: [],
    requiredTools: ['search'],
    confidenceBoost: 0.85,
    contextHints: ['image_attached'],
  },
  // ─── Calculator ──────────────────────────────────────────────
  {
    category: 'calculator',
    keywords: ['+', '-', '*', '/', '=', 'plus', 'minus', 'times', 'divided by', 'percent', '%', 'square', 'cube', 'power', 'root'],
    phrases: [
      'what is', 'calculate', 'how much', 'sum of',
    ],
    entityTypes: ['number', 'operation'],
    requiredTools: ['calculator'],
    confidenceBoost: 0.95,
    contextHints: ['math_expression'],
  },
  // ─── Time/Date ───────────────────────────────────────────────
  {
    category: 'time_date',
    keywords: ['time', 'date', 'day', 'month', 'year', 'today', 'tomorrow', 'yesterday', 'week', 'hour', 'minute', 'second', 'clock', 'calendar', 'schedule'],
    phrases: [
      'what time is it', 'what day is it', 'what date',
      'time now', 'current time', 'today\'s date',
    ],
    entityTypes: ['date', 'time', 'location'],
    requiredTools: [],
    confidenceBoost: 0.95,
    contextHints: [],
  },
  // ─── Location ────────────────────────────────────────────────
  {
    category: 'location',
    keywords: ['where', 'nearby', 'close to', 'around me', 'near me', 'directions', 'map', 'gps', 'address', 'place', 'restaurant near', 'hospital near'],
    phrases: [
      'where is', 'nearby', 'close to me', 'around here',
      'directions to', 'how do i get to', 'find near me',
    ],
    entityTypes: ['location'],
    requiredTools: ['search'],
    confidenceBoost: 0.85,
    contextHints: ['location_known'],
  },
  // ─── Definition ──────────────────────────────────────────────
  {
    category: 'definition',
    keywords: ['what is', 'define', 'meaning', 'means', 'definition', 'explain', 'describe', 'tell me about'],
    phrases: [
      'what is', 'define', 'meaning of', 'what does mean',
      'explain', 'tell me about', 'what are',
    ],
    entityTypes: [],
    requiredTools: ['search', 'knowledge_base'],
    confidenceBoost: 0.8,
    contextHints: [],
  },
  // ─── How To ──────────────────────────────────────────────────
  {
    category: 'how_to',
    keywords: ['how to', 'how do i', 'steps to', 'guide to', 'tutorial', 'instructions', 'process', 'procedure', 'way to'],
    phrases: [
      'how to', 'how do i', 'steps to', 'guide for',
      'instructions for', 'process of', 'how can i',
    ],
    entityTypes: [],
    requiredTools: ['search', 'knowledge_base'],
    confidenceBoost: 0.8,
    contextHints: [],
  },
  // ─── Comparison ──────────────────────────────────────────────
  {
    category: 'comparison',
    keywords: ['vs', 'versus', 'compare', 'difference', 'better', 'worse', 'or', 'which', 'best', 'worst', 'similar', 'different'],
    phrases: [
      'vs', 'versus', 'compare', 'difference between',
      'which is better', 'or', 'which should i',
    ],
    entityTypes: [],
    requiredTools: ['search'],
    confidenceBoost: 0.8,
    contextHints: [],
  },
  // ─── Summarization ───────────────────────────────────────────
  {
    category: 'summarization',
    keywords: ['summarize', 'summary', 'tl;dr', 'brief', 'shorten', 'condense', 'main points', 'key points', 'overview'],
    phrases: [
      'summarize', 'give me a summary', 'tl;dr',
      'main points', 'key takeaways', 'brief overview',
    ],
    entityTypes: [],
    requiredTools: ['search', 'knowledge_base'],
    confidenceBoost: 0.8,
    contextHints: ['long_text_provided'],
  },
  // ─── Greeting ────────────────────────────────────────────────
  {
    category: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'good night', 'greetings', 'welcome', 'howdy', 'sup', 'yo'],
    phrases: [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon',
      'good evening', 'how are you', 'what\'s up',
    ],
    entityTypes: [],
    requiredTools: [],
    confidenceBoost: 0.95,
    contextHints: [],
  },
  // ─── Farewell ────────────────────────────────────────────────
  {
    category: 'farewell',
    keywords: ['bye', 'goodbye', 'see you', 'later', 'ciao', 'take care', 'farewell', 'night', 'sleep'],
    phrases: [
      'bye', 'goodbye', 'see you', 'take care',
      'good night', 'talk later', 'ciao',
    ],
    entityTypes: [],
    requiredTools: [],
    confidenceBoost: 0.95,
    contextHints: [],
  },
  // ─── Gratitude ───────────────────────────────────────────────
  {
    category: 'gratitude',
    keywords: ['thank', 'thanks', 'appreciate', 'grateful', 'helpful', 'awesome', 'great', 'amazing', 'perfect', 'excellent'],
    phrases: [
      'thank you', 'thanks', 'appreciate it', 'grateful',
      'that helps', 'awesome', 'great help',
    ],
    entityTypes: [],
    requiredTools: [],
    confidenceBoost: 0.9,
    contextHints: [],
  },
  // ─── Small Talk ──────────────────────────────────────────────
  {
    category: 'small_talk',
    keywords: ['how are you', 'what\'s up', 'how\'s it going', 'nice', 'cool', 'okay', 'ok', 'sure', 'maybe', 'probably', 'i think', 'i guess'],
    phrases: [
      'how are you', 'what\'s up', 'how\'s it going',
      'what do you think', 'tell me something',
    ],
    entityTypes: [],
    requiredTools: [],
    confidenceBoost: 0.7,
    contextHints: [],
  },
  // ─── System Command ──────────────────────────────────────────
  {
    category: 'system_command',
    keywords: ['restart', 'reboot', 'shutdown', 'update', 'settings', 'configure', 'reset', 'clear', 'delete', 'backup', 'restore', 'sync'],
    phrases: [
      'restart', 'reboot', 'shutdown', 'update system',
      'clear cache', 'reset', 'backup', 'restore',
    ],
    entityTypes: [],
    requiredTools: ['shell_command'],
    confidenceBoost: 0.85,
    contextHints: ['admin_user'],
  },
];

// ─── Entity Extractors ──────────────────────────────────────────

interface EntityExtractor {
  type: EntityType;
  patterns: RegExp[];
  extract: (match: RegExpMatchArray, text: string) => Entity | null;
}

const ENTITY_EXTRACTORS: EntityExtractor[] = [
  {
    type: 'location',
    patterns: [
      /in\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/g,
      /near\s+([A-Z][a-zA-Z\s]+)/g,
      /at\s+([A-Z][a-zA-Z\s]+)/g,
      /from\s+([A-Z][a-zA-Z\s]+)/g,
      /to\s+([A-Z][a-zA-Z\s]+)/g,
      /(?:Nairobi|Mombasa|Kisumu|Nakuru|Eldoret|Kampala|Dar\s+es\s+Salaam|Lagos|Accra|Cairo|Johannesburg|Cape\s+Town|Addis\s+Ababa|Kigali|Khartoum|Kinshasa|Lusaka|Harare|Maputo|Dakar|Abidjan)/gi,
    ],
    extract: (match, text) => ({
      type: 'location',
      value: match[1] || match[0],
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.85,
    }),
  },
  {
    type: 'date',
    patterns: [
      /\b(today|tomorrow|yesterday|now|next\s+week|last\s+week|next\s+month|last\s+month)\b/gi,
      /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/g,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?\b/gi,
    ],
    extract: (match, text) => ({
      type: 'date',
      value: match[0],
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.9,
    }),
  },
  {
    type: 'number',
    patterns: [
      /\b\d+(?:,\d{3})*(?:\.\d+)?\b/g,
      /\b\d+\s*(?:KES|USD|EUR|GBP|KSH|ksh|sh)\b/gi,
    ],
    extract: (match, text) => ({
      type: 'number',
      value: match[0].replace(/,/g, ''),
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.95,
    }),
  },
  {
    type: 'app_name',
    patterns: [
      /\b(wallet|health|education|streets|tribes|mtaxi|mtruck|shop|marketplace|jobs|studio|civic|profile|settings|phone|gallery|messages|calculator|calendar|clock|binance|credit|restaurant|property)\b/gi,
    ],
    extract: (match, text) => ({
      type: 'app_name',
      value: match[0].toLowerCase(),
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.9,
    }),
  },
  {
    type: 'table_name',
    patterns: [
      /\b(wallet_transactions|user_profiles|profiles|health_patients|mtaxi_rides|mtruck_trucks|shop_items|streets_posts|education_courses|jobs_listings|civic_cases)\b/gi,
    ],
    extract: (match, text) => ({
      type: 'table_name',
      value: match[0].toLowerCase(),
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.9,
    }),
  },
  {
    type: 'currency',
    patterns: [
      /\b(KES|USD|EUR|GBP|KSH|ksh|sh|shillings?)\b/gi,
      /\b\d+(?:,\d{3})*\s*(?:KES|USD|EUR|GBP|KSH|sh)\b/gi,
    ],
    extract: (match, text) => ({
      type: 'currency',
      value: match[0],
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.9,
    }),
  },
  {
    type: 'phone_number',
    patterns: [
      /\b(?:\+?254|0)\d{9}\b/g,
      /\b(?:\+?256|0)\d{9}\b/g,
      /\b(?:\+?255|0)\d{9}\b/g,
      /\b\+?1\d{10}\b/g,
    ],
    extract: (match, text) => ({
      type: 'phone_number',
      value: match[0],
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.95,
    }),
  },
  {
    type: 'email',
    patterns: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    ],
    extract: (match, text) => ({
      type: 'email',
      value: match[0],
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.95,
    }),
  },
  {
    type: 'language',
    patterns: [
      /\b(English|Swahili|French|Arabic|Spanish|Chinese|German|Portuguese|Italian|Japanese|Korean|Russian|Hindi)\b/gi,
      /\bin\s+(?:English|Swahili|French|Arabic|Spanish|Chinese)\b/gi,
    ],
    extract: (match, text) => ({
      type: 'language',
      value: match[1] || match[0],
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.9,
    }),
  },
  {
    type: 'file_type',
    patterns: [
      /\b(pdf|doc|docx|txt|csv|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|mp4|mp3|wav)\b/gi,
    ],
    extract: (match, text) => ({
      type: 'file_type',
      value: match[0].toLowerCase(),
      position: [match.index || 0, (match.index || 0) + match[0].length],
      confidence: 0.9,
    }),
  },
];

// ─── Math Expression Detection ──────────────────────────────────

const MATH_EXPRESSION_PATTERN = /^(?:\d+\s*[+\-*/^%]\s*)+\d+(?:\s*(?:=|equals|is))?$/;
const MATH_KEYWORD_PATTERN = /(?:calculate|compute|what\s+is|how\s+much\s+is|find|solve)\s+(.+)/i;

// ─── Intent Router Class ────────────────────────────────────────

export class IntentRouter {
  private context: ContextVector;
  private kamosState: KamosState;
  private history: IntentResult[];

  constructor(context: ContextVector, kamosState: KamosState) {
    this.context = context;
    this.kamosState = kamosState;
    this.history = [];
  }

  /**
   * Classify user query into intent category
   * Returns intent with confidence score and required tools
   */
  classify(query: string): IntentResult {
    const normalizedQuery = query.toLowerCase().trim();
    const entities = this.extractEntities(query);

    // Check for math expression first (fast path)
    if (this.isMathExpression(normalizedQuery)) {
      return this.buildIntentResult('math', 0.95, entities, ['code_execute', 'calculator']);
    }

    // Score each intent pattern
    const scores = new Map<IntentCategory, number>();

    for (const pattern of INTENT_PATTERNS) {
      let score = 0;

      // Keyword matching
      const keywordMatches = pattern.keywords.filter((kw: any) =>
        normalizedQuery.includes(kw.toLowerCase())
      ).length;
      score += keywordMatches * 0.15;

      // Phrase matching
      const phraseMatches = pattern.phrases.filter((phrase: any) => {
        const regex = new RegExp(phrase.replace(/\\b/g, '\b'), 'i');
        return regex.test(normalizedQuery);
      }).length;
      score += phraseMatches * 0.25;

      // Entity matching
      const entityMatches = entities.filter((e: any) =>
        pattern.entityTypes.includes(e.type)
      ).length;
      score += entityMatches * 0.2;

      // Context hints
      const contextMatches = pattern.contextHints.filter((hint: any) =>
        this.checkContextHint(hint)
      ).length;
      score += contextMatches * 0.1;

      // Confidence boost for strong matches
      if (score > 0.5) {
        score += pattern.confidenceBoost * 0.1;
      }

      // Kamos Theory: historical pattern matching
      const historicalMatch = this.kamosState.userKnowledgeGraph.interactionHistory
        .filter((h: any) => h.intent === pattern.category)
        .length;
      if (historicalMatch > 0) {
        score += Math.min(historicalMatch * 0.02, 0.1);
      }

      // Collective pattern matching
      const collectiveMatch = this.kamosState.collectivePatterns
        .filter((p: any) => p.intent === pattern.category)
        .some((p: any) => {
          try {
            const regex = new RegExp(p.queryPattern, 'i');
            return regex.test(normalizedQuery);
          } catch {
            return false;
          }
        });
      if (collectiveMatch) {
        score += 0.05;
      }

      scores.set(pattern.category, Math.min(score, 1.0));
    }

    // Find highest scoring intent
    let bestCategory: IntentCategory = 'unknown';
    let bestScore = 0;

    for (const [category, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // If no strong match, check for general knowledge
    if (bestScore < 0.3) {
      if (normalizedQuery.includes('what is') || normalizedQuery.includes('who is') ||
          normalizedQuery.includes('where is') || normalizedQuery.includes('when did')) {
        bestCategory = 'general_knowledge';
        bestScore = 0.6;
      } else if (normalizedQuery.includes('how to') || normalizedQuery.includes('how do')) {
        bestCategory = 'how_to';
        bestScore = 0.6;
      }
    }

    const bestPattern = INTENT_PATTERNS.find((p: any) => p.category === bestCategory);
    const requiredTools = bestPattern?.requiredTools || ['search'];

    // Build suggested actions based on intent
    const suggestedActions = this.buildSuggestedActions(bestCategory, entities);

    const result: IntentResult = {
      category: bestCategory,
      confidence: bestScore,
      entities,
      urgency: this.calculateUrgency(normalizedQuery, bestCategory),
      requiresTools: requiredTools,
      suggestedActions,
    };

    this.history.push(result);
    return result;
  }

  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];

    for (const extractor of ENTITY_EXTRACTORS) {
      for (const pattern of extractor.patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const entity = extractor.extract(match, text);
          if (entity) {
            entities.push(entity);
          }
        }
        // Reset regex lastIndex for next use
        pattern.lastIndex = 0;
      }
    }

    // Deduplicate by position
    const seen = new Set<string>();
    return entities.filter((e: any) => {
      const key = `${e.type}:${e.position[0]}-${e.position[1]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isMathExpression(query: string): boolean {
    return MATH_EXPRESSION_PATTERN.test(query) ||
           (MATH_KEYWORD_PATTERN.test(query) && /\d/.test(query));
  }

  private checkContextHint(hint: string): boolean {
    switch (hint) {
      case 'location_known':
        return !!this.context.location;
      case 'user_authenticated':
        return true; // Assume authenticated in MTAA
      case 'wallet_app_open':
        return this.context.activeApp === 'wallet';
      case 'health_app_open':
        return this.context.activeApp === 'health';
      case 'education_app_open':
        return this.context.activeApp === 'education';
      case 'transport_app_open':
        return ['mtaxi', 'mtruck', 'boda'].includes(this.context.activeApp || '');
      case 'civic_app_open':
        return this.context.activeApp === 'civic';
      case 'developer_mode':
        return this.context.recentApps.includes('developer');
      case 'new_user':
        return this.kamosState.userKnowledgeGraph.interactionHistory.length < 5;
      case 'photos_permission':
        return true; // Assume granted
      case 'files_permission':
        return true; // Assume granted
      case 'numbers_in_query':
        return /\d/.test(this.context.recentQueries[0] || '');
      case 'code_block_detected':
        return /```|function\s+\w+|class\s+\w+/.test(this.context.recentQueries[0] || '');
      case 'image_attached':
        return false; // Would be set by input parser
      case 'long_text_provided':
        return (this.context.recentQueries[0] || '').length > 200;
      case 'admin_user':
        return false; // Would check user role
      case 'math_expression':
        return this.isMathExpression(this.context.recentQueries[0] || '');
      default:
        return false;
    }
  }

  private calculateUrgency(query: string, category: IntentCategory): number {
    let urgency = 0.3; // Base urgency

    // Time-sensitive keywords
    const urgentWords = ['urgent', 'emergency', 'now', 'immediately', 'asap', 'quick', 'hurry'];
    if (urgentWords.some((w: any) => query.includes(w))) urgency += 0.4;

    // Health emergencies
    if (category === 'health_query' && /emergency|hurt|pain|bleeding|unconscious|breathing/.test(query)) {
      urgency += 0.5;
    }

    // Transport urgency
    if (category === 'transport_query' && /late|miss|flight|train|bus leaving/.test(query)) {
      urgency += 0.3;
    }

    // Wallet urgency
    if (category === 'wallet_action' && /stolen|fraud|unauthorized|hack/.test(query)) {
      urgency += 0.5;
    }

    return Math.min(urgency, 1.0);
  }

  private buildSuggestedActions(category: IntentCategory, entities: Entity[]): string[] {
    const actions: string[] = [];

    switch (category) {
      case 'weather':
        actions.push('Get forecast for tomorrow');
        actions.push('Check weather in another city');
        break;
      case 'news':
        actions.push('Get news about a specific topic');
        actions.push('Show local news');
        break;
      case 'wallet_query':
        actions.push('View transaction details');
        actions.push('Send money');
        break;
      case 'health_query':
        actions.push('Book an appointment');
        actions.push('Find nearest hospital');
        break;
      case 'transport_query':
        actions.push('Book a ride now');
        actions.push('Check fare estimate');
        break;
      case 'onboarding':
        actions.push('Show me a tutorial');
        actions.push('What can you do?');
        break;
      case 'app_navigation': {
        const app = entities.find((e: any) => e.type === 'app_name');
        if (app) actions.push(`Open ${app.value}`);
        break;
      }
      case 'general_knowledge':
        actions.push('Tell me more');
        actions.push('Related topics');
        break;
    }

    return actions;
  }

  private buildIntentResult(
    category: IntentCategory,
    confidence: number,
    entities: Entity[],
    tools: ToolType[]
  ): IntentResult {
    return {
      category,
      confidence,
      entities,
      urgency: this.calculateUrgency('', category),
      requiresTools: tools,
      suggestedActions: this.buildSuggestedActions(category, entities),
    };
  }

  /**
   * Get recent intent history for context
   */
  getHistory(): IntentResult[] {
    return [...this.history];
  }

  /**
   * Update context vector
   */
  updateContext(context: ContextVector): void {
    this.context = context;
  }
}

// ─── Factory Function ───────────────────────────────────────────

export function createIntentRouter(context: ContextVector, kamosState: KamosState): IntentRouter {
  return new IntentRouter(context, kamosState);
}

// ─── Quick Classify (static) ────────────────────────────────────

export function quickClassify(query: string): IntentCategory {
  const router = new IntentRouter(
    {
      timeOfDay: 'morning',
      dayOfWeek: 'Monday',
      recentApps: [],
      recentQueries: [query],
      deviceState: { batteryLevel: 0.5, isCharging: false, storageUsed: 0, storageTotal: 1, osVersion: '1.0', appVersion: '1.0' },
      networkState: { type: 'WIFI', isConnected: true, isInternetReachable: true },
    },
    {
      userKnowledgeGraph: { userId: 'anonymous', facts: [], preferences: [], interactionHistory: [], lastUpdated: Date.now() },
      collectivePatterns: [],
      contextVector: { timeOfDay: 'morning', dayOfWeek: 'Monday', recentApps: [], recentQueries: [], deviceState: { batteryLevel: 0.5, isCharging: false, storageUsed: 0, storageTotal: 1, osVersion: '1.0', appVersion: '1.0' }, networkState: { type: 'WIFI', isConnected: true, isInternetReachable: true } },
      newObservation: { query, parsedIntent: { category: 'unknown', confidence: 0, entities: [], urgency: 0, requiresTools: [], suggestedActions: [] }, toolResults: [], timestamp: Date.now() },
    }
  );
  return router.classify(query).category;
}