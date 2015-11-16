test-mozjs24: libp6-spidermonkey.so
	LD_LIBRARY_PATH=".:mozjs-24.2.0/js/src/dist/lib" PERL6LIB=lib prove -ve perl6


libp6-spidermonkey.so: p6-spidermonkey.cpp
	P6SM_VERSION=24 CPLUS_INCLUDE_PATH=mozjs-24.2.0/js/src/dist/include \
		LIBRARY_PATH=mozjs-24.2.0/js/src/dist/lib g++ -Wall -Wshadow \
		-std=c++98 -pedantic -pedantic-errors $< -D__STDC_LIMIT_MACROS \
		-DP6SM_VERSION=24 -shared -o $@ -fPIC -g -lmozjs-24 -lz -lpthread -ldl


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
