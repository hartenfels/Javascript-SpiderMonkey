unit module JavaScript::SpiderMonkey;
use JavaScript::SpiderMonkey::Runtime;
use JavaScript::SpiderMonkey::Context;


constant \Runtime := JavaScript::SpiderMonkey::Runtime;
constant \Context := JavaScript::SpiderMonkey::Context;


my Runtime $default-runtime;
my Context $default-context;


our sub js-runtime(--> Runtime:D)
{
    $default-runtime = Runtime.new unless $default-runtime;
    return $default-runtime;
}

our sub js-context(--> Context:D)
{
    $default-context = Context.new(js-runtime) unless $default-context;
    return $default-context;
}

our sub js-eval(Str $code, Str $file = 'eval', Int $line = 1) is export
{
    return js-context.eval($code, $file, $line);
}

our sub js-do(Cool $path) is export
{
    return js-context.do($path);
}


=begin pod

=head1 NAME

JavaScript::SpiderMonkey - use Mozilla's JavaScript interpreter from Perl 6

=head1 TODO

=item Nicer errors
=item Implement console.log and friends, maybe in JavaScript
=item Use LibraryMake and compile this sanely
=item Write more tests
=item Put this on TravisCI and test multiple SpiderMonkey versions
=item Call JavaScript from Perl6
=item Call Perl6 from JavaScript somehow
=item Add documentation

=head1 AUTHOR

L<Carsten Hartenfels|mailto:carsten.hartenfels@googlemail.com>

=head1 COPYRIGHT AND LICENSE

This software is copyright (c) 2015 by Carsten Hartenfels.
This program is distributed under the terms of the Artistic License 2.0.
For further information, please see LICENSE or visit
<http://www.perlfoundation.org/attachment/legal/artistic-2_0.txt>.

=end pod
