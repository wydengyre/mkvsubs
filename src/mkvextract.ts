type Extraction = readonly [number, string];

export class MkvExtract {
  readonly #binPath: string;

  constructor(binPath = "mkvextract") {
    this.#binPath = binPath;
  }

  async extractSubs(mkvPath: string, extractions: Extraction[]): Promise<void> {
    const trackSpecifications = extractions.map(([trackId, file]) =>
      `${trackId}:${file}`
    );

    const p = Deno.run({
      cmd: [this.#binPath, mkvPath, "tracks", ...trackSpecifications],
    });

    const { success, code } = await p.status();
    p.close();
    if (!success) {
      throw `mkvextract failed with code ${code}`;
    }
  }
}
