import { z } from "zod";

export type Track = {
  id: number;
  codec: "SRT" | "PGS" | "UNSUPPORTED";
  forced: boolean;
  language?: string;
  name?: string;
};

export class MkvMerge {
  readonly #binPath: string;

  constructor(binPath = "mkvmerge") {
    this.#binPath = binPath;
  }

  async listSubs(mkvPath: string): Promise<Track[]> {
    const out = await cmd(mkvPath);
    const parsed = await parseJson(out);
    return normalize(parsed);
  }
}

async function cmd(mkvPath: string): Promise<Uint8Array> {
  const p = Deno.run({
    cmd: ["mkvmerge", "-J", mkvPath],
    stdout: "piped",
  });

  const { success, code } = await p.status();
  const out = await p.output();
  p.close();
  if (!success) {
    throw `mkvmerge failed with code ${code}`;
  }
  return out;
}

const schema = z.object({
  tracks: z.array(z.object({
    id: z.number().nonnegative(),
    codec: z.string(),
    type: z.string(),
    properties: z.object({
      forced_track: z.boolean(),
      language: z.optional(z.string()),
      track_name: z.optional(z.string()),
    }),
  })),
});
type MkvmergeJson = z.infer<typeof schema>;

function parseJson(encoded: Uint8Array): Promise<MkvmergeJson> {
  const td = new TextDecoder();
  const s = td.decode(encoded);
  const j = JSON.parse(s);
  return schema.parseAsync(j);
}

function mapCodec(codec: string): Track["codec"] {
  if (codec === "SubRip/SRT") {
    return "SRT";
  }
  if (codec === "HDMV PGS") {
    return "PGS";
  }
  return "UNSUPPORTED";
}

function normalize(mj: MkvmergeJson): Track[] {
  return mj.tracks
    .filter(({ type }) => type === "subtitles")
    .map(({ id, codec, properties }) => ({
      id,
      codec: mapCodec(codec),
      forced: properties.forced_track,
      language: properties.language,
      name: properties.track_name,
    }));
}
