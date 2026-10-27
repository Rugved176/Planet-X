import fs from 'fs';
import path from 'path';

export interface UserProfile {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  college: string;
  role: 'participant' | 'admin';
  emailVerified: boolean;
  createdAt: string;
}

export interface TeamMember {
  name: string;
  email: string;
  phone: string;
  college?: string;
  role?: string;
}

export interface Registration {
  id: string; // e.g. PX26-WEB-8291
  userId: string;
  eventId: string;
  zoneId: string;
  eventName: string;
  teamName: string;
  teamLeaderName: string;
  teamLeaderEmail: string;
  teamLeaderPhone: string;
  college: string;
  teamMembers: TeamMember[];
  additionalInfo?: Record<string, string>;
  registrationFee: number;
  paymentStatus: 'unpaid' | 'pending_verification' | 'verified' | 'rejected';
  registrationStatus: 'draft' | 'submitted' | 'under_verification' | 'confirmed' | 'rejected' | 'cancelled';
  paymentReference?: string;
  paymentProofUrl?: string; // base64 or stored URL
  paymentProofFileName?: string;
  paymentProofUploadedAt?: string;
  rejectionReason?: string;
  submittedAt: string;
  verifiedAt?: string;
}

export interface CompetitionEvent {
  id: string;
  slug: string;
  zoneId: string;
  zoneName: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  objectives: string[];
  eligibility: string;
  rules: string[];
  judgingCriteria: string[];
  allowedTech?: string[];
  minTeamSize: number;
  maxTeamSize: number;
  registrationFee: number;
  registrationDeadline: string;
  isOpen: boolean;
  whatsappGroupLink: string;
  whatsappVisibility: 'after_submission' | 'after_confirmation';
  customFields?: { id: string; label: string; placeholder: string; required: boolean }[];
}

export interface CompetitionZone {
  id: string;
  name: string;
  code: string;
  tagline: string;
  description: string;
  eventIds: string[];
}

export interface OrganizingTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  socialLink: string;
  phone?: string;
  displayOrder: number;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: 'submission_received' | 'organizer_alert' | 'payment_verified' | 'payment_rejected' | 'registration_confirmed' | 'contact_received' | 'password_reset';
  sentAt: string;
  status: 'delivered' | 'accepted' | 'failed';
  previewText: string;
  htmlBody: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: string;
  status: 'unread' | 'replied';
}

export interface GlobalSettings {
  eventName: string;
  institution: string;
  eventDate: string; // '2026-11-21'
  isProvisionalDate: boolean;
  venue: string;
  prizePool: string;
  tagline: string;
  supportingTagline: string;
  organizerNotificationEmail: string;
  upiId: string;
  paymentQrCodeUrl: string;
  paymentInstructions: string;
  contactEmail: string;
  contactPhone: string;
}

export interface DatabaseSchema {
  settings: GlobalSettings;
  users: UserProfile[];
  zones: CompetitionZone[];
  events: CompetitionEvent[];
  registrations: Registration[];
  teamMembers: OrganizingTeamMember[];
  emailLogs: EmailLog[];
  auditLogs: AuditLog[];
  contactMessages: ContactMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'planetx_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const INITIAL_SETTINGS: GlobalSettings = {
  eventName: 'PLANET-X 2026',
  institution: "SVKM's NMIMS Global University, Dhule",
  eventDate: '2026-11-21',
  isProvisionalDate: true,
  venue: "SVKM's NMIMS Global University Campus, Dhule, Maharashtra",
  prizePool: '₹50,000',
  tagline: 'BEYOND INNOVATION. BEYOND LIMITS.',
  supportingTagline: 'THINK. CODE. CREATE. COMPETE.',
  organizerNotificationEmail: 'planetx.event@gmail.com',
  upiId: '9975952579@fam',
  paymentQrCodeUrl: '/assets/aistudio/image_6399a176.png',
  paymentInstructions: 'Scan the official event QR code for Rugved Solanki (9975952579@fam) using any UPI app (GPay / PhonePe / Paytm / BHIM) or transfer to the UPI ID. Upload the payment receipt/screenshot containing the UTR / Transaction ID below.',
  contactEmail: 'planetx.event@gmail.com',
  contactPhone: '+91 9975952579'
};

