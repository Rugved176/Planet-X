import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const CONFIG_FILE = path.resolve(process.cwd(), 'firebase-applet-config.json');
export let firestoreDb: any = null;

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const firebaseConfig = JSON.parse(raw);
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log('[Firestore] Backend server initialized with database:', firebaseConfig.firestoreDatabaseId);
  }
} catch (err) {
  console.error('[Firestore] Error initializing Firestore in server/db.ts:', err);
}

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
  email?: string;
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
    eventIds: ['ai-quiz', 'debate-competition', 'free-fire', 'bgmi']
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
    id: 'free-fire',
    slug: 'free-fire',
    zoneId: 'zone-b',
    zoneName: 'FUN-ZONE',
    name: 'FREE FIRE CHAMPIONSHIP',
    shortDescription: 'High-octane mobile battle royale tournament for Free Fire squads.',
    fullDescription: 'Survive and dominate in the official PLANET-X Free Fire Mobile Battle Royale. Show off tactical rotations, gunplay precision, and squad coordination in custom room matches.',
    objectives: [
      'Outsurvive rival squads across fast-paced Battle Royale rounds',
      'Demonstrate tactical rotations, zone management, and clutch gunplay',
      'Claim the Booyah and top the kills scoreboard'
    ],
    eligibility: 'Open to all college Free Fire squads with valid UID handles.',
    rules: [
      'Custom room credentials will be shared in the official WhatsApp group prior to match start.',
      '4-player squad format. Emulators are strictly prohibited.',
      'Unsportsmanlike conduct, hacking, or teaming up leads to instant disqualification.',
      'All squad members must be present in room lobby 10 minutes prior to match time.'
    ],
    judgingCriteria: [
      'Match Placement Points',
      'Total Team Kill Count'
    ],
    minTeamSize: 1,
    maxTeamSize: 4,
    registrationFee: 150,
    registrationDeadline: '2026-11-17T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_confirmation',
    customFields: [
      { id: 'freeFireUids', label: 'In-Game UIDs & IGNs for All Members', placeholder: 'e.g. Leader UID: 12345678, IGN: ApexPredator', required: true }
    ]
  },
  {
    id: 'bgmi',
    slug: 'bgmi',
    zoneId: 'zone-b',
    zoneName: 'FUN-ZONE',
    name: 'BGMI BATTLEGROUNDS CHAMPIONSHIP',
    shortDescription: 'Ultimate BGMI Battle Royale showdown for tactical gaming squads.',
    fullDescription: 'Battle for victory in the PLANET-X Battlegrounds Mobile India tournament. Compete in intense custom room matches across Erangel and Miramar.',
    objectives: [
      'Dominate the battlegrounds in multi-map squad matches',
      'Demonstrate squad positioning, utility usage, and sharp entry fragging',
      'Climb the point table across placement and elimination metrics'
    ],
    eligibility: 'Open to all college BGMI squads with active character IDs.',
    rules: [
      'Custom room ID and password will be shared via official WhatsApp group 15 mins before match time.',
      'Squad format (4 players). Mobile devices only (strictly no emulators).',
      'Hacking, teaming up, or exploiting glitches leads to immediate ban and forfeit.',
      'Screenshots of end-of-match stats must be submitted by team leader.'
    ],
    judgingCriteria: [
      'Positioning & Placement Points',
      'Elimination Points'
    ],
    minTeamSize: 1,
    maxTeamSize: 4,
    registrationFee: 200,
    registrationDeadline: '2026-11-17T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_confirmation',
    customFields: [
      { id: 'bgmiIds', label: 'In-Game Character IDs & IGNs for All Members', placeholder: 'e.g. Leader ID: 512345678, IGN: Soul_Mortal', required: true }
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
    email: 'planetx.event@gmail.com',
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
    email: 'ved.shinde@nmims.edu',
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
    email: 'dakshal.ahire@nmims.edu',
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
    email: 'yash.khairnar@nmims.edu',
    displayOrder: 4
  },
  {
    id: 'team-harsh',
    name: 'Harsh',
    role: 'Public Relations & Participant Outreach',
    bio: 'Drives inter-college delegations, community communications, and participant support desks.',
    photoUrl: '',
    socialLink: 'https://linkedin.com',
    phone: '+91 9876543210',
    email: 'harsh.pr@nmims.edu',
    displayOrder: 5
  },
  {
    id: 'team-herambh',
    name: 'Herambh',
    role: 'Competitions & Judging Coordinator',
    bio: 'Facilitates problem statements, rubric standardization, and technical jury management.',
    photoUrl: '',
    socialLink: 'https://linkedin.com',
    phone: '+91 9123456789',
    email: 'herambh.judging@nmims.edu',
    displayOrder: 6
  }
];

