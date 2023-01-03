.PHONY: clean deps generated test unittest itest build

dir_guard=@mkdir -p $(@D)

MATROSKA_TEST_FILES_URL := https://github.com/ietf-wg-cellar/matroska-test-files/archive/e6965e5ca666322ed93e2748a10a4f132309e005.zip

define download
$(dir_guard)
curl -s -S -L -f $(1) -z $@ -o $@.tmp && mv -f $@.tmp $@ 2>/dev/null || rm -f $@.tmp $@
endef

define unzip
$(dir_guard)
unzip -q -d $@ $<
endef

clean:
	rm -rf build deps generated dist

build: dist/mkvsubs.js

test: unittest itest

unittest: deps
	deno test --allow-read --allow-write --allow-run src

itest: deps dist/mkvsubs.js
	deno test --allow-read --allow-write --allow-run test/integration.test.ts

deps: deps/matroska-test-files

build/matroska-test-files.zip:
	$(call download,$(MATROSKA_TEST_FILES_URL))

deps/matroska-test-files: build/matroska-test-files.zip
	$(unzip)

dist/mkvsubs.js: FORCE
	$(dir_guard)
	deno bundle src/main.ts $@

FORCE:
