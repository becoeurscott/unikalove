import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import words from "../public/words.json";

type Word = { text: string; start: number; end: number };
const allWords: Word[] = words as Word[];

// Scene backgrounds - dark cinematic gradients that shift per section
const SCENES: { startTime: number; bg: string }[] = [
  { startTime: 0, bg: "radial-gradient(ellipse at 50% 40%, #1a1005 0%, #080402 60%, #000 100%)" },
  { startTime: 10, bg: "radial-gradient(ellipse at 30% 50%, #0a0a18 0%, #030308 60%, #000 100%)" },
  { startTime: 20, bg: "radial-gradient(ellipse at 70% 30%, #12080a 0%, #050203 60%, #000 100%)" },
  { startTime: 30, bg: "radial-gradient(ellipse at 40% 60%, #0a1008 0%, #030502 60%, #000 100%)" },
  { startTime: 40, bg: "radial-gradient(ellipse at 60% 40%, #100808 0%, #050202 60%, #000 100%)" },
  { startTime: 50, bg: "radial-gradient(ellipse at 50% 50%, #0d0d18 0%, #030310 60%, #000 100%)" },
  { startTime: 58, bg: "radial-gradient(ellipse at 50% 50%, #1a0a0a 0%, #0a0202 60%, #000 100%)" },
];

const CTA_WORDS = ["agis."];

export const GenVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Get current scene background
  let currentBg = SCENES[0].bg;
  for (const scene of SCENES) {
    if (currentTime >= scene.startTime) currentBg = scene.bg;
  }

  // Find current word
  let currentWord: Word | null = null;
  for (const w of allWords) {
    if (currentTime >= w.start && currentTime <= w.end + 0.15) {
      currentWord = w;
    }
  }

  // Vignette overlay
  const vignetteStyle: React.CSSProperties = {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)",
    pointerEvents: "none",
  };

  // Subtle animated grain
  const grainOpacity = 0.04 + Math.sin(frame * 0.3) * 0.02;

  // Word display
  const wordText = currentWord?.text?.replace(/[.,!?;:]/g, "") || "";
  const rawText = currentWord?.text || "";
  const isCTA = CTA_WORDS.some((c) => rawText.toLowerCase().includes(c.toLowerCase()));

  // Scale animation on word appearance
  const wordProgress = currentWord
    ? interpolate(
        currentTime,
        [currentWord.start, currentWord.start + 0.08],
        [0.7, 1],
        { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      )
    : 1;

  const wordOpacity = currentWord
    ? interpolate(
        currentTime,
        [currentWord.start, currentWord.start + 0.05, currentWord.end + 0.1, currentWord.end + 0.15],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Scene background */}
      <AbsoluteFill style={{ background: currentBg, opacity: 0.9 }} />

      {/* Vignette */}
      <div style={vignetteStyle} />

      {/* Film grain */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          opacity: grainOpacity,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />

      {/* Cross icon watermark */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0, right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: 0.12,
          fontSize: 36,
          color: "#F2E48C",
          fontFamily: "serif",
          letterSpacing: 8,
        }}
      >
        ✟
      </div>

      {/* Word subtitle - centered */}
      {currentWord && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 40px",
          }}
        >
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: wordText.length > 12 ? 64 : wordText.length > 8 ? 78 : 90,
              textTransform: "uppercase",
              color: isCTA ? "#FF2020" : "#F2E48C",
              textShadow: isCTA
                ? "0 0 30px rgba(255,32,32,0.6), 3px 3px 6px rgba(0,0,0,0.9)"
                : "3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)",
              transform: `scale(${wordProgress})`,
              opacity: wordOpacity,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {wordText.toUpperCase()}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0, right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: 0.25,
        }}
      >
        <div
          style={{
            width: 60,
            height: 2,
            background: "linear-gradient(90deg, transparent, #F2E48C, transparent)",
          }}
        />
      </div>

      {/* Audio */}
      <Audio src={staticFile("voiceover.mp3")} />
    </AbsoluteFill>
  );
};
