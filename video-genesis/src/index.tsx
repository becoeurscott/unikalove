import {registerRoot} from "remotion";
import {Composition, staticFile} from "remotion";
import {GenVideo} from "./GenVideo";
import words from "../public/words.json";

const FPS = 30;
const lastWord = words[words.length - 1];
const DURATION_S = Math.ceil(lastWord.end) + 2;
const DURATION_FRAMES = Math.ceil(DURATION_S * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="GenVideo"
      component={GenVideo}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={720}
      height={1280}
    />
  );
};

registerRoot(RemotionRoot);
