#!/usr/bin/env just --justfile

matroskaTestFilesUrl := "https://github.com/ietf-wg-cellar/matroska-test-files/archive/e6965e5ca666322ed93e2748a10a4f132309e005.zip"
matroskaTestZipPath := "build/matroska-test-files.zip"
matroskaTestFilesPath := "deps/matroska-test-files"

default:
    just --list --justfile {{justfile()}}

clean:
    rm -rf build deps generated dist

# download and unzip mkv files used in testing
download-test-files:
    mkdir -p {{parent_directory(matroskaTestZipPath)}} {{parent_directory(matroskaTestFilesPath)}}
    curl --show-error --location --fail {{matroskaTestFilesUrl}} --output {{matroskaTestZipPath}}
    unzip -q -o -d {{matroskaTestFilesPath}} {{matroskaTestZipPath}}

test-all: unittest itest

# run unit tests, test files required
unittest:
	deno test --allow-read --allow-write --allow-run src

# run integration tests, test files required
itest: build
	deno test --allow-read --allow-write --allow-run test/integration.test.ts

build:
    mkdir -p dist
    deno bundle src/main.ts dist/mkvsubs.js
