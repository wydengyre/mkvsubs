# Mkvsubs

`mkvsubs` is a script that simplifies extracting SRT and PGS/SUP subtitles from MKV files.

## Usage

To display the subtitle tracks of an mkv file: `mkvsubs example.mkv`

To extract all subtitle tracks from an MKV file, naming them intuitively: `mkvsubs ALL example.mkv`

To extract, as an example, English and French subtitles from an MKV file: `mkvsubs eng fre example.mkv`

## Installation:

Dependencies are [deno](https://deno.land) and [mkvtoolnix](https://mkvtoolnix.download).

Both are commonly available from package managers.
Supported versions are listed in `constants.json`.
`mkvsubs` uses conservative API calls.
It will probably work with other releases.

You can install from source:

    make build
    deno install --allow-read --allow-write --allow-run=mkvmerge,mkvextract dist/mkvsubs.js

Or you can install from a release:
The `deno install` command can also be used, as above, with an `mkvsubs.js` file downloaded from GitHub releases.
