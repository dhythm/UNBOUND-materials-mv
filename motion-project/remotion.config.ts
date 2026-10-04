import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// WebGL（3Dロゴ）をヘッドレスで安定して描くため
Config.setChromiumOpenGlRenderer("angle");
