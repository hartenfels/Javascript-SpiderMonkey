unit class JavaScript::SpiderMonkey::Value is repr('CPointer');
use NativeCall;
use JavaScript::SpiderMonkey::Error;


constant \Error := JavaScript::SpiderMonkey::Error;
constant \Value := JavaScript::SpiderMonkey::Value;


subset Identifier of Str; # TODO where /^ <[<:L>\$\_]> <[<:L>\$\_ 0..9]> $/;


sub p6sm_value_context(Value --> OpaquePointer)
    is native('libp6-spidermonkey') { * }

sub p6sm_new_bool_value(OpaquePointer, int32 --> Value)
    is native('libp6-spidermonkey') { * }

sub p6sm_new_num_value(OpaquePointer, num64 --> Value)
    is native('libp6-spidermonkey') { * }

sub p6sm_new_str_value(OpaquePointer, Str is encoded('utf16') --> Value)
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

sub p6sm_value_call(Value, Value, uint32, CArray[OpaquePointer] --> Value)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_accessible(Value --> int32)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_at_key(Value, Str is encoded('utf16') --> Value)
    is native('libp6-spidermonkey') { * }

sub p6sm_value_at_pos(Value, uint32 --> Value)
    is native('libp6-spidermonkey') { * }


our proto sub convert($v --> Value:D) { * }

multi sub convert(  Value:D $v) { $v }
multi sub convert(   Bool:D $v) { $v }
multi sub convert(Stringy:D $v) { $v }
multi sub convert(Numeric:D $v) { $v }

sub to-value(OpaquePointer $context, $arg)
{
    given convert($arg)
    {
        when   Value:D { $_ }
        when    Bool:D { p6sm_new_bool_value($context, $_ ?? 1 !! 0) }
        when Numeric:D { p6sm_new_num_value($context, .Num) }
        when Stringy:D { p6sm_new_str_value($context, .Str) }
        default        { !!! }
    }
}


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


method CALL-ME(Value:D: *@args, Value:D :$this = self)
{
    my OpaquePointer:D       $context = p6sm_value_context(self);
    my CArray[OpaquePointer] $values .= new;

    for kv @args -> $i, $arg { $values[$i] = to-value($context, $arg) }

    return p6sm_value_call(self, $this, @args.elems, $values) // fail self.error;
}

method call(Value:D: Identifier $method, *@args)
{
    return self{$method}(|@args, :this(self));
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
