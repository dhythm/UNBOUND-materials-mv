import { Composition } from "remotion";
import "./fonts";
import { Lab } from "./Lab";
import { Prototype, PROTO_FRAMES } from "./Prototype";
import { Unbound } from "./unbound/Unbound";
import { DURATION, FPS, HEIGHT, WIDTH } from "./lib/time";

export function RemotionRoot() {
  return (
    <>
      <Composition id="Unbound" component={Unbound} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="Prototype" component={Prototype} durationInFrames={PROTO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="Lab" component={Lab} durationInFrames={2} fps={FPS} width={WIDTH} height={HEIGHT} />
    </>
  );
}
