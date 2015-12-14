Expectacle
==========

Expectacle is a simple expectation library with a sane syntax.


Installation
------------

Expectacle can be used in the browser, on NodeJS and on any CommonJS environment that supports Modules/1.1.

### Browser

Download `expectacle.js` and include it with a script tag:

```html
<script type="text/javascript" src="/path/to/expectacle.js"></script>
<script type="text/javascript">
// window.expect();
</script>
```

### NodeJS

Expectacle is available on NPM:

```sh
$ npm install expectacle
```

You can then require it in your tests:

```js
var expect = require('expectacle');
```

### CommonJS

Download `expectacle.js` and use `require`:

```js
var expect = require('./path/to/expectacle').expect;
```


Usage
-----

Expectacle has one main function called `expect`, that is used to create a new *expectation*. It takes in one argument, the *value* of the expectation, which could be of any JavaScript type.

### The Basics

```js
expect(1);
```

An expectation can then be tested using *matchers*. A matcher is a function that performs checks on the value of the expectation using zero or one arguments. It then returns either `true` or `false` depending on whether the value passes the check. If a matcher returns `false`, the expectation fails and an error is thrown.

```js
expect(1).toBe(1); // passes, no error.
expect(2).toBe(1); // fails, throws an ExpectationError.
```

All expectations have a corresponding *reversed expectation* that can be accessed using the `not` member. This expectation has the same matchers as a regular expectations, but perform reversed tests with the matchers: the matcher returns `false` for success and `true` for failures.

```js
expect(1).not.toBe(2); // passes, no error.
expect(1).not.toBe(1); // fails, throws an ExpectationError.
```

### The Matchers

Expectacle comes with the following matchers by default:

#### `toBe(value)`

The *identity matcher* checks whether the expectation's value is identical to the passed value. It uses the `===` operator internally, and therefore disregards any type casting rules.

#### `toEqual(value)`

The *equality matcher* checks whether the expectation's value is equal to the passed value. It uses the `==` operator internally, and therefore coerces types.

#### `toBeLike(value)`

Checks whether the expected value is *similar* to the passed value. It uses a deep-comparison of keys and properties for objects.

#### `toThrow([error])`

Checks whether a function expected value throws an error.

This matcher can be used without passing the `error` argument, in which case the matcher only checks if the expected value throws.

Optionally, one could pass an `error` argument that could either be a string, a regular expression or a constructor function:

- If the `error` argument is a string, the `error` argument is compared against the `message` of the expected value's thrown error.
- If the `error` argument is a regular expression, the `message` of the expected value's thrown error is tested against the `error` argument.
- If the `error` argument is a constructor function, the `name` property of the expected value's thrown error is compared against the `name` value of the constructor function's `prototype`.

#### `toMatch(regularExpression)`

Checks whether the expected value's string representation matches the passed `regularExpression` argument.

#### `toHaveLength(length)`

Checks whether the expected value is of the passed `length`.

This matcher uses the `length` property if it is available (e.g., in strings, arrays, arguments and any object that has a `length` property). If the expected value is an object *without* a length property, this matcher check the number of keys (i.e., member/property names).

#### `toBeEmpty()`

Checks whether the expected value is empty.

This matcher uses the `length` property if it is available (e.g., in strings, arrays, arguments and any object that has a `length` property). If the expected value is an object *without* a length property, this matcher check the number of keys (i.e., member/property names).

#### `toHaveMember(name)`

Checks whether the expected value has a member (i.e., property or method) with a name corresponding to the passed argument.

#### `toHaveOwnMember(name)`

Matches like `toHaveMember`, but disregards any inherited members.

#### `toHaveProperty(name)`

Checks whether the expected value has a property (i.e., non-function member) with a name corresponding to the passed argument.

#### `toHaveOwnProperty(name)`

Matches like `toHaveProperty`, but disregards any inherited properties.

#### `toHaveMethod(name)`

Checks whether the expected value has a method (i.e., function member) with a name corresponding to the passed argument.

#### `toHaveOwnMember(name)`

Matches like `toHaveMember`, but disregards any inherited methods.

#### `toBeAnInstanceOf(constructor)`

Checks whether the expectation's value is an instance of the the passed `constructor` argument. Will throw an `ExpectationError` if the passed `constructor` argument is not a function.

#### `toBeOfType(typeString)`

Checks whether the expectation's value has the type corresponding to the passed `typeString`.

This function is implemented using `Object.prototype.toString` to get the type's string representation. The following typeStrings are pre-populated: `'arguments'`, `'array'`, `'boolean'`, `'date'`, `'function'`,`'null'`, `'number'`, `'object'`, `'regexp'`, `'string'`, `'undefined'`.

#### `toBeBoolean()` / `toBeABoolean()`

Checks whether the expected value is a boolean.

#### `toBeArray()` / `toBeAnArray()`

Checks whether the expected value is an array.

#### `toBeFunction()` / `toBeAFunction()`

Checks whether the expected value is a function.

#### `toBeNumber()` / `toBeANumber()`

Checks whether the expected value is a number.

#### `toBeObject()` / `toBeAnObject()`

Checks whether the expected value is an object (but not an array).

#### `toBeString()` / `toBeAString()`

Checks whether the expected value is a string.

#### `toBeNull()`

Checks whether the expected value is `null`.

#### `toBeUndefined()`

Checks whether the expected value is `undefined`.

#### `toBeNaN()`

Checks whether the expected value is `NaN`.

#### `toBeTrue()`

Checks whether the expected value is `true`.

#### `toBeFalse()`

Checks whether the expected value is `false`.

#### `toBeTruthy()`

Checks whether the expected value is truthy (i.e., coerces as a boolean `true` value).

#### `toBeFalsy()`

Checks whether the expected value is falsy (i.e., coerces as a boolean `false` value).

### Custom Matchers

You can add a custom matcher function using the `expect.addMatcher` function:

```js
expect.addMatcher(name, matcherFunction);
```

A `matcherFunction` is a function that receives two arguments and returns a boolean. The first argument is the expected value (i.e., the value passed to the `expect` function), and the second argument is the value passed to the matcher function when called (which can be empty; more on that in a bit).

```js
expect.addMatcher('toStartWith', function(expected, prefix) {
  if (prefix == expect.NULL_VALUE || !prefix) {
    expect.fail('toStartWith requires a prefix argument.'); // throw an error
  }
  return expected.toString().indexOf(prefix) == 0;
});

expect('hello').toStartWith('he'); // passes.
expect('hello').not.toStartWith('he'); // fails; throws an error.
expect('hello').toStartWith(); // fails; throws an error because no prefix.
```

The `matcherFunction` must return `true` if the expected value passes the check and `false` if it doesn't. Expectacle handles throwing the function automatically, so a simple boolean return value will suffice. The `addMatcher` function also creates a reversed matcher automatically.

In cases where the user of the matcher does not provide an argument to the matcher, a special value `expect.NULL_VALUE` is passed to the matcher instead. This is done in order to distinguish when the user passes values like `undefined` and `null` or when they just fail to provide an argument entirely.

### Utility Functions

#### `typeOf`

The function `expect.typeOf` can be used to get the type of a value. This function is used internally by the default matchers.

#### `fail`

The function `expect.fail` can be used to raise an ExpectationError. It takes one argument, which is used as the error message.

About
-----

Copyright 2015, Mark "Keeto" Obcena. Released under an MIT-Style License.
