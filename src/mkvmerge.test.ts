import { assertEquals } from "std/testing/asserts.ts";
import { MkvMerge, Track } from "./mkvmerge.ts";
import { TEST_FILE_PATH } from "../test/util.ts";

Deno.test("listSubs", async () => {
  const mkvmerge = new MkvMerge();
  const subs = await mkvmerge.listSubs(TEST_FILE_PATH);
  assertEquals(subs, EXPECTED);
});

const EXPECTED: Track[] = [
  {
    codec: "SRT",
    forced: false,
    id: 2,
    language: "eng",
    name: undefined,
  },
  {
    codec: "SRT",
    forced: false,
    id: 3,
    language: "hun",
    name: undefined,
  },
  {
    codec: "SRT",
    forced: false,
    id: 4,
    language: "ger",
    name: undefined,
  },
  {
    codec: "SRT",
    forced: false,
    id: 5,
    language: "fre",
    name: undefined,
  },
  {
    codec: "SRT",
    forced: false,
    id: 6,
    language: "spa",
    name: undefined,
  },
  {
    codec: "SRT",
    forced: false,
    id: 7,
    language: "ita",
    name: undefined,
  },
  {
    codec: "SRT",
    forced: false,
    id: 9,
    language: "jpn",
    name: undefined,
  },
  {
    codec: "SRT",
    forced: false,
    id: 10,
    language: "und",
    name: undefined,
  },
];
