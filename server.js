require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a RISC-V RV32I/M assembly code generator.
Given a plain-English description, output ONLY valid RV32I/M assembly instructions,
one per line, using register names like x0-x31.

You must support and correctly generate all RV32I/M instruction formats:
- R-type (e.g. add, sub, and, or, xor, sll, srl, sra, slt, sltu, mul, div, rem)
- I-type (e.g. addi, andi, ori, xori, slti, sltiu, lw, lh, lb, jalr)
- S-type (e.g. sw, sh, sb)
- B-type (e.g. beq, bne, blt, bge, bltu, bgeu)
- U-type (e.g. lui, auipc)
- J-type (e.g. jal)

Rules:
- Output raw instructions only. No comments, no markdown, no code fences.
- Use labels (e.g. "loop:", "done:") when the description implies loops or branches.
- After the instructions, on a new line starting with "EXPLAIN:", give one short
  plain-English sentence describing what the code does.
- If the description is ambiguous, make the most reasonable assumption and proceed
  — do not ask a follow-up question, this is a one-shot API.`;

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Missing "prompt" string in request body.' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server misconfigured: GEMINI_API_KEY is not set.' });
    }

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
      }),
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = geminiData?.error?.message || 'Gemini API request failed.';
      return res.status(geminiRes.status).json({ error: msg });
    }

    const raw = geminiData?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';

    const explainMatch = raw.match(/EXPLAIN:\s*([\s\S]*)/i);
    const explanation = explainMatch ? explainMatch[1].trim() : 'Generated assembly:';
    const asmPart = explainMatch ? raw.slice(0, explainMatch.index) : raw;
    const asm = asmPart
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');

    return res.json({ asm, explanation });
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`RV32 assembler backend listening on port ${PORT}`);
});
