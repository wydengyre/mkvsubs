import { fromFileUrl } from "std/path/mod.ts";

const CID_PATH = "mkvsubs.build.cid";

async function main() {
  await run("docker", "run", "--cidfile", CID_PATH, "mkvsubs-build");
  const cid = await Deno.readTextFile(CID_PATH);
  await Deno.remove(CID_PATH);
  await Deno.mkdir("dist", { recursive: true });
  await run(
    "docker",
    "cp",
    `${cid}:/mkvsubs/dist/mkvsubs.js`,
    "dist/mkvsubs.js",
  );
}

// TODO: timeout support
async function run(bin: string, ...args: string[]) {
  const cwd = fromFileUrl(import.meta.resolve("./.."));
  const command = new Deno.Command(bin, { args, cwd });
  const child = command.spawn();
  const { success, code } = await child.status;
  if (!success) {
    throw `${bin} ${args} failed with code ${code}`;
  }
}

if (import.meta.main) {
  await main();
}
