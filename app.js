/**
 * ATS-Radar — 100% Client-Side ATS Resume & Job Match Analyzer
 * Zero server uploads, deterministic keyword + impact audit, optional BYOK free LLM rewrite.
 */

const MONETIZATION_CONFIG = {
  proPackUrl: "https://github.com/sponsors/dhaulagani",
  proPackLabel: "Get Pro LaTeX + 50 Bullet Formulas ($9)",
  infraDirectoryUrl: "https://dhaulagani.github.io/awesome-free-developer-infra/",
  digitalOceanRef: "https://m.do.co/c/88cb7c3c8071",
  railwayRef: "https://railway.com?referralCode=wSgkHD",
  vultrRef: "https://www.vultr.com/?ref=9934298"
};

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "you", "your", "are",
  "our", "will", "have", "has", "was", "were", "can", "all", "not", "but",
  "about", "into", "over", "more", "than", "other", "such", "their", "they",
  "who", "what", "when", "where", "which", "how", "work", "working", "team",
  "experience", "years", "year", "role", "position", "company", "looking",
  "strong", "ability", "skills", "skill", "knowledge", "using", "used",
  "including", "across", "within", "both", "high", "new", "well", "good",
  "build", "building", "help", "make", "join", "must", "should", "plus",
  "preferred", "required", "responsibilities", "requirements", "qualifications",
  "benefits", "remote", "hybrid", "full", "time", "equal", "opportunity",
  "employer", "including", "related", "field", "degree", "bachelor", "master"
]);

const KNOWN_MULTIWORD_SKILLS = [
  "ci/cd", "rest api", "restful api", "graphql", "machine learning", "deep learning",
  "natural language processing", "computer vision", "system design", "distributed systems",
  "microservices", "event-driven", "message queue", "apache kafka", "aws lambda",
  "amazon web services", "google cloud", "microsoft azure", "next.js", "react.js",
  "node.js", "vue.js", "tailwind css", "ruby on rails", "spring boot", "fastapi",
  "postgresql", "mysql", "mongodb", "dynamodb", "redis", "elasticsearch",
  "kubernetes", "docker", "terraform", "ansible", "github actions", "gitlab ci",
  "unit testing", "integration testing", "end-to-end testing", "test-driven development",
  "agile", "scrum", "data structures", "algorithms", "object-oriented programming",
  "functional programming", "oauth2", "jwt", "role-based access control", "observability",
  "prometheus", "grafana", "datadog", "sentry", "open telemetry", "sql", "nosql",
  "typescript", "javascript", "python", "golang", "rust", "java", "c++", "c#",
  "cloud architecture", "serverless", "webassembly", "websockets", "grpc", "protobuf",
  "product management", "stakeholder management", "cross-functional", "a/b testing"
];

const STRONG_VERBS = [
  "architected", "automated", "accelerated", "built", "consolidated", "cut",
  "decreased", "delivered", "deployed", "designed", "developed", "eliminated",
  "engineered", "established", "executed", "expanded", "generated", "implemented",
  "improved", "increased", "initiated", "launched", "led", "migrated", "optimized",
  "orchestrated", "pioneered", "reduced", "refactored", "resolved", "scaled",
  "shipped", "simplified", "spearheaded", "standardized", "streamlined", "transformed"
];

const WEAK_PHRASES = [
  "responsible for", "worked on", "helped with", "assisted in", "tasked with",
  "duties included", "involved in", "participated in", "familiar with", "team player"
];

const SAMPLE_RESUME = `ALEX RIVERA
San Francisco, CA | alex.rivera@example.com | github.com/alexrivera | linkedin.com/in/alexrivera

SUMMARY
Backend Software Engineer with 5+ years of experience building scalable APIs and cloud-native services in Python and Node.js.

EXPERIENCE
Senior Software Engineer — FinFlow Systems (2023 – Present)
- Engineered REST API microservices using Python, FastAPI, and PostgreSQL handling 12,000 requests/minute.
- Reduced database query latency by 42% through Redis caching and composite index optimization.
- Built CI/CD pipelines via GitHub Actions and Docker, cutting deployment time from 28 minutes to 4 minutes.
- Worked on payment reconciliation webhooks and helped with legacy code cleanup.

Software Engineer — CloudPulse Labs (2021 – 2023)
- Developed Node.js and TypeScript background workers processing 500k daily webhook events.
- Responsible for maintaining AWS EC2 instances and monitoring uptime alerts.
- Implemented unit testing and integration testing suites reaching 84% code coverage.

SKILLS
Languages: Python, TypeScript, JavaScript, SQL
Frameworks & Data: FastAPI, Node.js, PostgreSQL, Redis, Docker, GitHub Actions
Cloud: AWS, Linux, REST API, Unit Testing

EDUCATION
B.S. in Computer Science, University of California (2020)`;

