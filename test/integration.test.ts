import constants from "../constants.json" assert { type: "json" };
import { basename, fromFileUrl, join } from "std/path/mod.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
} from "std/testing/asserts.ts";
import { TEST_FILE_PATH, withTempDir } from "./util.ts";

const { SUPPORTED_DENO_VERSION, SUPPORTED_MKVTOOLNIX_VERSION } = constants;

const SCRIPT_PATH = fromFileUrl(import.meta.resolve("../dist/mkvsubs.js"));

Deno.test("end-to-end", async () => {
  await checkVersions();
  await withTempDir(async (tempDirPath) => {
    const scriptLocation = await install(tempDirPath);
    await checkUsage(scriptLocation);
    await listTracks(scriptLocation);
    await extractTracks(scriptLocation);
  });
});

async function checkVersions() {
  const denoPath = Deno.execPath();
  let cmd = Deno.run({ cmd: [denoPath, "--version"], stdout: "piped" });
  let out = await cmd.output();
  cmd.close();

  const td = new TextDecoder();
  let outText = td.decode(out);
  const denoVersionRe = /^deno ([.0-9]+)/;
  const justVersion = denoVersionRe.exec(outText)![1];

  if (justVersion !== SUPPORTED_DENO_VERSION) {
    console.warn(`installed deno version: ${justVersion}
supported version: ${SUPPORTED_DENO_VERSION}`);
  }

  cmd = Deno.run({
    cmd: ["mkvmerge", "--version"],
    stdout: "piped",
  });
  out = await cmd.output();
  cmd.close();

  outText = td.decode(out);
  const mkvMergeVersion = outText.split(" ")[1];
  if (mkvMergeVersion !== SUPPORTED_MKVTOOLNIX_VERSION) {
    console.warn(`installed mkvmerge version: ${mkvMergeVersion}
supported version: ${SUPPORTED_MKVTOOLNIX_VERSION}`);
  }

  cmd = Deno.run({
    cmd: ["mkvextract", "--version"],
    stdout: "piped",
  });
  out = await cmd.output();
  cmd.close();

  outText = td.decode(out);
  const mkvExtractVersion = outText.split(" ")[1];
  if (mkvExtractVersion !== SUPPORTED_MKVTOOLNIX_VERSION) {
    console.warn(`installed mkvextract version: ${mkvExtractVersion}
supported version: ${SUPPORTED_MKVTOOLNIX_VERSION}`);
  }
}

type InstallPath = string;
async function install(tempDirPath: string): Promise<InstallPath> {
  const scriptInfo = await Deno.stat(SCRIPT_PATH);
  if (!scriptInfo.isFile) {
    throw `no bundle found at ${SCRIPT_PATH}: please make it before running tests`;
  }

  const denoPath = Deno.execPath();
  const cmd = Deno.run({
    cmd: [
      denoPath,
      "install",
      "--allow-read",
      "--allow-write",
      "--allow-run=mkvmerge,mkvextract",
      "--root",
      tempDirPath,
      SCRIPT_PATH,
    ],
  });
  const { success, code } = await cmd.status();
  cmd.close();
  if (!success) {
    throw `deno install failed with code ${code}`;
  }

  return join(tempDirPath, "bin", "mkvsubs");
}

async function checkUsage(scriptLocation: string) {
  const cmd = Deno.run({ cmd: [scriptLocation], stderr: "piped" });
  const err = await cmd.stderrOutput();
  cmd.close();

  const td = new TextDecoder();
  const errText = td.decode(err);
  assertStrictEquals(
    errText,
    `usage: mkvsubs [ALL | space-separated languages] [file]
`,
  );
}

async function listTracks(scriptLocation: string) {
  const cmd = Deno.run({
    cmd: [scriptLocation, TEST_FILE_PATH],
    stdout: "piped",
    stderr: "piped",
  });

  const [{ success }, out, err] = await Promise.all([
    cmd.status(),
    cmd.output(),
    cmd.stderrOutput(),
  ]);
  cmd.close();
  assert(success);
  assertEquals(err, new Uint8Array());

  const te = new TextEncoder();
  assertEquals(out, te.encode(PRINTTRACKS_EXPECTED));
}

async function extractTracks(scriptLocation: string) {
  const tempDirPath = await Deno.makeTempDir();

  const testFileName = basename(TEST_FILE_PATH);
  const tempTestFilePath = join(tempDirPath, testFileName);
  await Deno.copyFile(TEST_FILE_PATH, tempTestFilePath);

  const cmd = Deno.run({
    cmd: [scriptLocation, "ALL", tempTestFilePath],
    stdout: "piped",
    stderr: "piped",
  });
  const [{ success }, out, err] = await Promise.all([
    cmd.status(),
    cmd.output(),
    cmd.stderrOutput(),
  ]);
  cmd.close();
  assert(success);
  assertEquals(err, new Uint8Array());

  const te = new TextEncoder();
  const expectedEncoded = te.encode(EXTRACTTRACKS_ALL_EXPECTED);
  // we only check the output of mkvsubs itself,
  // and not the piped output of mkvextract
  assertEquals(out.slice(0, expectedEncoded.length), expectedEncoded);

  await Deno.remove(tempTestFilePath);
  const tempDirContent = [];
  for await (const { name } of Deno.readDir(tempDirPath)) {
    tempDirContent.push(name);
  }
  tempDirContent.sort();
  assertEquals(tempDirContent, ALLFILES_EXPECTED);
}

export const PRINTTRACKS_EXPECTED = `detected the following subtitle tracks:
2 - SRT - eng
3 - SRT - hun
4 - SRT - ger
5 - SRT - fre
6 - SRT - spa
7 - SRT - ita
9 - SRT - jpn
10 - SRT - und
`;

export const EXTRACTTRACKS_ALL_EXPECTED = `extracting the following tracks:
2 - SRT - eng
3 - SRT - hun
4 - SRT - ger
5 - SRT - fre
6 - SRT - spa
7 - SRT - ita
9 - SRT - jpn
10 - SRT - und
`;

export const ALLFILES_EXPECTED = [
  "test5.mkv.2.eng.srt",
  "test5.mkv.3.hun.srt",
  "test5.mkv.4.ger.srt",
  "test5.mkv.5.fre.srt",
  "test5.mkv.6.spa.srt",
  "test5.mkv.7.ita.srt",
  "test5.mkv.9.jpn.srt",
  "test5.mkv.10.und.srt",
].sort();
