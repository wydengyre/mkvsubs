import { TEST_FILE_PATH, withTempDir } from "../test/util.ts";
import { go } from "./main.ts";
import { assertEquals } from "std/testing/asserts.ts";
import { Buffer } from "std/io/buffer.ts";
import { basename, join } from "std/path/mod.ts";
import {
  ALLFILES_EXPECTED,
  EXTRACTTRACKS_ALL_EXPECTED,
  PRINTTRACKS_EXPECTED,
} from "../test/constants.ts";

Deno.test("usage", async () => {
  const out = new Buffer();
  const err = new Buffer();
  await go(out, err, []);
  assertOutput(out, "");
  assertOutput(
    err,
    `usage: mkvsubs [ALL | space-separated languages] [file]
`,
  );
});

Deno.test("printTracks", async () => {
  const out = new Buffer();
  const err = new Buffer();
  await go(out, err, [TEST_FILE_PATH]);
  assertOutput(out, PRINTTRACKS_EXPECTED);
  assertOutput(err, "");
});

Deno.test("extractTracks [ALL]", () => withTempDir(testExtractAll));
Deno.test("extractTracks ger fre", () => withTempDir(testExtractGerFre));

async function testExtractAll(tempDirPath: string) {
  const testFileName = basename(TEST_FILE_PATH);
  const tempTestFilePath = join(tempDirPath, testFileName);
  await Deno.copyFile(TEST_FILE_PATH, tempTestFilePath);

  const out = new Buffer();
  const err = new Buffer();
  await go(out, err, ["ALL", tempTestFilePath]);
  assertOutput(out, EXTRACTTRACKS_ALL_EXPECTED);
  assertOutput(err, "");

  await Deno.remove(tempTestFilePath);
  const tempDirContent = [];
  for await (const { name } of Deno.readDir(tempDirPath)) {
    tempDirContent.push(name);
  }
  tempDirContent.sort();
  assertEquals(tempDirContent, ALLFILES_EXPECTED);
}

async function testExtractGerFre(tempDirPath: string) {
  const testFileName = basename(TEST_FILE_PATH);
  const tempTestFilePath = join(tempDirPath, testFileName);
  await Deno.copyFile(TEST_FILE_PATH, tempTestFilePath);

  const out = new Buffer();
  const err = new Buffer();
  await go(out, err, ["ger", "fre", tempTestFilePath]);
  assertOutput(out, EXTRACTTRACKS_GERFRE_EXPECTED);
  assertOutput(err, "");

  await Deno.remove(tempTestFilePath);
  const tempDirContent = [];
  for await (const { name } of Deno.readDir(tempDirPath)) {
    tempDirContent.push(name);
  }
  tempDirContent.sort();
  assertEquals(tempDirContent, GERFRE_EXPECTED);
}

function assertOutput(b: Buffer, e: string) {
  const te = new TextEncoder();
  const expected = te.encode(e);
  const outBytes = b.bytes({ copy: false });
  assertEquals(outBytes, expected);
}

const EXTRACTTRACKS_GERFRE_EXPECTED = `extracting the following tracks:
4 - SRT - ger
5 - SRT - fre
`;

const GERFRE_EXPECTED = [
  "test5.mkv.4.ger.srt",
  "test5.mkv.5.fre.srt",
].sort();
