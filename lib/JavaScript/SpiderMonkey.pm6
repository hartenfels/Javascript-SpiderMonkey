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

JavaScript::SpiderMonkey - glue for Mozilla's JavaScript interpreter

=head1 TODO

=item1 Nicer errors
=item1 Implement console.log and friends
=item1 Use LibraryMake and compile this sanely
=item1 Write more tests
=item1 Test multiple SpiderMonkey versions
=item1 Calling JavaScript from Perl6:
=item2 → Call methods on JavaScript objects
=item2 → Also allow calling things on the global object
=item1 Call Perl6 from JavaScript somehow (ask on #perl6)
=item1 Add documentation

=head1 AUTHOR

L<Carsten Hartenfels|mailto:carsten.hartenfels@googlemail.com>

=head1 COPYRIGHT AND LICENSE

This software is copyright (c) 2015 by Carsten Hartenfels.
This program is distributed under the terms of the Artistic License 2.0.
For further information, please see LICENSE or visit
<http://www.perlfoundation.org/attachment/legal/artistic-2_0.txt>.

=end pod
