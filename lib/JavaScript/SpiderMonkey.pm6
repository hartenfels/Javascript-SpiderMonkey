unit module JavaScript::SpiderMonkey;
use NativeCall;


class Value is repr('CPointer')
{
    sub p6sm_value_free(Value)
        is native('libp6-spidermonkey') { * }

    sub p6sm_value_type(Value --> Str)
        is native('libp6-spidermonkey') { * }

    sub p6sm_value_str(Value --> Str)
        is native('libp6-spidermonkey') { * }

    sub p6sm_value_num(Value, num64 is rw --> int32)
        is native('libp6-spidermonkey') { * }

    sub p6sm_value_bool(Value, int32 is rw --> int32)
        is native('libp6-spidermonkey') { * }

    sub p6sm_value_at_key(Value, Str --> Value)
        is native('libp6-spidermonkey') { * }

    sub p6sm_value_at_pos(Value, uint32 --> Value)
        is native('libp6-spidermonkey') { * }


    method type(Value:D: --> Str)
    {
        return p6sm_value_type(self);
    }

    method Str(Value:D: --> Str)
    {
        return p6sm_value_str(self);
    }

    method Num(Value:D: --> Num)
    {
        my num64 $number;
        return $number if p6sm_value_num(self, $number);
        fail;
    }

    method Bool(Value:D: --> Bool)
    {
        my int32 $bool;
        return ?$bool if p6sm_value_bool(self, $bool);
        fail;
    }

    method gist(Value:D: --> Str)
    {
        given self.type
        {
            return  ~self when 'string';
            return ~+self when 'number';
            return ~?self when 'boolean';
            return "[$_]";
        }
    }


    method AT-KEY(Value:D: $key --> Value:D)
    {
        return p6sm_value_at_key(self, ~$key) // fail;
    }

    method AT-POS(Value:D: $key --> Value:D)
    {
        return p6sm_value_at_pos(self, +$key) // fail;
    }


    method DESTROY
    {
        p6sm_value_free(self);
    }
}


class Runtime is repr('CPointer')
{
    sub p6sm_new_runtime(long --> Runtime)
        is native('libp6-spidermonkey') { * }

    sub p6sm_free_runtime(Runtime)
        is native('libp6-spidermonkey') { * }

    method new(long $memory = 8 * 1024 ** 2 --> Runtime:D)
    {
        return p6sm_new_runtime($memory):
    }

    method DESTROY
    {
        p6sm_free_runtime(self);
    }
}


class Context is repr('CPointer')
{
    sub p6sm_new_context(Runtime, int32 --> Context)
        is native('libp6-spidermonkey') { * }

    sub p6sm_free_context(Context)
        is native('libp6-spidermonkey') { * }

    sub p6sm_eval(Context, Str, Str, int32 --> Value)
        is native('libp6-spidermonkey') { * }


    method new(Runtime:D $rt, int32 $stack_size = 8192 --> Context:D)
    {
        return p6sm_new_context($rt, $stack_size);
    }


    method eval(Context:D: Str   $code,
                           Str   $file = 'eval',
                           int32 $line = 1
                           --> Value)
    {
        return p6sm_eval(self, $code, $file, $line);
    }

    method do(Context:D: Cool $path --> Value)
    {
        return self.eval(slurp($path), $path);
    }


    method DESTROY
    {
        p6sm_free_context(self);
    }
}


my Runtime $default_runtime;
my Context $default_context;


my $js = Context.new(Runtime.new);
say $js.eval('car = {}; car.seats = "leather"; car.plates = true; car');
say $js.eval('car.seats');
say $js.eval('car.plates');
$js.eval('doit();');


=begin pod

=head1 NAME

JavaScript::SpiderMonkey - use Mozilla's JavaScript interpreter from Perl 6

=head1 TODO

=item Handle and show errors properly
=item Implement console.log and friends, maybe in JavaScript
=item Use LibraryMake and compile this sanely
=item Write tests
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
