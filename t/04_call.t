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


my $obj = js-eval(q:to/JS/);
    ({
        thing : "nothing",
        get   : function() { return this.thing; },
        set   : function(t) { this.thing = t; return this; },
    })
    JS

given $obj
{
    is .type,         'object',   'value is an object';
    is .<get>.type,   'function', 'get is a function';
    is .<set>.type,   'function', 'set is a function';
    is .<thing>.type, 'string',   'attribute is a string';
    is .<thing>.Str,  'nothing',  'attribute has the right value';

    is .call('set', 123).type,   'object', 'calling set returns object';
    is .<thing>.type, 'number',  'attribute now is a number';
    is .<thing>.Num,  123,       'attribute has the right value';

    my $get = .call('get');
    is .<thing>.type, 'number', 'getting attribute';
    is .<thing>.Num,  123,      'gotten attribute has the right value';

    dies-ok { .call('nonexistent') }, 'calling nonexistent method fails';
    dies-ok { .call('thing')       }, 'calling non-function fails';

    # These return X::AdHoc instead of X::TypeCheck::Binding, see perl #126763
    throws-like { .call('')         }, X::AdHoc, 'calling empty string fails';
    throws-like { .call('no-kebap') }, X::AdHoc, 'calling kebap-case fails';
    throws-like { .call('1digit')   }, X::AdHoc, 'calling starting digit fails';
}


done-testing
