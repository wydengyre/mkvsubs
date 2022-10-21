import { MkvMerge, Track } from "./mkvmerge.ts";
import { writeAll } from "std/streams/conversion.ts";
import { MkvExtract } from "./mkvextract.ts";

const USAGE = "usage: mkvsubs [ALL | space-separated languages] [file]";

function main(): Promise<void> {
  return go(Deno.stdout, Deno.stderr, [...Deno.args]);
}

export async function go(
  stdout: Deno.Writer,
  stderr: Deno.Writer,
  args: string[],
): Promise<void> {
  if (args.length === 0) {
    const te = new TextEncoder();
    const err = te.encode(USAGE + "\n");
    return writeAll(stderr, err);
  }

  // type system doesn't know that here args.length >= 1
  const mkvPath = args.pop() as string;
  if (args.length === 0) {
    const descriptions = await printTracks(mkvPath);
    const te = new TextEncoder();
    const out = te.encode(descriptions);
    return writeAll(stdout, out);
  }

  return extractTracks(stdout, mkvPath, args);
}

async function printTracks(mkvPath: string): Promise<string> {
  const mkvmerge = new MkvMerge();
  const subs = await mkvmerge.listSubs(mkvPath);

  if (subs.length === 0) {
    return "no supported subtitle tracks detected";
  }

  const trackInfo = subs.map((track) => formatTrack(track))
    .join("\n");
  return `detected the following subtitle tracks:
${trackInfo}
`;
}

async function extractTracks(
  out: Deno.Writer,
  mkvPath: string,
  langs: string[],
) {
  const mkvmerge = new MkvMerge();
  const subs = await mkvmerge.listSubs(mkvPath);

  const supportedSubs = subs.filter(({ codec }) => codec !== "UNSUPPORTED");

  const subsToExtract = (langs.length === 1 && langs[0] === "ALL")
    ? supportedSubs
    : (() => {
      const langSet = new Set<string | undefined>(langs);
      return supportedSubs.filter(({ language }) => langSet.has(language));
    })();

  const te = new TextEncoder();
  const trackInfo = subsToExtract.map((track) => formatTrack(track))
    .join("\n");
  const info = `extracting the following tracks:
${trackInfo}
`;
  const encodedInfo = te.encode(info);
  await writeAll(out, encodedInfo);

  const extractions = subsToExtract.map((
    { id, codec, forced, language, name },
  ) =>
    [
      id,
      [
        mkvPath,
        id,
        name,
        forced ? "forced" : undefined,
        language,
        codec.toLowerCase(),
      ]
        .filter((a) => a !== undefined)
        .join("."),
    ] as const
  );

  const mkvExtract = new MkvExtract();
  return mkvExtract.extractSubs(mkvPath, extractions);
}

const formatTrack = (t: Track) =>
  [
    t.id.toString(10),
    t.codec,
    t.name,
    t.forced ? "FORCED" : undefined,
    t.language,
  ]
    .filter((a) => a !== undefined)
    .join(" - ");

if (import.meta.main) {
  await main();
}
