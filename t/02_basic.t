use v6;
use Test;
use JavaScript::SpiderMonkey;


is js-eval(q:to/JS/).type, 'object', 'evaling an object literal';
    car = {
        seats  : "leather",
        plates : true,
        doors  : [1, 2.3],
        "ℕℤℚℝ" : "林花謝了春紅",
    };
    JS

my $car = js-eval('car');
is $car.type, 'object', 'referencing evaled object';


given $car<seats>
{
    is .type, 'string',  'referencing string property';
    is .Str,  'leather', 'string property has right content';
}


given $car<plates>
{
    is .type, 'boolean', 'referencing boolean property';
    is .Bool,  True,     'boolean property has right content';
}


given $car<doors>
{
    is .type, 'object', 'referencing array property';

    given .[0]
    {
        is .type, 'number', 'referencing number in array';
        cmp-ok .Num, '==', 1, 'number has right content';
    }

    given .[1]
    {
        is .type, 'number', 'another number in array';
        cmp-ok .Num, '==', 2.3, 'also has right content';
    }

    is .[2].type, 'undefined', 'referencing nonexistent array element';
}


given $car<ℕℤℚℝ>
{
    is .type, 'string', 'referencing unicode property';
    is .Str,  '林花謝了春紅', 'unicode string has the right value';
}


is $car<nonexistent>.type, 'undefined', 'referencing nonexistent object key';
is $car[0].type, 'undefined', 'referencing array element on non-array';


done-testing