export const INITIAL_ZONES: CompetitionZone[] = [
  {
    id: 'zone-a',
    code: 'ZONE A',
    name: 'CODE-ZONE',
    tagline: 'Architect the Future with Pure Engineering & Code',
    description: 'Push your coding boundaries across modern web engineering, cutting-edge Gemini AI app creation, and rigorous codebase debugging.',
    eventIds: ['webathon', 'vibeathon', 'bugverse']
  },
  {
    id: 'zone-b',
    code: 'ZONE B',
    name: 'FUN-ZONE',
    tagline: 'Where Wit, Tactical Mindset & Reflexes Collide',
    description: 'High-octane excitement spanning the frontiers of AI trends, sharp rhetorical debate, and intense competitive multiplayer gaming.',
    eventIds: ['ai-quiz', 'debate-competition', 'gaming-competition']
  },
  {
    id: 'zone-c',
    code: 'ZONE C',
    name: 'FIN-TECH',
    tagline: 'Disrupt Financial Ecosystems & Pitch the Next Unicorn',
    description: 'Unleash visionary startup concepts, pitch to industry leaders, and master market valuation and quantitative financial problem-solving.',
    eventIds: ['startup-pitching', 'fin-quiz-analysis']
  }
];

export const INITIAL_EVENTS: CompetitionEvent[] = [
  {
    id: 'webathon',
    slug: 'webathon',
    zoneId: 'zone-a',
    zoneName: 'CODE-ZONE',
    name: 'WEBATHON',
    shortDescription: 'Build next-generation web platforms solving real-world challenges.',
    fullDescription: 'Participants design, build, and deploy high-performance web applications under time pressure. Projects are judged on functionality, visual aesthetic, UX responsiveness, clean architecture, and technical innovation.',
    objectives: [
      'Architect a full-stack or frontend web application within the competition timeframe',
      'Demonstrate responsive UI design and robust state management',
      'Deploy the working application to a live staging environment'
    ],
    eligibility: 'Open to all undergraduate and postgraduate college students with valid student IDs.',
    rules: [
      'Teams must build their projects during the designated event period.',
      'Open-source libraries and frameworks (React, Vue, Svelte, Tailwind, etc.) are allowed.',
      'Plagiarism or using pre-built full applications results in immediate disqualification.',
      'Final submission must include a live URL and code repository link.'
    ],
    judgingCriteria: [
      'Technical Architecture & Code Quality (30%)',
      'Visual Design & User Experience (25%)',
      'Innovation & Originality (25%)',
      'Presentation & Live Demo (20%)'
    ],
    allowedTech: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Tailwind CSS', 'Node.js'],
    minTeamSize: 1,
    maxTeamSize: 4,
    registrationFee: 200,
    registrationDeadline: '2026-11-15T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_submission',
    customFields: [
      { id: 'preferredStack', label: 'Primary Tech Stack / Framework', placeholder: 'e.g. React, Next.js, Node.js', required: true },
      { id: 'repoUrl', label: 'GitHub Profile or Org URL', placeholder: 'https://github.com/...', required: false }
    ]
  },
  {
    id: 'vibeathon',
    slug: 'vibeathon',
    zoneId: 'zone-a',
    zoneName: 'CODE-ZONE',
    name: 'VIBEATHON',
    shortDescription: 'Participants build an application powered by Google Gemini AI.',
    fullDescription: 'Vibeathon challenges builders to push the envelope of multimodal generative AI. Build intelligent agents, reasoning engines, creative spatial tools, or conversational workflows powered by Google Gemini.',
    objectives: [
      'Implement real integration with the Google Gemini API',
      'Leverage multimodal capabilities (text, vision, audio, reasoning)',
      'Deliver an intuitive user workflow solving a tangible domain problem'
    ],
    eligibility: 'College students passionate about artificial intelligence, prompt engineering, and app development.',
    rules: [
      'Applications must utilize the Google Gemini API for core AI functionalities.',
      'Solutions must handle prompt edge cases and demonstrate sensible guardrails.',
      'Demonstrations must run live during the final judging round.'
    ],
    judgingCriteria: [
      'Gemini API Integration & Prompt Depth (35%)',
      'Utility & Practical Impact (25%)',
      'Interface Flow & Polish (20%)',
      'Live Execution & Robustness (20%)'
    ],
    allowedTech: ['Google Gemini API', 'Python', 'Node.js', 'React', 'FastAPI', 'Flutter'],
    minTeamSize: 1,
    maxTeamSize: 4,
    registrationFee: 250,
    registrationDeadline: '2026-11-15T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_confirmation',
    customFields: [
      { id: 'projectIdea', label: 'Brief Gemini Project Concept', placeholder: 'Describe what your Gemini application will accomplish', required: true }
    ]
  },
  {
    id: 'bugverse',
    slug: 'bugverse',
    zoneId: 'zone-a',
    zoneName: 'CODE-ZONE',
    name: 'BUGVERSE',
    shortDescription: 'Identify, debug, and fix complex errors across modern codebases.',
    fullDescription: 'A multi-round speed and precision debugging arena. Participants navigate obfuscated repositories, patch memory leaks, solve concurrency deadlocks, and resolve security vulnerabilities.',
    objectives: [
      'Quickly diagnose faulty logic and architectural bottlenecks',
      'Refactor broken modules without breaking existing unit tests',
      'Optimize runtime performance and algorithmic efficiency'
    ],
    eligibility: 'All registered students with proficiency in C++, Python, Java, or JavaScript.',
    rules: [
      'Participants receive sandboxed repositories with failing test suites.',
      'Points are awarded based on speed of resolution and test pass rate.',
      'Automated plagiarism detection is enforced.'
    ],
    judgingCriteria: [
      'Test Pass Percentage (50%)',
      'Time to Solution Submission (30%)',
      'Code Cleanliness & Elegance (20%)'
    ],
    allowedTech: ['C++', 'Python', 'Java', 'JavaScript/TypeScript'],
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationFee: 150,
    registrationDeadline: '2026-11-16T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_submission',
    customFields: [
      { id: 'preferredLang', label: 'Preferred Debugging Language', placeholder: 'e.g. Python, C++, Java', required: true }
    ]
  },
  {
    id: 'ai-quiz',
    slug: 'ai-quiz',
    zoneId: 'zone-b',
    zoneName: 'FUN-ZONE',
    name: 'AI QUIZ',
    shortDescription: 'Fast-paced quiz on the latest AI trends, architectures, and history.',
    fullDescription: 'Test your grasp of foundational machine learning, LLM evolution, Transformer mechanics, autonomous systems, and modern AI industry breakthroughs in a buzzer-style quiz format.',
    objectives: [
      'Demonstrate broad and deep knowledge of modern AI/ML trends',
      'Compete under high-speed round-based time limits',
      'Navigate rapid-fire trivia and technical reasoning questions'
    ],
    eligibility: 'Open to all students with an appetite for AI breakthroughs.',
    rules: [
      'Multiple rounds: Preliminary written screening followed by buzzer-based stage finals.',
      'Electronic devices are strictly prohibited during the quiz rounds.',
      'Quizmaster decisions are final and binding.'
    ],
    judgingCriteria: [
      'Accuracy of Responses',
      'Speed on Buzzer Rounds',
      'Bonus Round Strategic Scoring'
    ],
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationFee: 100,
    registrationDeadline: '2026-11-17T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_submission'
  },
  {
    id: 'debate-competition',
    slug: 'debate-competition',
    zoneId: 'zone-b',
    zoneName: 'FUN-ZONE',
    name: 'DEBATE COMPETITION',
    shortDescription: 'Present, defend, and critique arguments on contemporary tech topics.',
    fullDescription: 'A premier intellectual debate tournament. Teams spar over artificial intelligence ethics, technological monopolies, quantum computing frontiers, and digital privacy policies.',
    objectives: [
      'Articulate rigorous logical arguments on contested technology topics',
      'Rebut opposition arguments with factual precision and poise',
      'Engage judges with compelling rhetoric and persuasive delivery'
    ],
    eligibility: 'Open to all collegiate debaters and tech enthusiasts.',
    rules: [
      'Parliamentary or Oxford-style debate format depending on the round.',
      'Topic assigned 30 minutes prior to match; both affirmative and negative sides must be prepared.',
      'Strict adherence to speaker time limits.'
    ],
    judgingCriteria: [
      'Logical Substance & Evidence (35%)',
      'Rebuttal & Cross-Examination (30%)',
      'Diction, Poise & Rhetorical Delivery (20%)',
      'Time Management & Structure (15%)'
    ],
    minTeamSize: 2,
    maxTeamSize: 2,
    registrationFee: 150,
    registrationDeadline: '2026-11-16T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_submission'
  },
  {
    id: 'gaming-competition',
    slug: 'gaming-competition',
    zoneId: 'zone-b',
    zoneName: 'FUN-ZONE',
    name: 'GAMING COMPETITION',
    shortDescription: 'Competitive esports showdown across high-octane multiplayer titles.',
    fullDescription: 'Assemble your squad for the ultimate esports arena. Compete in intense bracket-style elimination matches showcasing tactical coordination, lightning reflexes, and strategic synergy.',
    objectives: [
      'Compete in sanctioned esports tournament brackets',
      'Demonstrate squad communication and clutch mechanical gameplay',
      'Climb double-elimination brackets to championship victory'
    ],
    eligibility: 'All college gaming squads with active player handles.',
    rules: [
      'Standard competitive tournament rules and fair-play anti-cheat enforcement.',
      'Participants must bring their own peripherals if specified.',
      'Unsportsmanlike conduct leads to instant forfeit.'
    ],
    judgingCriteria: [
      'Tournament Bracket Progression',
      'Round Differential & Match Wins'
    ],
    minTeamSize: 1,
    maxTeamSize: 4,
    registrationFee: 200,
    registrationDeadline: '2026-11-17T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_confirmation',
    customFields: [
      { id: 'inGameHandles', label: 'Player Gamer Tags / Handles', placeholder: 'e.g. Leader#1234, Member#5678', required: true }
    ]
  },
  {
    id: 'startup-pitching',
    slug: 'startup-pitching',
    zoneId: 'zone-c',
    zoneName: 'FIN-TECH',
    name: 'STARTUP IDEA PITCHING',
    shortDescription: 'Pitch groundbreaking business solutions to founders and investors.',
    fullDescription: 'The flagship entrepreneurship event of PLANET-X 2026. Pitch your disruptive product, market strategy, unit economics, and growth roadmap to an esteemed panel of venture capitalists and startup leaders.',
    objectives: [
      'Synthesize an innovative startup concept solving a verified market gap',
      'Present a crisp 5-minute pitch deck followed by a 3-minute jury Q&A',
      'Defend market viability, competitive moat, and revenue model'
    ],
    eligibility: 'Student innovators, aspiring founders, and entrepreneurial teams.',
    rules: [
      'Pitch deck must be submitted 24 hours prior to the live pitching session.',
      'Strict 5-minute pitch timer followed by 3-minute jury defense.',
      'Prototypes or MVPs earn bonus evaluation credit.'
    ],
    judgingCriteria: [
      'Problem Significance & Market Opportunity (30%)',
      'Business Model & Financial Viability (25%)',
      'Product Innovation & Moat (25%)',
      'Pitch Clarity & Team Capability (20%)'
    ],
    minTeamSize: 1,
    maxTeamSize: 4,
    registrationFee: 300,
    registrationDeadline: '2026-11-15T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_submission',
    customFields: [
      { id: 'startupName', label: 'Startup or Project Name', placeholder: 'e.g. NovaPay', required: true },
      { id: 'deckLink', label: 'Pitch Deck Link (Drive / Docsend)', placeholder: 'https://...', required: false }
    ]
  },
  {
    id: 'fin-quiz-analysis',
    slug: 'fin-quiz-analysis',
    zoneId: 'zone-c',
    zoneName: 'FIN-TECH',
    name: 'FINANCIAL QUIZ & ANALYSIS',
    shortDescription: 'Master quantitative financial models, valuation, and capital markets.',
    fullDescription: 'A two-stage finance showdown combining a fast-paced capital markets quiz with an analytical case study. Evaluate balance sheets, calculate DCF valuations, and recommend actionable investment strategies.',
    objectives: [
      'Exhibit acumen in macroeconomics, equity markets, and corporate finance',
      'Analyze financial statements and identify key valuation drivers',
      'Deliver an investment thesis backed by financial modeling'
    ],
    eligibility: 'Students interested in finance, commerce, economics, and analytics.',
    rules: [
      'Round 1: Rapid-fire screening quiz on financial markets and instruments.',
      'Round 2: Comprehensive financial case analysis with spreadsheet submission.',
      'Standard financial calculator allowed.'
    ],
    judgingCriteria: [
      'Quiz Score & Speed (40%)',
      'Analytical Depth & Valuation Rigor (40%)',
      'Recommendation Coherence (20%)'
    ],
    minTeamSize: 1,
    maxTeamSize: 3,
    registrationFee: 150,
    registrationDeadline: '2026-11-16T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_submission'
  }
];