// Helper class for atomic DB operations
class DatabaseManager {
  private db: DatabaseSchema;
  private isSyncing = false;
  private lastSyncTime = 0;

  constructor() {
    this.db = this.loadDatabase();
    this.syncFromFirestore(true).catch(err => {
      console.error('[Firestore] Initial startup sync error:', err);
    });
  }

  public async syncFromFirestore(force = false): Promise<DatabaseSchema> {
    const now = Date.now();
    if (!firestoreDb || (this.isSyncing || (!force && now - this.lastSyncTime < 2000))) {
      return this.db;
    }

    this.isSyncing = true;
    try {
      // 1. Fetch specific team_members collection
      const teamCol = collection(firestoreDb, 'team_members');
      const teamSnap = await getDocs(teamCol);
      if (!teamSnap.empty) {
        const cloudMembers: OrganizingTeamMember[] = [];
        teamSnap.forEach(docSnap => {
          const data = docSnap.data() as OrganizingTeamMember;
          if (data && data.id) {
            cloudMembers.push(data);
          }
        });
        if (cloudMembers.length > 0) {
          cloudMembers.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          this.db.teamMembers = cloudMembers;
        }
      }

      // 2. Fetch specific events collection
      const eventsCol = collection(firestoreDb, 'events');
      const eventsSnap = await getDocs(eventsCol);
      if (!eventsSnap.empty) {
        const cloudEvents: CompetitionEvent[] = [];
        eventsSnap.forEach(docSnap => {
          const data = docSnap.data() as CompetitionEvent;
          if (data && data.id) {
            cloudEvents.push(data);
          }
        });
        if (cloudEvents.length > 0) {
          this.db.events = cloudEvents;
        }
      }

      // 3. Fetch specific settings document
      const settingsRef = doc(firestoreDb, 'settings', 'main');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const cloudSettings = settingsSnap.data() as GlobalSettings;
        if (cloudSettings) {
          this.db.settings = { ...this.db.settings, ...cloudSettings };
        }
      }

      // 4. Fetch specific registrations collection
      const regCol = collection(firestoreDb, 'registrations');
      const regSnap = await getDocs(regCol);
      if (!regSnap.empty) {
        const cloudRegs: Registration[] = [];
        regSnap.forEach(docSnap => {
          const data = docSnap.data() as Registration;
          if (data && data.id) {
            cloudRegs.push(data);
          }
        });
        if (cloudRegs.length > 0) {
          cloudRegs.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
          this.db.registrations = cloudRegs;
        }
      }

      // 5. Fetch specific users collection
      const usersCol = collection(firestoreDb, 'users');
      const usersSnap = await getDocs(usersCol);
      if (!usersSnap.empty) {
        const cloudUsers: UserProfile[] = [];
        usersSnap.forEach(docSnap => {
          const data = docSnap.data() as UserProfile;
          if (data && data.id) {
            cloudUsers.push(data);
          }
        });
        if (cloudUsers.length > 0) {
          this.db.users = cloudUsers;
        }
      }

      // Guarantee primary admin account planetx.event@gmail.com is ALWAYS present and has role admin
      const adminUser = this.db.users.find(u => u.email.toLowerCase() === 'planetx.event@gmail.com');
      if (!adminUser) {
        this.db.users.push({
          id: 'usr-admin-planetx',
          email: 'planetx.event@gmail.com',
          passwordHash: '$2a$10$325u3L41J/7Pq8B8eH1eue6b/06k7d3/L.o3i9N3x34i7.r6d1v02', // SVKM hash placeholder
          name: 'PLANET-X Administrator',
          phone: '+91 9975952579',
          college: "SVKM's NMIMS Global University, Dhule",
          role: 'admin',
          emailVerified: true,
          createdAt: new Date().toISOString()
        });
      } else {
        adminUser.role = 'admin';
      }

      // 6. Pull main state (zones, emailLogs, auditLogs, contactMessages, and fallback settings/teamMembers)
      const docRef = doc(firestoreDb, 'app_state', 'main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data() as DatabaseSchema;
        if (cloudData) {
          if (cloudData.settings) {
            this.db.settings = { ...this.db.settings, ...cloudData.settings };
          }
          if (Array.isArray(cloudData.zones) && cloudData.zones.length > 0) this.db.zones = cloudData.zones;
          if (Array.isArray(cloudData.emailLogs)) this.db.emailLogs = cloudData.emailLogs;
          if (Array.isArray(cloudData.auditLogs)) this.db.auditLogs = cloudData.auditLogs;
          if (Array.isArray(cloudData.contactMessages)) this.db.contactMessages = cloudData.contactMessages;
        }
      } else {
        await this.saveToFirestore();
      }

      this.saveDatabase(this.db);
      this.lastSyncTime = Date.now();
      console.log('[Firestore] Synchronized state (team_members, events, settings, registrations, users, app_state) from Cloud Firestore!');
    } catch (err) {
      console.error('[Firestore] Error pulling from Cloud Firestore:', err);
    } finally {
      this.isSyncing = false;
    }
    return this.db;
  }

  public async saveToFirestore(): Promise<void> {
    if (!firestoreDb) return;
    try {
      // 1. Save team members individually to dedicated collection
      if (Array.isArray(this.db.teamMembers)) {
        const currentMemberIds = new Set(this.db.teamMembers.map(m => m.id));
        
        // Remove deleted members from team_members collection in Firestore
        try {
          const teamCol = collection(firestoreDb, 'team_members');
          const teamSnap = await getDocs(teamCol);
          if (!teamSnap.empty) {
            for (const docSnap of teamSnap.docs) {
              if (!currentMemberIds.has(docSnap.id)) {
                await deleteDoc(doc(firestoreDb, 'team_members', docSnap.id));
              }
            }
          }
        } catch (delErr) {
          console.error('[Firestore] Error cleaning orphan team_members:', delErr);
        }

        // Save active team members
        for (const m of this.db.teamMembers) {
          if (m && m.id) {
            const mRef = doc(firestoreDb, 'team_members', m.id);
            await setDoc(mRef, m, { merge: true });
          }
        }
      }

      // 2. Save events individually to dedicated events collection
      if (Array.isArray(this.db.events)) {
        const currentEventIds = new Set(this.db.events.map(e => e.id));
        try {
          const eventsCol = collection(firestoreDb, 'events');
          const eventsSnap = await getDocs(eventsCol);
          if (!eventsSnap.empty) {
            for (const docSnap of eventsSnap.docs) {
              if (!currentEventIds.has(docSnap.id)) {
                await deleteDoc(doc(firestoreDb, 'events', docSnap.id));
              }
            }
          }
        } catch (delErr) {
          console.error('[Firestore] Error cleaning orphan events:', delErr);
        }

        for (const ev of this.db.events) {
          if (ev && ev.id) {
            const evRef = doc(firestoreDb, 'events', ev.id);
            await setDoc(evRef, ev, { merge: true });
          }
        }
      }

      // 3. Save settings to dedicated settings/main document
      if (this.db.settings) {
        const settingsRef = doc(firestoreDb, 'settings', 'main');
        await setDoc(settingsRef, this.db.settings, { merge: true });
      }

      // 4. Save individual registrations with proof URLs to registrations collection
      if (Array.isArray(this.db.registrations)) {
        for (const reg of this.db.registrations) {
          if (reg && reg.id) {
            const regRef = doc(firestoreDb, 'registrations', reg.id);
            await setDoc(regRef, reg, { merge: true });
          }
        }
      }

      // 5. Save users individually to dedicated users collection
      if (Array.isArray(this.db.users)) {
        for (const u of this.db.users) {
          if (u && u.id) {
            const uRef = doc(firestoreDb, 'users', u.id);
            await setDoc(uRef, u, { merge: true });
          }
        }
      }

      // 6. Save sanitized app_state/main (trimming paymentProofUrl base64 to prevent >1MB single-document limits)
      const sanitizedDb: DatabaseSchema = {
        ...this.db,
        registrations: (this.db.registrations || []).map(r => ({
          ...r,
          paymentProofUrl: (r.paymentProofUrl && r.paymentProofUrl.length > 500) ? '[STORED_IN_REGISTRATION_DOC]' : r.paymentProofUrl
        }))
      };

      const docRef = doc(firestoreDb, 'app_state', 'main');
      await setDoc(docRef, sanitizedDb);
      this.lastSyncTime = Date.now();
      console.log('[Firestore] Persisted changes synchronously to Cloud Firestore (events, settings, team_members, registrations, users, app_state)!');
    } catch (err) {
      console.error('[Firestore] Error persisting to Cloud Firestore:', err);
    }
  }

  public async updateAsync(updater: (db: DatabaseSchema) => void): Promise<DatabaseSchema> {
    updater(this.db);
    this.saveDatabase(this.db);
    await this.saveToFirestore();
    return this.db;
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        let updated = false;

        // Auto-migrate legacy 'gaming-competition' into 'free-fire' & 'bgmi'
        if (parsed.events) {
          const legacyIndex = parsed.events.findIndex(e => e.id === 'gaming-competition');
          if (legacyIndex !== -1) {
            parsed.events.splice(legacyIndex, 1);
            if (!parsed.events.some(e => e.id === 'free-fire')) {
              const ff = INITIAL_EVENTS.find(e => e.id === 'free-fire');
              if (ff) parsed.events.push(ff);
            }
            if (!parsed.events.some(e => e.id === 'bgmi')) {
              const bgmi = INITIAL_EVENTS.find(e => e.id === 'bgmi');
              if (bgmi) parsed.events.push(bgmi);
            }
            updated = true;
          }
        }

        if (parsed.zones) {
          const zoneB = parsed.zones.find(z => z.id === 'zone-b');
          if (zoneB && zoneB.eventIds.includes('gaming-competition')) {
            zoneB.eventIds = zoneB.eventIds.filter(id => id !== 'gaming-competition');
            if (!zoneB.eventIds.includes('free-fire')) zoneB.eventIds.push('free-fire');
            if (!zoneB.eventIds.includes('bgmi')) zoneB.eventIds.push('bgmi');
            updated = true;
          }
        }

        // Ensure teamMembers is initialized
        if (!parsed.teamMembers || !Array.isArray(parsed.teamMembers) || parsed.teamMembers.length === 0) {
          parsed.teamMembers = INITIAL_TEAM_MEMBERS;
          updated = true;
        }

        if (!parsed.settings) {
          parsed.settings = INITIAL_SETTINGS;
          updated = true;
        }
        if (!parsed.zones || !Array.isArray(parsed.zones) || parsed.zones.length === 0) {
          parsed.zones = INITIAL_ZONES;
          updated = true;
        }
        if (!parsed.events || !Array.isArray(parsed.events) || parsed.events.length === 0) {
          parsed.events = INITIAL_EVENTS;
          updated = true;
        }
        if (!parsed.users) parsed.users = [];
        if (!parsed.registrations) parsed.registrations = [];
        if (!parsed.emailLogs) parsed.emailLogs = [];
        if (!parsed.auditLogs) parsed.auditLogs = [];
        if (!parsed.contactMessages) parsed.contactMessages = [];

        if (updated) {
          this.saveDatabase(parsed);
        }

        return parsed;
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
    this.saveToFirestore().catch(err => {
      console.error('[Firestore] Async background write error:', err);
    });
    return this.db;
  }
}

export const dbManager = new DatabaseManager();