const SAMPLE_JD = `Senior Backend Engineer (Distributed Systems)
We are looking for a Senior Backend Engineer to design and scale our core distributed systems and high-throughput data pipelines.

Requirements:
- 4+ years of production experience with Python, Golang, or TypeScript/Node.js.
- Deep expertise in PostgreSQL, Redis, and distributed message queues like Apache Kafka.
- Strong background in system design, microservices architecture, REST API, and gRPC.
- Hands-on experience deploying containerized workloads with Docker, Kubernetes, and Terraform on AWS.
- Experience implementing CI/CD automation, observability (Prometheus, Grafana, Open Telemetry), and security best practices (OAuth2, JWT).
- Track record of improving latency, reliability, and shipping well-tested code using automated integration testing.`;

const elements = {
  resumeInput: document.getElementById("resumeInput"),
  jdInput: document.getElementById("jdInput"),
  resumeFile: document.getElementById("resumeFile"),
  resumeStats: document.getElementById("resumeStats"),
  jdStats: document.getElementById("jdStats"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  resultsSection: document.getElementById("resultsSection"),
  scoreGaugeFill: document.getElementById("scoreGaugeFill"),
  scoreNumber: document.getElementById("scoreNumber"),
  scoreVerdict: document.getElementById("scoreVerdict"),
  subscoresGrid: document.getElementById("subscoresGrid"),
  missingKeywords: document.getElementById("missingKeywords"),
  matchedKeywords: document.getElementById("matchedKeywords"),
  diagnosticsList: document.getElementById("diagnosticsList"),
  copyPromptBtn: document.getElementById("copyPromptBtn"),
  aiProvider: document.getElementById("aiProvider"),
  aiApiKey: document.getElementById("aiApiKey"),
  runAiBtn: document.getElementById("runAiBtn"),
  aiOutput: document.getElementById("aiOutput"),
  toast: document.getElementById("toast")
};

let lastAnalysis = null;

function showToast(msg) {
  elements.toast.textContent = msg;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function updateCounts() {
  const rWords = elements.resumeInput.value.trim() ? elements.resumeInput.value.trim().split(/\s+/).length : 0;
  const jWords = elements.jdInput.value.trim() ? elements.jdInput.value.trim().split(/\s+/).length : 0;
  elements.resumeStats.textContent = `${rWords} words`;
  elements.jdStats.textContent = `${jWords} words`;
}

function normalizeText(str) {
  return str.toLowerCase().replace(/[\r\n]+/g, " ");
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(textLower, keyword) {
  if (keyword.includes("/") || keyword.includes(".") || keyword.includes("+") || keyword.includes("#")) {
    return textLower.includes(keyword);
  }
  const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
  return regex.test(textLower);
}

function extractJDKeywords(jdText) {
  const jdLower = normalizeText(jdText);
  const foundSkills = new Set();

  for (const skill of KNOWN_MULTIWORD_SKILLS) {
    if (containsKeyword(jdLower, skill)) {
      foundSkills.add(skill);
    }
  }

  // Extract frequent single domain words not in stopwords
  const tokens = jdLower.match(/[a-z][a-z0-9+#.-]{2,}/g) || [];
  const freq = {};
  for (const raw of tokens) {
    const clean = raw.replace(/^[.-]+|[.-]+$/g, "");
    if (!clean || clean.length < 3 || STOPWORDS.has(clean) || /^\d+$/.test(clean)) continue;
    freq[clean] = (freq[clean] || 0) + 1;
  }

  const rankedSingle = Object.entries(freq)
    .filter(([word, count]) => count >= 2 || KNOWN_MULTIWORD_SKILLS.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([word]) => word);

  for (const word of rankedSingle) {
    // Avoid adding single word if already covered by multiword phrase
    const covered = Array.from(foundSkills).some(s => s.split(/\s+/).includes(word));
    if (!covered) {
      foundSkills.add(word);
    }
  }

  return Array.from(foundSkills).slice(0, 28);
}

function analyzeBullets(resumeText) {
  const lines = resumeText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => /^[-•*]/.test(l) || (l.length > 35 && /\s/.test(l) && !/^(summary|experience|skills|education|projects)/i.test(l)));

  const metricRegex = /(\d+%|\$\d+|\d+x|\b\d+[kmb]?\b|\b\d+\s*(ms|sec|seconds|minutes|hours|days|users|requests|rps)\b)/i;

  let quantifiedCount = 0;
  let strongVerbCount = 0;
  const weakBullets = [];

  for (const line of lines) {
    const cleanLine = line.replace(/^[-•*]\s*/, "");
    const lower = cleanLine.toLowerCase();

    if (metricRegex.test(cleanLine)) {
      quantifiedCount++;
    }

    const firstWord = lower.split(/\s+/)[0].replace(/[^a-z]/g, "");
    if (STRONG_VERBS.includes(firstWord)) {
      strongVerbCount++;
    }

    const matchedWeak = WEAK_PHRASES.find(p => lower.includes(p));
    if (matchedWeak) {
      weakBullets.push({ line: cleanLine, phrase: matchedWeak });
    }
  }

  const totalBullets = Math.max(lines.length, 1);
  const quantRatio = Math.min(quantifiedCount / totalBullets, 1);
  const verbRatio = Math.min(strongVerbCount / totalBullets, 1);

  return {
    totalBullets: lines.length,
    quantifiedCount,
    quantScore: Math.round(Math.min(quantRatio / 0.55, 1) * 100), // 55%+ quantified bullets = 100%
    verbScore: Math.round(Math.min(verbRatio / 0.65, 1) * 100),  // 65%+ strong verbs = 100%
    weakBullets
  };
}

function analyzeStructure(resumeText) {
  const lower = resumeText.toLowerCase();
  const checks = {
    email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText),
    experience: /(experience|employment|work history)/i.test(lower),
    skills: /(skills|technologies|tech stack|competencies)/i.test(lower),
    education: /(education|university|b\.s\.|m\.s\.|bachelor|master|degree)/i.test(lower),
    links: /(github\.com|linkedin\.com|https?:\/\/)/i.test(lower)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passed / Object.keys(checks).length) * 100);
  return { checks, score };
}

function runAnalysis() {
  const resumeText = elements.resumeInput.value.trim();
  const jdText = elements.jdInput.value.trim();

  if (!resumeText || !jdText) {
    showToast("Paste both your resume and job description first.");
    return;
  }

  const resumeLower = normalizeText(resumeText);
  const jdKeywords = extractJDKeywords(jdText);

  const matched = [];
  const missing = [];

  for (const kw of jdKeywords) {
    if (containsKeyword(resumeLower, kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const keywordScore = jdKeywords.length > 0
    ? Math.round((matched.length / jdKeywords.length) * 100)
    : 70;

  const bulletAudit = analyzeBullets(resumeText);
  const structureAudit = analyzeStructure(resumeText);

  const overallScore = Math.round(
    keywordScore * 0.5 +
    bulletAudit.quantScore * 0.2 +
    bulletAudit.verbScore * 0.15 +
    structureAudit.score * 0.15
  );

  lastAnalysis = {
    overallScore,
    keywordScore,
    matched,
    missing,
    bulletAudit,
    structureAudit,
    resumeText,
    jdText
  };

  renderResults(lastAnalysis);
}

function getColorForScore(score) {
  if (score >= 75) return "var(--green)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

function renderResults(res) {
  elements.resultsSection.classList.add("visible");

  // Gauge animation (circumference for r=58 is ~364.4)
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (res.overallScore / 100) * circumference;
  elements.scoreGaugeFill.style.strokeDasharray = `${circumference}`;
  elements.scoreGaugeFill.style.strokeDashoffset = `${offset}`;
  elements.scoreGaugeFill.style.stroke = getColorForScore(res.overallScore);
  elements.scoreNumber.textContent = `${res.overallScore}%`;
  elements.scoreNumber.style.color = getColorForScore(res.overallScore);

  if (res.overallScore >= 80) {
    elements.scoreVerdict.textContent = "Strong ATS Match";
  } else if (res.overallScore >= 60) {
    elements.scoreVerdict.textContent = "Needs Keyword Tuning";
  } else {
    elements.scoreVerdict.textContent = "High Rejection Risk";
  }

  // Subscores
  const subscores = [
    { label: "Keyword Alignment (50%)", val: res.keywordScore },
    { label: "Quantified Impact (20%)", val: res.bulletAudit.quantScore },
    { label: "Action Verb Power (15%)", val: res.bulletAudit.verbScore },
    { label: "ATS Structure & Sections (15%)", val: res.structureAudit.score }
  ];

  elements.subscoresGrid.innerHTML = subscores.map(s => `
    <div class="subscore-card">
      <div class="subscore-top">
        <span>${s.label}</span>
        <span style="color:${getColorForScore(s.val)}">${s.val}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-bar" style="width:${s.val}%; background:${getColorForScore(s.val)}"></div>
      </div>
    </div>
  `).join("");

  // Keywords
  elements.missingKeywords.innerHTML = res.missing.length
    ? res.missing.map(k => `<span class="chip chip-missing" title="Click to copy" data-kw="${k}">+ ${k}</span>`).join("")
    : `<span class="chip chip-matched">No major keywords missing!</span>`;

  elements.matchedKeywords.innerHTML = res.matched.length
    ? res.matched.map(k => `<span class="chip chip-matched">✓ ${k}</span>`).join("")
    : `<span class="chip chip-missing">No exact matches detected yet</span>`;

  // Diagnostics
  const diags = [];
  if (res.missing.length > 0) {
    diags.push({
      type: "warn",
      text: `Missing ${res.missing.length} target keywords from the job description (${res.missing.slice(0, 6).join(", ")}). Integrate truthful matches into your Skills and Experience bullets.`
    });
  } else {
    diags.push({ type: "pass", text: "Excellent keyword coverage across the target job description." });
  }

  diags.push({
    type: res.bulletAudit.quantScore >= 70 ? "pass" : "warn",
    text: `Quantified Metrics: Found ${res.bulletAudit.quantifiedCount} measurable achievements across ${res.bulletAudit.totalBullets} detected lines. Aim for numbers (%, $, ms, scale) in at least half your bullets.`
  });

  if (res.bulletAudit.weakBullets.length > 0) {
    const sample = res.bulletAudit.weakBullets[0];
    diags.push({
      type: "warn",
      text: `Passive phrasing detected ("${sample.phrase}") in: "${sample.line.slice(0, 72)}...". Replace with strong ownership verbs (Engineered, Architected, Cut).`
    });
  } else {
    diags.push({ type: "pass", text: "Zero passive filler phrases ('responsible for', 'worked on') detected." });
  }

  const missingSections = Object.entries(res.structureAudit.checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  if (missingSections.length > 0) {
    diags.push({
      type: "warn",
      text: `Missing standard ATS metadata/sections: ${missingSections.join(", ")}. Keep headings standard so parsers extract them cleanly.`
    });
  } else {
    diags.push({ type: "pass", text: "All core ATS structural sections and contact markers detected." });
  }

  elements.diagnosticsList.innerHTML = diags.map(d => `<li class="diag-item ${d.type}">${d.text}</li>`).join("");

  // Populate default tailored prompt preview
  elements.aiOutput.textContent = buildTailoredPrompt(res);

  elements.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildTailoredPrompt(res) {
  const weakList = res.bulletAudit.weakBullets.map(b => `- ${b.line}`).join("\n") || "- (Rewrite top 3 bullets for maximum measurable impact)";
  return `You are an expert Technical Recruiter and ATS Optimization Specialist.

My current ATS match score is ${res.overallScore}%.
MISSING KEYWORDS TO INTEGRATE (only where truthful to my background):
${res.missing.join(", ") || "None"}

WEAK OR UNQUANTIFIED BULLETS TO UPGRADE:
${weakList}

RESUME EXCERPT:
${res.resumeText.slice(0, 2800)}

TARGET JOB DESCRIPTION:
${res.jdText.slice(0, 2200)}

TASK:
1. Rewrite 4 high-impact Experience bullet points using the Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]") incorporating the missing keywords truthfully.
2. Provide a 3-sentence tailored Professional Summary aligned with this role.
3. Draft a concise 120-word cold outreach message to the Hiring Manager.`;
}

async function runLiveAiRewrite() {
  if (!lastAnalysis) {
    runAnalysis();
    if (!lastAnalysis) return;
  }

  const provider = elements.aiProvider.value;
  const apiKey = elements.aiApiKey.value.trim();

  if (!apiKey) {
    showToast("Enter a free Groq or OpenRouter key, or use 'Copy AI Prompt' for free.");
    return;
  }

  localStorage.setItem("ats_radar_provider", provider);
  localStorage.setItem("ats_radar_apikey", apiKey);

  const endpoint = provider === "groq"
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  const model = provider === "groq"
    ? "llama-3.3-70b-versatile"
    : "meta-llama/llama-3.3-70b-instruct:free";

  elements.runAiBtn.disabled = true;
  elements.runAiBtn.textContent = "Generating...";
  elements.aiOutput.textContent = `Calling ${provider.toUpperCase()} (${model}) directly from your browser...`;

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 1100,
        messages: [
          { role: "system", content: "You are a precise, no-fluff engineering resume optimizer." },
          { role: "user", content: buildTailoredPrompt(lastAnalysis) }
        ]
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error?.message || `HTTP ${resp.status}`);
    }

    const content = data.choices?.[0]?.message?.content || "No output returned.";
    elements.aiOutput.textContent = content;
    showToast("AI Rewrite complete!");
  } catch (err) {
    elements.aiOutput.textContent = `Error: ${err.message}\n\nTip: You can still click "Copy Tailored Prompt" above and paste it into ChatGPT or Claude for $0.`;
  } finally {
    elements.runAiBtn.disabled = false;
    elements.runAiBtn.textContent = "Run Live AI Rewrite";
  }
}

async function handleFileUpload(file) {
  if (!file) return;
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    elements.resumeInput.value = await file.text();
    updateCounts();
    showToast(`Loaded ${file.name}`);
    return;
  }

  if (name.endsWith(".pdf")) {
    if (!window.pdfjsLib) {
      showToast("PDF parser still loading or offline. Paste resume text directly.");
      return;
    }
    try {
      showToast("Extracting PDF text locally...");
      const buffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(" ") + "\n";
      }
      elements.resumeInput.value = fullText.trim();
      updateCounts();
      showToast(`Extracted ${pdf.numPages} page(s) from PDF locally.`);
    } catch (err) {
      showToast(`Could not parse PDF: ${err.message}`);
    }
    return;
  }

  showToast("Supported formats: .pdf, .txt, .md");
}

function initMonetizationLinks() {
  const proBtn = document.getElementById("proPackBtn");
  const infraBtn = document.getElementById("infraDirBtn");
  const doBtn = document.getElementById("doPromoBtn");
  const railwayBtn = document.getElementById("railwayPromoBtn");

  if (proBtn) {
    proBtn.href = MONETIZATION_CONFIG.proPackUrl;
    proBtn.textContent = MONETIZATION_CONFIG.proPackLabel;
  }
  if (infraBtn) infraBtn.href = MONETIZATION_CONFIG.infraDirectoryUrl;
  if (doBtn) doBtn.href = MONETIZATION_CONFIG.digitalOceanRef;
  if (railwayBtn) railwayBtn.href = MONETIZATION_CONFIG.railwayRef;
}

function init() {
  initMonetizationLinks();

  const savedProvider = localStorage.getItem("ats_radar_provider");
  const savedKey = localStorage.getItem("ats_radar_apikey");
  if (savedProvider) elements.aiProvider.value = savedProvider;
  if (savedKey) elements.aiApiKey.value = savedKey;

  elements.resumeInput.addEventListener("input", updateCounts);
  elements.jdInput.addEventListener("input", updateCounts);
  elements.analyzeBtn.addEventListener("click", runAnalysis);

  elements.loadSampleBtn.addEventListener("click", () => {
    elements.resumeInput.value = SAMPLE_RESUME;
    elements.jdInput.value = SAMPLE_JD;
    updateCounts();
    runAnalysis();
  });

  elements.clearAllBtn.addEventListener("click", () => {
    elements.resumeInput.value = "";
    elements.jdInput.value = "";
    elements.resultsSection.classList.remove("visible");
    updateCounts();
  });

  elements.resumeFile.addEventListener("change", (e) => {
    handleFileUpload(e.target.files[0]);
  });

  elements.missingKeywords.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-kw]");
    if (!chip) return;
    navigator.clipboard.writeText(chip.dataset.kw);
    showToast(`Copied keyword: "${chip.dataset.kw}"`);
  });

  elements.copyPromptBtn.addEventListener("click", () => {
    if (!lastAnalysis) {
      showToast("Run ATS Scan first.");
      return;
    }
    navigator.clipboard.writeText(elements.aiOutput.textContent);
    showToast("Copied tailored prompt / output to clipboard!");
  });

  elements.runAiBtn.addEventListener("click", runLiveAiRewrite);
  updateCounts();
}

document.addEventListener("DOMContentLoaded", init);
