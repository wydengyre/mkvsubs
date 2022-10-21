import { assert } from "std/testing/asserts.ts";
import { join } from "std/path/mod.ts";
import { MkvExtract } from "./mkvextract.ts";
import { TEST_FILE_PATH, withTempDir } from "../test/util.ts";

Deno.test("extractSubs", () => withTempDir(testExtractSubs));

async function testExtractSubs(tempDirPath: string) {
  const frenchSubPath = join(tempDirPath, "fre.srt");
  const italianSubPath = join(tempDirPath, "ita.srt");

  const mkvextract = new MkvExtract();
  await mkvextract
    .extractSubs(TEST_FILE_PATH, [[5, frenchSubPath], [7, italianSubPath]]);

  const [frenchSubsInfo, italianSubsInfo] = await Promise.all([
    Deno.stat(frenchSubPath),
    Deno.stat(italianSubPath),
  ]);

  assert(frenchSubsInfo.isFile);
  assert(italianSubsInfo.isFile);
}
