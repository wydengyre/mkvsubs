import * as esbuild from "esbuild";
import * as path from "std/path/mod.ts";

const MAIN_PATH = path.fromFileUrl(import.meta.resolve("../src/main.ts"));
const OUT_PATH = path.fromFileUrl(import.meta.resolve("../dist/mkvsubs.js"));

async function main() {
  const outDir = path.dirname(OUT_PATH);
  await Deno.mkdir(outDir, { recursive: true });

  const denoBinPath = Deno.execPath();
  const cmd = new Deno.Command(denoBinPath, {
    args: ["bundle", MAIN_PATH],
    stdout: "piped",
  });
  const { success, code, stdout } = await cmd.output();
  if (!success) {
    throw `Failed to bundle: ${code}`;
  }

  const outText = new TextDecoder().decode(stdout);
  const cleanedImportMeta = cleanImportMeta(outText);

  const buildOptions: esbuild.TransformOptions = {
    treeShaking: true,
  };
  const build = await esbuild.transform(cleanedImportMeta, buildOptions);
  esbuild.stop();
  if (build.warnings.length > 0) {
    throw `Warnings from esbuild: ${build.warnings}`;
  }

  await Deno.writeTextFile(OUT_PATH, build.code);
}

// The Deno bundler unnecessarily adds an importMeta.url property that leaks details about the build path
function cleanImportMeta(bundledCode: string): string {
  const importMetaUrlRegex = /^const importMeta = {\n\s*url:.+,$/m;
  const found = importMetaUrlRegex.test(bundledCode);
  if (!found) {
    throw "Failed to find importMeta.url";
  }

  return bundledCode.replace(importMetaUrlRegex, "const importMeta = {");
}

if (import.meta.main) {
  await main();
}
