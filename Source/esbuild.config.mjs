import esbuild from "esbuild";
/** @type { esbuild.BuildOptions } */
const options = {
    format: "esm",
    bundle: true,
    keepNames: true,
    target: ["es2021"],
    platform: "neutral",
    entryPoints: ["src/main.ts"],
    outfile: "packs/bp/scripts/main.js",
    sourcemap: false,
    external: [
        "@minecraft/server",
        "@minecraft/server-ui"
    ],
    logLevel: "info"
};

esbuild.build(options);