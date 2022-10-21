import { fromFileUrl } from "std/path/mod.ts";
import { emptyDir } from "std/fs/mod.ts";

export const TEST_FILE_PATH = fromFileUrl(import.meta.resolve(
  "../deps/matroska-test-files/matroska-test-files-e6965e5ca666322ed93e2748a10a4f132309e005/test_files/test5.mkv",
));

export async function withTempDir(
  f: (tempDirPath: string) => Promise<void>,
) {
  const tempDirPath = await Deno.makeTempDir();
  try {
    await f(tempDirPath);
  } catch (e) {
    throw e;
  } finally {
    await emptyDir(tempDirPath);
  }
}
