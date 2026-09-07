# RV32 Assembler Backend (free tier — Google Gemini)

Small Express server that powers the "Natural Language -> Assembly" tool in the
RV32 RISC-V Assembler website. Uses Google Gemini's free API tier — no billing
required. It exposes one endpoint:

    POST /api/generate
    body: { "prompt": "load 10 into x5, add x6, store in x7" }
    returns: { "asm": "addi x5, x0, 10\naddi x5, x5, x6\nsw x7, 0(x5)", "explanation": "..." }

## Get a free API key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account (no credit card, no billing setup needed).
3. Click "Create API key". Copy it.
4. The free tier gives a generous daily quota on gemini-2.0-flash — plenty for
   this kind of tool. If you ever outgrow it, you can add billing later, but
   you don't need to.

## Run locally

    npm install
    cp .env.example .env      # then paste your Gemini API key into .env
    npm start

Server starts on http://localhost:3000 by default.
Test it:

    curl -X POST http://localhost:3000/api/generate \
      -H "Content-Type: application/json" \
      -d '{"prompt": "add x1 and x2, store result in x3"}'

## Deploy to Render (free)

1. Push this folder to a GitHub repo.
2. Go to render.com -> New -> Web Service -> connect the repo.
3. Build command: `npm install`   Start command: `npm start`
4. Add environment variable `GEMINI_API_KEY` with your key in the Render dashboard.
5. Deploy. Render gives you a URL like `https://your-app.onrender.com`.
6. Paste that URL into the "Backend endpoint" field on the assembler site.

Never put your GEMINI_API_KEY in the frontend HTML/JS — it must stay
server-side only (that's the whole reason this backend exists).
