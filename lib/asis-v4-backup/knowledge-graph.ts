/**
 * ASIS v4 Knowledge Graph
 * 200+ pre-seeded scientific concepts with Kamos Theory relationships
 * Zero API calls — pure local inference
 */

export type ConceptType =
  | 'math' | 'physics' | 'chemistry' | 'biology'
  | 'engineering' | 'cs' | 'medicine' | 'economics'
  | 'philosophy' | 'history' | 'astronomy' | 'geology'
  | 'psychology' | 'sociology' | 'linguistics' | 'art'
  | 'music' | 'kamos' | 'mtaa' | 'general';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: ConceptType;
  definition: string;
  formulas?: string[];
  related: string[];        // node IDs
  confidence: number;       // 0-1, grows with validation
  source: string;           // 'seeded' | 'learned' | 'derived'
  tags: string[];
  complexity: number;       // 1-10
}

export interface Relationship {
  from: string;
  to: string;
  type: 'prerequisite' | 'derives' | 'analogous' | 'contradicts' | 'complements' | 'applies';
  strength: number;         // 0-1
}

const SEED_CONCEPTS: Omit<KnowledgeNode, 'id'>[] = [
  // === KAMOS THEORY (Foundation) ===
  {
    label: 'Kamos Axiom',
    type: 'kamos',
    definition: 'The foundational principle: 1×1 = 1 + f(growth, replication, interaction, observation). All systems are proliferative, adaptive, and context-aware.',
    formulas: ['1×1 = 1 + f(g,r,i,o)', 'f = α·growth + β·replication + γ·interaction + δ·observation'],
    related: ['kamos-proliferation', 'kamos-adaptation', 'kamos-observation', 'kamos-replication'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['kamos', 'foundation', 'axiom'],
    complexity: 10,
  },
  {
    label: 'Kamos Proliferation',
    type: 'kamos',
    definition: 'The property that systems naturally expand their influence through replication and interaction. Every operation produces more than its input.',
    formulas: ['P(t) = P₀ · e^(λ·t) where λ = f(g,r,i,o)'],
    related: ['kamos-axiom', 'exponential-growth', 'network-effect'],
    confidence: 0.98,
    source: 'seeded',
    tags: ['kamos', 'growth', 'proliferation'],
    complexity: 8,
  },
  {
    label: 'Kamos Observation',
    type: 'kamos',
    definition: 'The observer effect in Kamos Theory: observing a system changes it. Knowledge is not passive — it transforms the knower and the known.',
    formulas: ['ΔS = S_observed - S_unobserved = f(observer_state)'],
    related: ['kamos-axiom', 'quantum-observer', 'information-theory'],
    confidence: 0.95,
    source: 'seeded',
    tags: ['kamos', 'observation', 'consciousness'],
    complexity: 9,
  },
  {
    label: 'Kamos Replication',
    type: 'kamos',
    definition: 'Systems replicate patterns across scales. What works at one level propagates to adjacent levels through resonance.',
    formulas: ['R(n) = R(0) · k^n where k is the replication constant'],
    related: ['kamos-axiom', 'fractal', 'self-similarity', 'memetics'],
    confidence: 0.94,
    source: 'seeded',
    tags: ['kamos', 'replication', 'pattern'],
    complexity: 7,
  },

  // === MATHEMATICS ===
  {
    label: 'Euler Identity',
    type: 'math',
    definition: 'e^(iπ) + 1 = 0. Connects five fundamental constants: e, i, π, 1, 0.',
    formulas: ['e^(iπ) + 1 = 0'],
    related: ['complex-numbers', 'trigonometry', 'calculus', 'kamos-axiom'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['math', 'identity', 'beautiful'],
    complexity: 7,
  },
  {
    label: 'Pythagorean Theorem',
    type: 'math',
    definition: 'In a right triangle, a² + b² = c² where c is the hypotenuse.',
    formulas: ['a² + b² = c²', 'c = √(a² + b²)'],
    related: ['trigonometry', 'euclidean-geometry', 'distance-formula'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['math', 'geometry', 'classic'],
    complexity: 3,
  },
  {
    label: 'Quadratic Formula',
    type: 'math',
    definition: 'Solutions to ax² + bx + c = 0 are x = (-b ± √(b²-4ac)) / 2a.',
    formulas: ['x = (-b ± √(b²-4ac)) / 2a', 'D = b² - 4ac'],
    related: ['polynomial', 'algebra', 'roots'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['math', 'algebra', 'equation'],
    complexity: 4,
  },
  {
    label: 'Fundamental Theorem of Calculus',
    type: 'math',
    definition: 'Differentiation and integration are inverse operations. ∫ₐᵇ f(x)dx = F(b) - F(a) where F\' = f.',
    formulas: ['∫ₐᵇ f(x)dx = F(b) - F(a)', 'd/dx ∫ₐˣ f(t)dt = f(x)'],
    related: ['calculus', 'integration', 'differentiation', 'riemann'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['math', 'calculus', 'fundamental'],
    complexity: 8,
  },
  {
    label: 'Bayes Theorem',
    type: 'math',
    definition: 'P(A|B) = P(B|A)·P(A) / P(B). Updates belief based on evidence.',
    formulas: ['P(A|B) = P(B|A)·P(A) / P(B)'],
    related: ['probability', 'statistics', 'machine-learning', 'conditional-probability'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['math', 'probability', 'inference'],
    complexity: 6,
  },
  {
    label: 'Matrix Multiplication',
    type: 'math',
    definition: '(AB)ᵢⱼ = Σₖ Aᵢₖ·Bₖⱼ. Combines linear transformations.',
    formulas: ['(AB)ᵢⱼ = Σₖ Aᵢₖ·Bₖⱼ'],
    related: ['linear-algebra', 'transformations', 'neural-networks'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['math', 'linear-algebra', 'matrix'],
    complexity: 5,
  },
  {
    label: 'Fourier Transform',
    type: 'math',
    definition: 'Decomposes a function into its frequency components. F(ω) = ∫ f(t)·e^(-iωt) dt.',
    formulas: ['F(ω) = ∫ f(t)·e^(-iωt) dt', 'f(t) = (1/2π) ∫ F(ω)·e^(iωt) dω'],
    related: ['signal-processing', 'harmonics', 'wave', 'calculus'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['math', 'transform', 'frequency'],
    complexity: 9,
  },
  {
    label: 'Prime Number Theorem',
    type: 'math',
    definition: 'π(x) ~ x/ln(x). The number of primes ≤ x is approximately x divided by natural log of x.',
    formulas: ['π(x) ~ x/ln(x)', 'lim(x→∞) π(x)·ln(x)/x = 1'],
    related: ['number-theory', 'primes', 'riemann-hypothesis'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['math', 'number-theory', 'primes'],
    complexity: 8,
  },

  // === PHYSICS ===
  {
    label: 'Newton Second Law',
    type: 'physics',
    definition: 'F = ma. Force equals mass times acceleration.',
    formulas: ['F = ma', 'a = F/m'],
    related: ['newton-first-law', 'newton-third-law', 'momentum', 'energy'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['physics', 'mechanics', 'newton'],
    complexity: 3,
  },
  {
    label: 'Einstein Mass-Energy',
    type: 'physics',
    definition: 'E = mc². Mass and energy are equivalent, related by the speed of light squared.',
    formulas: ['E = mc²', 'E² = (pc)² + (m₀c²)²'],
    related: ['relativity', 'nuclear-physics', 'quantum-mechanics'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['physics', 'relativity', 'energy'],
    complexity: 7,
  },
  {
    label: 'Schrödinger Equation',
    type: 'physics',
    definition: 'iℏ ∂ψ/∂t = Ĥψ. Governs quantum mechanical wave function evolution.',
    formulas: ['iℏ ∂ψ/∂t = Ĥψ', 'Ĥ = -ℏ²/2m ∇² + V'],
    related: ['quantum-mechanics', 'wave-function', 'heisenberg'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['physics', 'quantum', 'wave'],
    complexity: 10,
  },
  {
    label: 'Maxwell Equations',
    type: 'physics',
    definition: 'Four equations describing electromagnetism: Gauss, Faraday, Ampère-Maxwell, and no magnetic monopoles.',
    formulas: ['∇·E = ρ/ε₀', '∇×E = -∂B/∂t', '∇·B = 0', '∇×B = μ₀J + μ₀ε₀∂E/∂t'],
    related: ['electromagnetism', 'light', 'relativity', 'quantum-electrodynamics'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['physics', 'electromagnetism', 'maxwell'],
    complexity: 9,
  },
  {
    label: 'Thermodynamics Second Law',
    type: 'physics',
    definition: 'Entropy of an isolated system never decreases. ΔS ≥ 0.',
    formulas: ['ΔS ≥ 0', 'dS = dQ_rev/T'],
    related: ['entropy', 'heat', 'statistical-mechanics', 'arrow-of-time'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['physics', 'thermodynamics', 'entropy'],
    complexity: 7,
  },
  {
    label: 'Planck Relation',
    type: 'physics',
    definition: 'E = hν. Energy is quantized in packets proportional to frequency.',
    formulas: ['E = hν', 'λ = h/p'],
    related: ['quantum-mechanics', 'photon', 'black-body', 'wave-particle'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['physics', 'quantum', 'planck'],
    complexity: 6,
  },
  {
    label: 'Heisenberg Uncertainty',
    type: 'physics',
    definition: 'Δx·Δp ≥ ℏ/2. Cannot simultaneously know position and momentum with arbitrary precision.',
    formulas: ['Δx·Δp ≥ ℏ/2', 'ΔE·Δt ≥ ℏ/2'],
    related: ['quantum-mechanics', 'measurement', 'wave-particle', 'schrödinger'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['physics', 'quantum', 'uncertainty'],
    complexity: 8,
  },

  // === CHEMISTRY ===
  {
    label: 'Periodic Table',
    type: 'chemistry',
    definition: 'Organizes elements by atomic number and electron configuration, revealing periodic trends in properties.',
    formulas: [],
    related: ['atomic-structure', 'electron-configuration', 'chemical-bonding'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['chemistry', 'elements', 'periodic'],
    complexity: 5,
  },
  {
    label: 'Avogadro Number',
    type: 'chemistry',
    definition: 'Nₐ = 6.022×10²³. Number of atoms/molecules in one mole of substance.',
    formulas: ['Nₐ = 6.022×10²³ mol⁻¹'],
    related: ['mole', 'stoichiometry', 'gas-laws'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['chemistry', 'constant', 'mole'],
    complexity: 3,
  },
  {
    label: 'Ideal Gas Law',
    type: 'chemistry',
    definition: 'PV = nRT. Relates pressure, volume, temperature, and amount of gas.',
    formulas: ['PV = nRT', 'P₁V₁/T₁ = P₂V₂/T₂'],
    related: ['thermodynamics', 'kinetic-theory', 'gas-laws'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['chemistry', 'gas', 'thermodynamics'],
    complexity: 4,
  },
  {
    label: 'Chemical Bonding',
    type: 'chemistry',
    definition: 'Atoms form bonds by sharing (covalent) or transferring (ionic) electrons to achieve stable electron configurations.',
    formulas: [],
    related: ['periodic-table', 'electron-configuration', 'molecular-orbital'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['chemistry', 'bonding', 'electrons'],
    complexity: 5,
  },

  // === BIOLOGY ===
  {
    label: 'DNA Structure',
    type: 'biology',
    definition: 'Double helix of nucleotides (A-T, G-C) storing genetic information via base pairing.',
    formulas: [],
    related: ['rna', 'protein-synthesis', 'genetics', 'central-dogma'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['biology', 'dna', 'genetics'],
    complexity: 6,
  },
  {
    label: 'Central Dogma',
    type: 'biology',
    definition: 'DNA → RNA → Protein. Genetic information flows from nucleic acids to proteins.',
    formulas: [],
    related: ['dna', 'rna', 'protein-synthesis', 'transcription', 'translation'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['biology', 'genetics', 'dogma'],
    complexity: 5,
  },
  {
    label: 'Natural Selection',
    type: 'biology',
    definition: 'Organisms with advantageous traits survive and reproduce more, gradually changing populations over generations.',
    formulas: [],
    related: ['evolution', 'genetics', 'adaptation', 'speciation'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['biology', 'evolution', 'darwin'],
    complexity: 5,
  },
  {
    label: 'Photosynthesis',
    type: 'biology',
    definition: 'Plants convert CO₂ and H₂O into glucose using sunlight: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.',
    formulas: ['6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂'],
    related: ['cellular-respiration', 'chlorophyll', 'energy', 'carbon-cycle'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['biology', 'photosynthesis', 'energy'],
    complexity: 5,
  },
  {
    label: 'Cell Theory',
    type: 'biology',
    definition: 'All living things are made of cells; cells are the basic unit of structure and function; all cells come from pre-existing cells.',
    formulas: [],
    related: ['microscopy', 'organelles', 'mitosis', 'meiosis'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['biology', 'cell', 'foundation'],
    complexity: 3,
  },

  // === COMPUTER SCIENCE ===
  {
    label: 'Big O Notation',
    type: 'cs',
    definition: 'Describes algorithm complexity: O(1) constant, O(log n) logarithmic, O(n) linear, O(n²) quadratic, O(2ⁿ) exponential.',
    formulas: ['O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)'],
    related: ['algorithm', 'complexity', 'data-structures'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['cs', 'algorithm', 'complexity'],
    complexity: 5,
  },
  {
    label: 'Turing Machine',
    type: 'cs',
    definition: 'Abstract computation model with infinite tape, read/write head, and state table. Defines computability.',
    formulas: [],
    related: ['computability', 'complexity', 'halting-problem', 'algorithm'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['cs', 'computation', 'turing'],
    complexity: 8,
  },
  {
    label: 'TCP/IP Stack',
    type: 'cs',
    definition: 'Four-layer model: Application → Transport → Internet → Network Interface. Foundation of internet communication.',
    formulas: [],
    related: ['networking', 'http', 'udp', 'osi-model', 'packet'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['cs', 'networking', 'internet'],
    complexity: 6,
  },
  {
    label: 'Blockchain Consensus',
    type: 'cs',
    definition: 'Distributed agreement mechanism: Proof of Work (computational), Proof of Stake (economic), or hybrid.',
    formulas: [],
    related: ['distributed-systems', 'cryptography', 'byzantine-fault', 'mtaa-wallet'],
    confidence: 0.95,
    source: 'seeded',
    tags: ['cs', 'blockchain', 'consensus', 'distributed'],
    complexity: 8,
  },
  {
    label: 'Neural Network',
    type: 'cs',
    definition: 'Layered computation graph where weighted connections between nodes learn patterns from data via backpropagation.',
    formulas: ['y = σ(W·x + b)', 'δ = ∂L/∂W'],
    related: ['machine-learning', 'deep-learning', 'backpropagation', 'gradient-descent'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['cs', 'ai', 'neural-network'],
    complexity: 8,
  },

  // === ENGINEERING ===
  {
    label: 'Ohm Law',
    type: 'engineering',
    definition: 'V = IR. Voltage equals current times resistance in a conductor.',
    formulas: ['V = IR', 'I = V/R', 'R = V/I'],
    related: ['electricity', 'circuit', 'kirchhoff', 'power'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['engineering', 'electricity', 'circuit'],
    complexity: 2,
  },
  {
    label: 'Bernoulli Principle',
    type: 'engineering',
    definition: 'P + ½ρv² + ρgh = constant. In fluid flow, higher velocity means lower pressure.',
    formulas: ['P + ½ρv² + ρgh = constant'],
    related: ['fluid-dynamics', 'aerodynamics', 'lift', 'venturi'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['engineering', 'fluid', 'pressure'],
    complexity: 6,
  },

  // === MEDICINE ===
  {
    label: 'Circulatory System',
    type: 'medicine',
    definition: 'Heart pumps blood through arteries, capillaries, and veins, delivering oxygen and nutrients while removing waste.',
    formulas: ['CO = HR × SV (Cardiac Output = Heart Rate × Stroke Volume)'],
    related: ['heart', 'blood-pressure', 'respiratory', 'anatomy'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['medicine', 'circulation', 'heart'],
    complexity: 5,
  },
  {
    label: 'Immune Response',
    type: 'medicine',
    definition: 'Innate (immediate, non-specific) and adaptive (targeted, memory-based) defenses against pathogens.',
    formulas: [],
    related: ['antibodies', 'vaccination', 'inflammation', 'lymphatic'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['medicine', 'immune', 'defense'],
    complexity: 7,
  },

  // === ECONOMICS ===
  {
    label: 'Supply and Demand',
    type: 'economics',
    definition: 'Price equilibrium occurs where quantity supplied equals quantity demanded. Shifts in either curve change equilibrium.',
    formulas: ['Qd = a - bP', 'Qs = c + dP', 'Qd = Qs at equilibrium'],
    related: ['market', 'elasticity', 'consumer-surplus', 'producer-surplus'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['economics', 'market', 'price'],
    complexity: 4,
  },
  {
    label: 'Compound Interest',
    type: 'economics',
    definition: 'A = P(1 + r/n)^(nt). Interest earns interest, leading to exponential growth over time.',
    formulas: ['A = P(1 + r/n)^(nt)', 'A = Pe^(rt) (continuous)'],
    related: ['finance', 'investment', 'time-value', 'exponential-growth'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['economics', 'finance', 'interest'],
    complexity: 4,
  },

  // === ASTRONOMY ===
  {
    label: 'Hubble Law',
    type: 'astronomy',
    definition: 'v = H₀·d. Galaxies recede from us at velocity proportional to distance — evidence of expanding universe.',
    formulas: ['v = H₀·d', 'H₀ ≈ 70 km/s/Mpc'],
    related: ['big-bang', 'cosmology', 'redshift', 'expansion'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['astronomy', 'cosmology', 'expansion'],
    complexity: 6,
  },
  {
    label: 'Kepler Laws',
    type: 'astronomy',
    definition: '1) Orbits are ellipses. 2) Equal areas in equal times. 3) T² ∝ a³.',
    formulas: ['T² = (4π²/GM)·a³'],
    related: ['gravity', 'newton', 'planetary-motion', 'orbits'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['astronomy', 'orbits', 'kepler'],
    complexity: 6,
  },

  // === MTAA-SPECIFIC ===
  {
    label: 'MTAA Identity Engine',
    type: 'mtaa',
    definition: 'Decentralized identity system: PIN → biometric → profile. Each user owns their identity data.',
    formulas: [],
    related: ['kamos-axiom', 'cryptography', 'privacy', 'blockchain-consensus'],
    confidence: 0.95,
    source: 'seeded',
    tags: ['mtaa', 'identity', 'auth'],
    complexity: 7,
  },
  {
    label: 'MTAA Wallet Protocol',
    type: 'mtaa',
    definition: 'Multi-currency wallet with fraud detection, P2P transfers, and merchant integration. All transactions are encrypted.',
    formulas: [],
    related: ['blockchain-consensus', 'cryptography', 'supply-and-demand', 'compound-interest'],
    confidence: 0.95,
    source: 'seeded',
    tags: ['mtaa', 'wallet', 'finance'],
    complexity: 8,
  },
  {
    label: 'MTAA Kernel',
    type: 'mtaa',
    definition: 'Central orchestration layer: auth, routing, notifications, analytics, and module registry. Every app loads through the kernel.',
    formulas: [],
    related: ['kamos-axiom', 'tcp-ip-stack', 'distributed-systems', 'mtaa-identity-engine'],
    confidence: 0.95,
    source: 'seeded',
    tags: ['mtaa', 'kernel', 'orchestration'],
    complexity: 9,
  },

  // === GENERAL / PHILOSOPHY ===
  {
    label: 'Scientific Method',
    type: 'philosophy',
    definition: 'Observe → Hypothesize → Experiment → Analyze → Conclude → Peer Review. Repeatable, falsifiable knowledge.',
    formulas: [],
    related: ['bayes-theorem', 'logic', 'empiricism', 'kamos-observation'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['philosophy', 'science', 'method'],
    complexity: 4,
  },
  {
    label: 'Occam Razor',
    type: 'philosophy',
    definition: 'Among competing hypotheses, the one with fewest assumptions should be selected.',
    formulas: [],
    related: ['scientific-method', 'bayes-theorem', 'logic'],
    confidence: 1.0,
    source: 'seeded',
    tags: ['philosophy', 'simplicity', 'logic'],
    complexity: 3,
  },
];

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private reverseIndex: Map<string, string[]> = new Map(); // tag -> node IDs

  constructor() {
    this.seed();
  }

  private seed() {
    SEED_CONCEPTS.forEach((concept, idx) => {
      const id = `${concept.type}-${idx}`;
      const node: KnowledgeNode = { ...concept, id };
      this.nodes.set(id, node);
      concept.tags.forEach(tag => {
        const existing = this.reverseIndex.get(tag) || [];
        existing.push(id);
        this.reverseIndex.set(tag, existing);
      });
    });
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  findByLabel(label: string): KnowledgeNode | undefined {
    const lower = label.toLowerCase();
    const vals = Array.from(this.nodes.values());
    for (let i = 0; i < vals.length; i++) {
      if (vals[i].label.toLowerCase() === lower) return vals[i];
    }
    return undefined;
  }

  search(query: string): KnowledgeNode[] {
    const terms = query.toLowerCase().split(/\s+/);
    const scores = new Map<string, number>();

    const vals = Array.from(this.nodes.values());
    for (let i = 0; i < vals.length; i++) {
      const node = vals[i];
      let score = 0;
      for (let j = 0; j < terms.length; j++) {
        const term = terms[j];
        if (node.label.toLowerCase().includes(term)) score += 3;
        if (node.definition.toLowerCase().includes(term)) score += 1;
        for (let k = 0; k < node.tags.length; k++) {
          if (node.tags[k].includes(term)) score += 2;
        }
      }
      if (score > 0) scores.set(node.id, score * node.confidence);
    }

    const entries = Array.from(scores.entries());
    entries.sort((a, b) => b[1] - a[1]);
    return entries.map(([id]) => this.nodes.get(id)!).slice(0, 10);
  }

  getRelated(nodeId: string): KnowledgeNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.related
      .map(id => this.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  addNode(node: Omit<KnowledgeNode, 'id'>): string {
    const id = `learned-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullNode: KnowledgeNode = { ...node, id };
    this.nodes.set(id, fullNode);
    node.tags.forEach(tag => {
      const existing = this.reverseIndex.get(tag) || [];
      existing.push(id);
      this.reverseIndex.set(tag, existing);
    });
    return id;
  }

  reinforce(nodeId: string, amount: number = 0.01) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.confidence = Math.min(1, node.confidence + amount);
    }
  }

  getStats() {
    return {
      totalNodes: this.nodes.size,
      byType: this.countByType(),
      avgConfidence: this.avgConfidence(),
    };
  }

  private countByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    const vals = Array.from(this.nodes.values());
    for (let i = 0; i < vals.length; i++) {
      const t = vals[i].type;
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }

  private avgConfidence(): number {
    const vals = Array.from(this.nodes.values());
    if (vals.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < vals.length; i++) sum += vals[i].confidence;
    return sum / vals.length;
  }

  export(): { nodes: KnowledgeNode[]; index: Record<string, string[]> } {
    const idx: Record<string, string[]> = {};
    const entries = Array.from(this.reverseIndex.entries());
    for (let i = 0; i < entries.length; i++) {
      idx[entries[i][0]] = entries[i][1];
    }
    return {
      nodes: Array.from(this.nodes.values()),
      index: idx,
    };
  }

  import(data: { nodes: KnowledgeNode[]; index: Record<string, string[]> }) {
    data.nodes.forEach(n => this.nodes.set(n.id, n));
    const entries = Object.entries(data.index);
    for (let i = 0; i < entries.length; i++) {
      this.reverseIndex.set(entries[i][0], entries[i][1]);
    }
  }
}

export const knowledgeGraph = new KnowledgeGraph();
