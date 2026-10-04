import { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { LOGO_CENTER, LOGO_SEGMENTS, posePoints, segmentCentroid, type PoseName } from "../lib/logo";

/** 6パーツを実際に押し出した立体ジオメトリ（平面SVGの傾きではない） */
function segmentGeometry(pose: PoseName, i: number, depth: number): THREE.ExtrudeGeometry {
  const p = posePoints(pose, i);
  // SVG(y-down) → three(y-up)、輪の中心を原点へ
  const v = (q: [number, number]) => new THREE.Vector2(q[0] - LOGO_CENTER[0], -(q[1] - LOGO_CENTER[1]));
  const s = new THREE.Shape();
  s.moveTo(v(p[0]).x, v(p[0]).y);
  s.bezierCurveTo(v(p[1]).x, v(p[1]).y, v(p[2]).x, v(p[2]).y, v(p[3]).x, v(p[3]).y);
  s.lineTo(v(p[4]).x, v(p[4]).y);
  s.bezierCurveTo(v(p[5]).x, v(p[5]).y, v(p[6]).x, v(p[6]).y, v(p[7]).x, v(p[7]).y);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 2.5,
    bevelSize: 2,
    bevelSegments: 3,
    curveSegments: 48,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

export type Logo3DProps = {
  /** ラジアン */
  rx: number;
  ry: number;
  rz: number;
  /** 画面上の中心（px）と大きさ（輪の外径 px） */
  x: number;
  y: number;
  size: number;
  depth?: number;
  /** パーツの分離（viewBox 単位、放射方向） */
  explode?: number;
  opacity?: number;
  /** 画面面内の回転（ラジアン）。傾けた輪の投影楕円の向きに使う */
  screenRz?: number;
  /** 面の明るさを保つための自己発光（0..1） */
  glow?: number;
};

export function Logo3D(props: Logo3DProps) {
  const depth = props.depth ?? 46;
  const geoms = useMemo(
    () => Array.from({ length: LOGO_SEGMENTS }, (_, i) => segmentGeometry("loop", i, depth)),
    [depth],
  );
  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: "#F5F3EC", roughness: 0.42, metalness: 0.15, emissive: "#F5F3EC", emissiveIntensity: 0.18 }),
      new THREE.MeshStandardMaterial({ color: "#FF4D24", roughness: 0.5, metalness: 0.1 }),
    ],
    [],
  );
  // 正射影カメラ：px と three 単位を一致させ、配置を2Dの演出と揃える
  const k = props.size / 310;
  return (
    <ThreeCanvas
      width={1920}
      height={1080}
      orthographic
      flat
      camera={{ left: -960, right: 960, top: 540, bottom: -540, near: -2000, far: 2000, position: [0, 0, 1000], zoom: 1 }}
      style={{ position: "absolute", left: 0, top: 0, opacity: props.opacity }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[-400, 600, 900]} intensity={1.6} />
      <directionalLight position={[700, -300, 300]} intensity={0.35} color="#FF4D24" />
      <group position={[props.x - 960, -(props.y - 540), 0]} rotation={[0, 0, props.screenRz ?? 0]}>
      <group rotation={[props.rx, props.ry, props.rz]} scale={[k, k, k]}>
        {geoms.map((g, i) => {
          const [cx, cy] = segmentCentroid(posePoints("loop", i));
          const dir = new THREE.Vector2(cx - LOGO_CENTER[0], -(cy - LOGO_CENTER[1])).normalize();
          const e = props.explode ?? 0;
          return (
            <mesh key={i} geometry={g} material={materials} position={[dir.x * e, dir.y * e, 0]} />
          );
        })}
      </group>
      </group>
    </ThreeCanvas>
  );
}