export const INITIAL_TEAM_MEMBERS: OrganizingTeamMember[] = [
  {
    id: 'team-rugved',
    name: 'Rugved Solanki',
    role: 'Lead Organizer & Technical Director',
    bio: 'Oversees overall event operations, competition architecture, and system reliability for PLANET-X 2026.',
    photoUrl: '',
    socialLink: 'https://linkedin.com',
    phone: '+91 9975952579',
    displayOrder: 1
  },
  {
    id: 'team-ved',
    name: 'Ved Shinde',
    role: 'Lead Coordinator & Platform Engineering',
    bio: 'Spearheading participant portals, digital platform architecture, and competition infrastructure.',
    photoUrl: '',
    socialLink: 'https://linkedin.com',
    phone: '+91 8262058180',
    displayOrder: 2
  },
  {
    id: 'team-dakshal',
    name: 'Dakshal Ahire',
    role: 'Operations & Event Logistics Lead',
    bio: 'Coordinates on-ground scheduling, venue arrangements, and competition zone execution at NMIMS Dhule.',
    photoUrl: '',
    socialLink: 'https://linkedin.com',
    phone: '+91 8412820178',
    displayOrder: 3
  },
  {
    id: 'team-yash',
    name: 'Yash Khairnar',
    role: 'Sponsorships, Finance & Brand Experience',
    bio: 'Manages prize pool allocation, partnership engagements, and the futuristic visual brand identity.',
    photoUrl: '',
    socialLink: 'https://linkedin.com',
    phone: '+91 8080156469',
    displayOrder: 4
  },
  {
    id: 'team-harsh',
    name: 'Harsh',
    role: 'Public Relations & Participant Outreach',
    bio: 'Drives inter-college delegations, community communications, and participant support desks.',
    photoUrl: '',
    socialLink: 'https://linkedin.com',
    displayOrder: 5
  },
  {
    id: 'team-herambh',
    name: 'Herambh',
    role: 'Competitions & Judging Coordinator',
    bio: 'Facilitates problem statements, rubric standardization, and technical jury management.',
    photoUrl: '',
    socialLink: 'https://linkedin.com',
    displayOrder: 6
  }
];

// Helper class for atomic DB operations
class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error reading DB file, reinitializing with defaults:', err);
    }

    const initialDb: DatabaseSchema = {
      settings: INITIAL_SETTINGS,
      users: [],
      zones: INITIAL_ZONES,
      events: INITIAL_EVENTS,
      registrations: [],
      teamMembers: INITIAL_TEAM_MEMBERS,
      emailLogs: [],
      auditLogs: [],
      contactMessages: []
    };

    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to DB file:', err);
    }
  }

  public get(): DatabaseSchema {
    return this.db;
  }

  public update(updater: (db: DatabaseSchema) => void): DatabaseSchema {
    updater(this.db);
    this.saveDatabase(this.db);
    return this.db;
  }
}

export const dbManager = new DatabaseManager();
