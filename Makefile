test-mozjs24: mozjs-24.2.0/js/src/dist
	if [ ! -e libp6-spidermonkey.so ]; then make lib-mozjs24; fi
	LD_LIBRARY_PATH=".:$</lib" PERL6LIB=lib prove -ve perl6


lib-mozjs24: mozjs-24.2.0/js/src/dist
	P6SM_VERSION=24 CPLUS_INCLUDE_PATH="$</include" LIBRARY_PATH="$</lib" \
		make -s libp6-spidermonkey.so

libp6-spidermonkey.so: p6-spidermonkey.cpp
	g++ -Wall -Wshadow -pedantic $< -D__STDC_LIMIT_MACROS \
		-DP6SM_VERSION="$$P6SM_VERSION" -shared -o $@ \
		-fPIC -g -lmozjs-24 -lz -lpthread -ldl


mozjs-24.2.0.tar.bz2:
	wget http://ftp.mozilla.org/pub/js/mozjs-24.2.0.tar.bz2

mozjs-24.2.0: mozjs-24.2.0.tar.bz2
	tar xjf $<

mozjs-24.2.0/js/src/dist: mozjs-24.2.0
	cd $</js/src && ./configure && make
	touch $@


clean:
	rm -rf mozjs-24.2.0.tar.bz2

realclean: clean
	rm -rf mozjs-24.2.0 libp6-spidermonkey.so


README.md: lib/JavaScript/SpiderMonkey.pm6
	PERL6LIB=lib perl6 --doc=Markdown $< > $@


.PHONY: test-mozjs24 lib-mozjs24 clean realclean
