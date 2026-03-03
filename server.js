const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// ✅ Simple PGN Parser
function parsePGN(pgnText) {
  const cleaned = pgnText.replace(/\[.*?\]/g, "").trim();
  const moveList = cleaned.split(/\s+/).filter((m) => /^[a-hO1-8KQRBNx\-=+#!?]{2,}/.test(m));
  return moveList;
}

// ✅ Simulate Stockfish Analysis (Mock for now, can integrate real Stockfish later)
function analyzeWithStockfish(pgn) {
  const moves = parsePGN(pgn);
  
  // Mock analysis data — replace with real Stockfish calls later
  const analysisData = moves.map((move, idx) => {
    const evals = ["+0.2", "+0.5", "-0.3", "+0.1", "-0.5"];
    const bestMoves = ["e4", "c4", "d4", "Nf3", "e5"];
    const isInaccuracy = Math.random() > 0.7;
    const isMistake = Math.random() > 0.9;

    return {
      move: move,
      eval: evals[idx % evals.length],
      bestMove: bestMoves[idx % bestMoves.length],
      inaccuracy: isInaccuracy,
      mistake: isMistake,
      comment: isInaccuracy
        ? `Inaccuracy. ${bestMoves[idx % bestMoves.length]} was better.`
        : isMistake
        ? `Blunder! Should play ${bestMoves[idx % bestMoves.length]}.`
        : "Good move.",
      bestContinuation: `${bestMoves[idx % bestMoves.length]} ${bestMoves[(idx + 1) % bestMoves.length]}`,
    };
  });

  // Calculate accuracy
  const whiteAccuracy =
    100 - (analysisData.filter((m, i) => i % 2 === 0 && m.inaccuracy).length / Math.ceil(moves.length / 2)) * 10;
  const blackAccuracy =
    100 - (analysisData.filter((m, i) => i % 2 === 1 && m.inaccuracy).length / Math.floor(moves.length / 2)) * 10;

  return {
    whiteAccuracy: Math.max(70, Math.min(100, whiteAccuracy.toFixed(1))),
    blackAccuracy: Math.max(70, Math.min(100, blackAccuracy.toFixed(1))),
    moves: analysisData,
    puzzles: [
      {
        description: "Find the best move in this position.",
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      },
      {
        description: "Avoid the trap!",
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq e6 0 1",
      },
    ],
  };
}

// ✅ API Route: Analyze Game
app.post("/api/analyze", (req, res) => {
  const { pgn } = req.body;

  if (!pgn || pgn.trim() === "") {
    return res.status(400).json({ error: "No PGN provided." });
  }

  try {
    const analysis = analyzeWithStockfish(pgn);
    res.json(analysis);
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: "Failed to analyze game." });
  }
});

// ✅ Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running! ✅" });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🔥 Thabiso Chess Backend running on port ${PORT}`);
  console.log(`📊 Analyze endpoint: POST /api/analyze`);
});