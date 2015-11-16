test: libp6-spidermonkey.so
	LD_LIBRARY_PATH=. PERL6LIB=lib prove -ve perl6


libp6-spidermonkey.so: p6-spidermonkey.cpp
	g++ -Wall -Wshadow -pedantic -pedantic-errors \
		-isystem /usr/include/mozjs-24 $< -DSPIDERMONKEY_VERSION=24 \
		-shared -o $@ -fPIC -g -lmozjs-24 -lz -lpthread -ldl


README.md: lib/JavaScript/SpiderMonkey.pm6
	PERL6LIB=lib perl6 --doc=Markdown $< > $@


.PHONY: test
