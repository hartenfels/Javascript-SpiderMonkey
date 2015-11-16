use v6;
use Test;
use JavaScript::SpiderMonkey;


my $var = js-eval('(function (a, b) { return b ? a + b : a ? a : "var"; })');

is $var.type, 'function', 'value is a function';
given $var()
{
    is .type, 'string', 'no arg returns string';
    is .Str,  'var',    'string has the right value';
}

given $var('arg')
{
    is .type, 'string', 'string arg returns string';
    is .Str,  'arg',    'string has the right value';
}

given $var('hello,', ' world!')
{
    is .type, 'string',        'two string args returns string';
    is .Str,  'hello, world!', 'string has the right value';
}

given $var(1, 2)
{
    is .type, 'number', 'two number args returns number';
    is .Num,  3,        'number has the right value';
}

given $var(True)
{
    is .type, 'boolean', 'boolean arg returns boolean';
    is .Bool, True,      'boolean has the right value';
}


done-testing
