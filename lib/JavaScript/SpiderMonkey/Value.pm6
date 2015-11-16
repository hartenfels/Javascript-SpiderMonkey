unit class JavaScript::SpiderMonkey::Value is repr('CPointer');
use NativeCall;
use JavaScript::SpiderMonkey::Error;


constant \Error := JavaScript::SpiderMonkey::Error;
constant \Value := JavaScript::SpiderMonkey::Value;


sub p6sm_value_context(Value --> OpaquePointer)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_free(Value)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_error(Value --> Error)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_type(Value --> Str)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_str(Value --> Str)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_num(Value, num64 is rw --> int32)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_bool(Value, int32 is rw --> int32)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_call(Value, uint32, CArray[OpaquePointer] --> Value)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_accessible(Value --> int32)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_at_key(Value, Str --> Value)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_at_pos(Value, uint32 --> Value)
    is native('libp6-spidermonkey') { * }


our proto sub convert($v --> Value:D) { * }

multi sub convert(Value:D $v) { $v }


method error()
{
    return p6sm_value_error(self).to-exception;
}


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
    fail self.error;
}

method Bool(Value:D: --> Bool)
{
    my int32 $bool;
    return ?$bool if p6sm_value_bool(self, $bool);
    fail self.error;
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


method CALL-ME(Value:D: *@args)
{
    fail "JavaScript doesn't support named arguments" if %_;

    my $values = CArray[OpaquePointer].new;
    -> $i, $arg { $values[$i] = convert($arg) } for kv @args;

    return p6sm_value_call(self, @args.elems, $values) // fail self.error;
}


method AT-KEY(Value:D: $key --> Value:D)
{
    PRE { p6sm_value_accessible(self) }
    return p6sm_value_at_key(self, ~$key) // fail self.error;
}

method AT-POS(Value:D: $key --> Value:D)
{
    PRE { p6sm_value_accessible(self) }
    return p6sm_value_at_pos(self, +$key) // fail self.error;
}


method DESTROY
{
    p6sm_value_free(self);
}
