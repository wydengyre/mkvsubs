#!/usr/bin/env just --justfile

matroskaTestFilesUrl := "https://github.com/ietf-wg-cellar/matroska-test-files/archive/e6965e5ca666322ed93e2748a10a4f132309e005.zip"
matroskaTestZipPath := "build/matroska-test-files.zip"
matroskaTestFilesPath := "deps/matroska-test-files"

default:
    just --list --justfile {{justfile()}}

ci: ci-fmt lint download-test-files unittest itest

ci-fmt:
    deno fmt --check src test

clean:
    rm -rf build deps generated dist

fmt:
    deno fmt src test

lint:
    deno lint src test

update-deps:
    deno run -A https://deno.land/x/udd/main.ts import_map.json

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

docker-ci: clean docker-build-image docker-build-mkvsubs

# build the docker image for building the project
docker-build-image:
    docker build -f Dockerfile.build -t mkvsubs-build .

docker-build-mkvsubs:
    deno run --allow-read=./ --allow-write=./ --allow-run=docker src/docker-build.ts
