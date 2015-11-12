#include <jsapi.h>
#include <cstring>
#include <stdexcept>
#include <iostream>
namespace perl6_spidermonkey
{


#ifndef SPIDERMONKEY_VERSION
#   error "You need to set SPIDERMONKEY_VERSION"
#endif

#if SPIDERMONKEY_VERSION <= 24
#   define  SPIDERMONKEY_INIT          /* JS_Init() doesn't exist */
#   define _SPIDERMONKEY_PARAM_THREADS ,JS_USE_HELPER_THREADS
#   define _SPIDERMONKEY_PARAM_FIRE    /* parameter doesn't exist */
#   define  SPIDERMONKEY_ADDRESS(X)    (X).address()
#else
#   define  SPIDERMONKEY_INIT          JS_Init()
#   define _SPIDERMONKEY_PARAM_THREADS /* parameter removed */
#   define _SPIDERMONKEY_PARAM_FIRE    ,JS::FireOnNewGlobalHook
#   define  SPIDERMONKEY_ADDRESS(X)    &(X)
#endif


static JSClass global_class = {
    "global",
    JSCLASS_GLOBAL_FLAGS,
# if SPIDERMONKEY_VERSION < 38
    JS_PropertyStub,
    JS_DeletePropertyStub,
    JS_PropertyStub,
    JS_StrictPropertyStub,
    JS_EnumerateStub,
    JS_ResolveStub,
    JS_ConvertStub,
# endif
};


static JSBool dispatch(JSContext* context, unsigned int argc, JS::Value* vp)
{
    JS::CallArgs args = CallArgsFromVp(argc, vp);

    JSFunction* fun = JS_ValueToFunction(context, args.calleev());
    char* name = JS_EncodeStringToUTF8(context, JS_GetFunctionId(fun));
    std::cerr << name << '\n';
    JS_free(context, name);

    return true;
}


/* Simple auto pointer that calls `delete` on abnormal scope exit. */
template <typename T> class Auto
{
public:
    Auto(T* p) : ptr(p) {}

    ~Auto()         { delete ptr; }
    T* operator->() { return ptr; }
    T* get()        { return ptr; }

    T* ret() /* normal return */
    {
        T* p = ptr;
        ptr  = NULL;
        return p;
    }

private:
    T* ptr;

    Auto<T>           (Auto<T> const&); /* no copying    */
    Auto<T>& operator=(Auto<T> const&); /* no assignment */
};


class Value
{
public:

    JSContext*      context;
    JS::RootedValue rval;


    Value(JSContext* ctx) : context(ctx), rval(ctx) {}

    ~Value()
    {
        JS_free(context, strval);
    }


    const char* type()
    {
        switch (JS_TypeOfValue(context, rval))
        {
            case JSTYPE_VOID    : return "undefined";
            case JSTYPE_OBJECT  : return "object";
            case JSTYPE_FUNCTION: return "function";
            case JSTYPE_STRING  : return "string";
            case JSTYPE_NUMBER  : return "number";
            case JSTYPE_BOOLEAN : return "boolean";
            default             : return NULL;
        }
    }


    const char* str()
    {
        if (!strval)
            strval = JS_EncodeStringToUTF8(context,
                                           JS_ValueToString(context, rval));
        return strval;
    }


    bool num(double* number)
    {
        return JS_ValueToNumber(context, rval, number);
    }


    bool boolean(JSBool* b)
    {
        return JS_ValueToBoolean(context, rval, b);
    }


    Value* at_key(const char* key)
    {
        if (!rval.isObject())
            return NULL;

        JSObject* obj;
        if (!JS_ValueToObject(context, rval, &obj))
            return NULL;

        Auto<Value> out(new Value(context));
        if (JS_GetProperty(context, obj, key, SPIDERMONKEY_ADDRESS(out->rval)))
            return out.ret();

        return NULL;
    }


    Value* at_pos(uint32_t pos)
    {
        if (!rval.isObject())
            return NULL;

        JSObject* obj;
        if (!JS_ValueToObject(context, rval, &obj))
            return NULL;

        Auto<Value> out(new Value(context));
        if (JS_GetElement(context, obj, pos, SPIDERMONKEY_ADDRESS(out->rval)))
            return out.ret();

        return NULL;
    }


private:
    char* strval = NULL;
};


class Context
{
public:

    Context(JSRuntime* rt, size_t stack_size)
    {
        context = JS_NewContext(rt, stack_size);
        if (!context)
            throw std::runtime_error("can't create context");

        JSObject* gobj = JS_NewGlobalObject(context, &global_class, NULL
                                            _SPIDERMONKEY_PARAM_FIRE);
        global = new JS::RootedObject(context, gobj);
        if (!*global)
            throw std::runtime_error("can't create global object");

        {
            JSAutoCompartment ac(context, *global);

            if (!JS_InitStandardClasses(context, *global))
                throw std::runtime_error("can't initialize standard classes");

            if (!JS_DefineFunction(context, *global, "doit", dispatch, 0, 0))
                throw std::runtime_error("can't register dispatch function");

        }
    }


    ~Context()
    {
        if (context)
            JS_DestroyContext(context);
        delete global;
    }


    Value* eval(const char* script, const char* file, int line)
    {
        JSAutoCompartment ac(context, *global);
        Auto<Value> val(new Value(context));

        bool ok;
#     if SPIDERMONKEY_VERSION < 38
        ok = JS_EvaluateScript(context, *global,
#     else
        JS::CompileOptions opts(context);
        opts.setFileAndLine(filename, lineno);
        ok = JS::Evaluate(context, *global, opts,
#     endif
                          script, std::strlen(script), file,
                          line, SPIDERMONKEY_ADDRESS(val->rval));

        return val.ret();
    }


private:
    JSContext       * context = NULL;
    JS::RootedObject* global  = NULL;
};


}


using namespace perl6_spidermonkey;

extern "C"
{
    int p6sm_version()
    {
        return SPIDERMONKEY_VERSION;
    }

    void p6sm_shutdown()
    {
        JS_ShutDown();
    }


    JSRuntime* p6sm_new_runtime(long memory)
    {
        SPIDERMONKEY_INIT;
        return JS_NewRuntime(memory _SPIDERMONKEY_PARAM_THREADS);
    }

    void p6sm_free_runtime(JSRuntime* rt)
    {
        JS_DestroyRuntime(rt);
    }


    Context* p6sm_new_context(JSRuntime* rt, int stack_size)
    {
        try
        {
            Auto<Context> cx(new Context(rt, stack_size));
            return cx.ret();
        }
        catch(std::runtime_error& e)
        {
            std::cerr << e.what() << '\n';
        }
        return NULL;
    }

    void p6sm_free_context(Context* cx)
    {
        delete cx;
    }

    Value* p6sm_eval(Context   * cx,
                     const char* script,
                     const char* file,
                     int         line)
    {
        return cx->eval(script, file, line);
    }


    void p6sm_value_free(Value* val)
    {
        delete val;
    }

    const char* p6sm_value_type(Value* val)
    {
        return val->type();
    }

    const char* p6sm_value_str(Value* val)
    {
        return val->str();
    }

    int p6sm_value_num(Value* val, double* number)
    {
        return val->num(number);
    }

    int p6sm_value_bool(Value* val, int* boolean)
    {
        JSBool b;
        if (val->boolean(&b))
        {
            *boolean = b;
            return 1;
        }
        return 0;
    }

    Value* p6sm_value_at_key(Value* val, const char* key)
    {
        return val->at_key(key);
    }

    Value* p6sm_value_at_pos(Value* val, uint32_t pos)
    {
        return val->at_pos(pos);
    }
}
