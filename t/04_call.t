use v6;
use Test;
use JavaScript::SpiderMonkey;


my $var = js-eval('(function () { return "var"; })');
is $var.type, 'function', 'value is a function';
given $var()
{
    is .type, 'string', 'function return is a string';
    is .Str,  'var',    'string has the right value';
}


done-testing
