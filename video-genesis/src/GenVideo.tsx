import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import words from "../public/words.json";

interface Word {
  text: string;
  start: number;
  end: number;
}

const TOTAL_IMAGES = 38;
const CUT_INTERVAL = 3; // frames = 0.1s at 30fps
const CTA_WORDS = ["act.", "act"];

export const GenVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Switch image every 3 frames (0.1s)
  const imageIndex = Math.floor(frame / CUT_INTERVAL) % TOTAL_IMAGES;
  const currentImage = `d${imageIndex}.jpg`;

  const currentWord: Word | null =
    (words as Word[]).find(
      (w) => currentTime >= w.start && currentTime <= w.end
    ) ?? null;

  const wordProgress = currentWord
    ? (currentTime - currentWord.start) / (currentWord.end - currentWord.start)
    : 0;

  const scale = currentWord
    ? interpolate(wordProgress, [0, 0.3], [0.7, 1], {
        extrapolateRight: "clamp",
      })
    : 1;

  const opacity = currentWord
    ? interpolate(wordProgress, [0, 0.1, 0.8, 1], [0, 1, 1, 0], {
        extrapolateRight: "clamp",
      })
    : 0;

  const isCTA =
    currentWord &&
    CTA_WORDS.includes(currentWord.text.toLowerCase());

  const fontSize =
    currentWord && currentWord.text.length > 10
      ? 64
      : currentWord && currentWord.text.length > 7
      ? 78
      : 90;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background image - rapid cuts */}
      <AbsoluteFill>
        <Img
          src={staticFile(currentImage)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Film grain SVG filter */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            seed={frame % 10}
          />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          filter: "url(#grain)",
          opacity: 0.06,
          mixBlendMode: "overlay",
        }}
      />

      {/* Word subtitle */}
      {currentWord && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              opacity,
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontStyle: "italic",
              fontSize,
              fontWeight: "bold",
              color: isCTA ? "#FF2020" : "#F2E48C",
              textTransform: "uppercase",
              textAlign: "center",
              textShadow: "0 4px 24px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)",
              letterSpacing: 2,
              padding: "0 40px",
            }}
          >
            {currentWord.text}
          </div>
        </AbsoluteFill>
      )}

      {/* Cross watermark */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 30,
          fontSize: 32,
          color: "rgba(255,255,255,0.15)",
        }}
      >
        ✟
      </div>

      {/* Audio */}
      <Audio src={staticFile("voiceover.mp3")} />
    </AbsoluteFill>
  );
};
