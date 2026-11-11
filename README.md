# ATS-Radar

**100% Client-Side, Privacy-First ATS Resume & Job Match Analyzer.**

Live Web App: **[https://dhaulagani.github.io/ats-radar/](https://dhaulagani.github.io/ats-radar/)**

## Why ATS-Radar?
Most online resume scanners trap users behind $29/month subscriptions and store sensitive resume PDFs on third-party servers. ATS-Radar runs **100% inside your browser** with zero backend uploads:

- **Deterministic Keyword & Stack Extraction**: Matches technical phrases (`Next.js`, `PostgreSQL`, `CI/CD`, `Kubernetes`, `gRPC`, etc.) and frequency-ranked job requirements.
- **Quantified Impact Audit**: Detects measurable metrics (`%`, `$`, latency, throughput) across bullet points.
- **Action Verb & Structure Diagnostics**: Flags passive filler phrases (`responsible for`, `worked on`) and checks ATS-parseable headings.
- **Local PDF Parsing**: Extracts text from `.pdf`, `.txt`, and `.md` resumes directly in browser memory.
- **Zero-Cost AI Tailoring**: Generates a tailored prompt ready for ChatGPT/Claude in 1 click, or connects directly from your browser to free **Groq** / **OpenRouter** APIs using your own key (`localStorage` only).

## Local Usage
Open `index.html` in any modern browser or serve statically:
```bash
python -m http.server 8000
```

## License
MIT
