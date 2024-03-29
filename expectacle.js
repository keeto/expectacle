/*
 *
 * The MIT License
 *
 * Copyright (c) 2022 Mark Obcena <http://keetology.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * @param exports - The main exports object.
 */
(function (exports) {
  const slice = Array.prototype.slice;
  const toString = Object.prototype.toString;

  /**
   * @typedef {MatcherFunction}
   * @type {function}
   * @param {any} actual - The actual value.
   * @param {any} expected - The expected value.
   * @returns {boolean} True if the actual value passes the check, false otherwise.
   */

  /**
   * Used as a stand-in value for things that are not supposed to exist.
   *
   * @constant
   */
  const NULL_VALUE = {};

  /**
   * A mapping of known types used in the typeOf function.
   *
   * @private
   * @type {Object<string, string>}
   */
  const knownTypes = {
    '[object Arguments]': 'arguments',
    '[object Array]': 'array',
    '[object Boolean]': 'boolean',
    '[object Date]': 'date',
    '[object Function]': 'function',
    '[object Number]': 'number',
    '[object Object]': 'object',
    '[object RegExp]': 'regexp',
    '[object String]': 'string',
  };

  /**
   * A regular expression used to get the typename of an object.
   *
   * @private
   * @type {RegExp}
   */
  const typeMatcher = /\[object\s(.*)\]/;

  /**
   * Returns the type of an item as a string.
   *
   * @private
   * @param item - The item to test.
   * @returns The type of the item as a string.
   */
  function typeOf(item) {
    if (item === null) {
      return 'null';
    }
    if (item === undefined) {
      return 'undefined';
    }
    const str = toString.call(item);
    if (str in knownTypes) {
      return knownTypes[str];
    }
    const type = str.replace(typeMatcher, '$1').toLowerCase();
    return (knownTypes[str] = type);
  }

  /**
   * Checks whether the item is an instance of a type.
   *
   * @private
   * @param item - The item to check.
   * @param type - The constructor function to check.
   * @returns True if the item is an instance of the type, false otherwise.
   */
  function instanceOf(item, type) {
    let _item = item;
    const itemType = typeOf(_item);
    if (
      itemType === 'string' ||
      itemType === 'number' ||
      itemType === 'boolean'
    ) {
      _item = Object(item);
    }
    return _item instanceof type;
  }

  /**
   * Binds arguments to a function without changing the this value.
   *
   * @private
   * @param fn - The function to bind.
   * @param args - A variable-length list of arguments to pass.
   * @returns The function with the arguments bound.
   */
  function partial(fn) {
    const _args = slice.call(arguments, 1);
    return function () {
      return fn.apply(this, _args.concat(slice.call(arguments)));
    };
  }

  /**
   * The NodeJS assert module's objEquiv function, with the dependence on
   * microfunctions removed.
   *
   * @private
   * @param _a - The first object.
   * @param _b - The second object.
   * @returns True if the object are equivalent.
   */
  function objEquiv(_a, _b) {
    let a = _a;
    let b = _b;
    // eslint-disable-next-line
    if (a == null || b == null) {
      return false;
    }
    if (a.prototype !== b.prototype) {
      return false;
    }
    if (typeOf(a) === 'arguments') {
      if (!typeOf(b) !== 'arguments') {
        return false;
      }
      a = Array.prototype.slice.call(a);
      b = Array.prototype.slice.call(b);
      return deepEqual(a, b);
    }
    let ka;
    let kb;
    try {
      ka = Object.keys(a);
      kb = Object.keys(b);
    } catch (e) {
      return false;
    }
    if (ka.length !== kb.length) {
      return false;
    }
    ka.sort();
    kb.sort();
    let key;
    let i;
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] !== kb[i]) {
        return false;
      }
    }
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i];
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  /**
   * The NodeJS assert module's deepEqual function, with the buffer test removed.
   *
   * @private
   * @param actual - The first value.
   * @param expected - The second value.
   * @returns True if the items are deeply equal.
   */
  function deepEqual(actual, expected) {
    if (actual === expected) {
      return true;
    } else if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();
    } else if (actual instanceof RegExp && expected instanceof RegExp) {
      return (
        actual.source === expected.source &&
        actual.global === expected.global &&
        actual.multiline === expected.multiline &&
        actual.lastIndex === expected.lastIndex &&
        actual.ignoreCase === expected.ignoreCase
      );
    } else if (typeof actual !== 'object' && typeof expected !== 'object') {
      return actual === expected;
    }
    return objEquiv(actual, expected);
  }

  function Shape(name, checker) {
    this.name = name;
    this.checker = checker;
  }

  Shape.isShape = function (shape) {
    return shape instanceof Shape;
  };

  const InternalShapes = {};

  function addTypeShape(name) {
    const type = name.toLowerCase();
    InternalShapes[name] = function () {
      return new Shape(name, function (value) {
        return typeOf(value) === type;
      });
    };
  }

  InternalShapes.Array = function (subType) {
    let _subType = subType;
    switch (typeOf(_subType)) {
      case 'object':
        if (!Shape.isShape(_subType)) {
          _subType = InternalShapes.Object(_subType);
        }
        break;
      case 'array':
        // eslint-disable-next-line new-cap
        _subType = InternalShapes.ArrayStructure(_subType);
        break;
      case 'undefined':
        break;
      default:
        // eslint-disable-next-line new-cap
        _subType = InternalShapes.Literal(_subType);
        break;
    }
    const checker = function (object) {
      if (typeOf(object) !== 'array') {
        return false;
      }
      if (_subType) {
        for (let i = 0, l = object.length; i < l; i++) {
          if (compareShape(_subType, object[i])) {
            continue;
          }
          return false;
        }
      }
      return true;
    };
    let name = 'Array';
    if (_subType) {
      name += `.<${_subType.name}>`;
    }
    return new Shape(name, checker);
  };

  InternalShapes.ArrayStructure = function (types) {
    if (typeOf(types) !== 'array') {
      throw new Error('Array Literal expects an array parameter.');
    }
    if (!types.length) {
      throw new Error('Empty types parameter');
    }
    const subTypes = [];
    let i;
    let l;
    for (i = 0, l = types.length; i < l; i++) {
      let type = types[i];
      switch (typeOf(type)) {
        case 'object':
          if (!Shape.isShape(type)) {
            type = InternalShapes.Object(type);
            types[i] = type;
          }
          break;
        case 'array':
          // eslint-disable-next-line new-cap
          type = InternalShapes.ArrayStructure(type);
          types[i] = type;
          break;
        default:
          // eslint-disable-next-line new-cap
          type = InternalShapes.Literal(type);
          break;
      }
      subTypes.push(type.name);
    }
    const name = `Array.[${subTypes.join(', ')}]`;
    const checker = function (object) {
      if (typeOf(object) !== 'array') {
        return false;
      }
      for (i = 0, l = types.length; i < l; i++) {
        if (!compareShape(types[i], object[i])) {
          return false;
        }
      }
      return true;
    };
    return new Shape(name, checker);
  };

  InternalShapes.LiteralArray = InternalShapes.ArrayStructure;

  InternalShapes.Object = function (descriptor) {
    const _descriptor = descriptor || {};
    const shapes = [];
    const subInternalShapes = [];
    for (const key in _descriptor) {
      if (!_descriptor.hasOwnProperty(key)) {
        continue;
      }
      let shape = _descriptor[key];
      switch (typeOf(shape)) {
        case 'object':
          if (!Shape.isShape(shape)) {
            shape = InternalShapes.Object(shape);
          }
          break;
        case 'array':
          // eslint-disable-next-line new-cap
          shape = InternalShapes.ArrayStructure(shape);
          break;
        default:
          // eslint-disable-next-line new-cap
          shape = InternalShapes.Literal(shape);
          break;
      }
      subInternalShapes.push(`${key}:${shape.name}`);
      shapes.push({key: key, checker: shape});
    }
    const name = `Object.{${subInternalShapes.join(', ')}}`;
    const checker = function (object) {
      if (typeOf(object) !== 'object') {
        return false;
      }
      for (let i = 0, l = shapes.length; i < l; i++) {
        const _shape = shapes[i];
        if (!compareShape(_shape.checker, object[_shape.key])) {
          return false;
        }
      }
      return true;
    };
    return new Shape(name, checker);
  };

  InternalShapes.Literal = function (value) {
    const name = `Literal.<${JSON.stringify(value, replacer)}>`;
    const checker = function (object) {
      return value === object;
    };
    return new Shape(name, checker);
  };

  const knownInternalShapes = [
    'Arguments',
    'Boolean',
    'Date',
    'Function',
    'Null',
    'Number',
    'RegExp',
    'String',
    'Undefined',
  ];

  for (let i = 0, l = knownInternalShapes.length; i < l; i++) {
    addTypeShape(knownInternalShapes[i]);
  }

  function compareShape(shape, object) {
    if (!shape) {
      return false;
    }
    if (Shape.isShape(shape)) {
      return shape.checker(object);
    }
    switch (typeOf(shape)) {
      case 'object':
        return compareShape(InternalShapes.Object(shape), object);
      case 'array':
        // eslint-disable-next-line new-cap
        return compareShape(InternalShapes.ArrayStructure(shape), object);
      default:
        return false;
    }
  }

  /**
   * Represents a wrongful expectation.
   *
   * @class
   * @extends Error
   * @param options - The error object options.
   */
  function ExpectationError(options) {
    if (!(this instanceof ExpectationError)) {
      return new ExpectationError(options);
    }
    this.name = 'ExpectationError';
    this.operator = options.operator;
    this.actual = options.actual;
    this.expected = options.expected;
    this.description = options.description;
    this.message = options.message || this.toString();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, options.stackFn || ExpectationError);
    }
  }
  ExpectationError.prototype = new Error();
  ExpectationError.prototype.constructor = Error;

  /**
   * Used for JSON.stringify to format the items into a readable value.
   *
   * @private
   * @param key - The key of the property.
   * @param value - The value to replace.
   * @returns The formatted value.
   */
  function replacer(key, value) {
    if (value === undefined) {
      return `${value}`;
    } else if (
      typeof value === 'number' &&
      (isNaN(value) || !isFinite(value))
    ) {
      return value.toString();
    } else if (typeof value === 'function' || value instanceof RegExp) {
      return value.toString();
    } else if (value instanceof Shape) {
      return value.name;
    }
    return value;
  }

  /**
   * Returns the string representation of the error.
   *
   * @returns The string representation of the error.
   */
  ExpectationError.prototype.toString = function () {
    if (this.message) {
      return `${this.name}: ${this.message}`;
    }
    return [
      `${this.name}: Expected`,
      this.description,
      JSON.stringify(this.actual, replacer),
      this.operator,
      this.expected !== NULL_VALUE
        ? JSON.stringify(this.expected, replacer)
        : '',
    ].join(' ');
  };

  let hasDefineProperty = false;
  try {
    Object.defineProperty({}, 'test', {value: 1});
    hasDefineProperty = true;
  } catch (e) {
    // Noop
  }

  /**
   * Represents an expectation.
   *
   * @class
   * @param actual - The actual value to test.
   * @param description - The value to test.
   */
  function Expectation(actual, description) {
    this._actual = actual;
    this._description = description;
    if (this._declareNot) {
      this.not = new ReversedExpectation(actual, description);
    }
  }

  const notGetter = function () {
    return this._not || (this._not = new ReversedExpectation(this._actual));
  };

  // For environments that support getters, we define getters for the 'not'
  // property.
  if (hasDefineProperty) {
    Object.defineProperty(Expectation.prototype, 'not', {get: notGetter});
  } else if (typeof Expectation.prototype.__defineGetter__ === 'function') {
    Expectation.prototype.__defineGetter__('not', notGetter);
  } else {
    Expectation.prototype._declareNot = true;
  }

  /**
   * Represents an expectation whose matchers are reversed. Used primarily as
   * the not value in a regular Expectation.
   *
   * @class
   * @extends Expectation
   * @param actual - The actual value to test.
   * @param description - The value to test.
   */
  function ReversedExpectation(actual, description) {
    this._actual = actual;
    this._description = description;
  }

  function PromisedExpectation(actual, description) {
    if (!actual || typeOf(actual.then) !== 'function') {
      throw new TypeError('Expected a promise.');
    }
    if (this._declareNot) {
      this.not = new ReversedPromisedExpectation(actual, description);
    }
    this._promise = Promise.resolve(actual);
    this._description = description;
  }

  const promisedNotGetter = function () {
    return (
      this._not || (this._not = new ReversedPromisedExpectation(this._promise))
    );
  };

  PromisedExpectation.prototype.then = function (resolveFn, rejectFn) {
    return this._promise.then(resolveFn, rejectFn);
  };

  PromisedExpectation.prototype.catch = function (rejectFn) {
    return this._promise.then(null, rejectFn);
  };

  // For environments that support getters, we define getters for the 'not'
  // property.
  if (hasDefineProperty) {
    Object.defineProperty(PromisedExpectation.prototype, 'not', {
      get: promisedNotGetter,
    });
  } else if (typeof Expectation.prototype.__defineGetter__ === 'function') {
    PromisedExpectation.prototype.__defineGetter__('not', promisedNotGetter);
  } else {
    PromisedExpectation.prototype._declareNot = true;
  }

  function ReversedPromisedExpectation(value, description) {
    this._promise = value;
    this._description = description;
  }

  /**
   * Returns the human-readable representation of a camel-cased string.
   *
   * @private
   * @param str - The camel-cased string.
   * @returns The human-readable representation.
   */
  function makeHumanReadable(str) {
    return str
      .replace(/[A-Z]/g, function (match) {
        return ` ${match.toLowerCase()}`;
      })
      .replace(/\Wna\Wn/g, ' NaN');
  }

  function objectAssign(target, source) {
    if (source) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  /**
   * Applies a matcher to a set of arguments.
   *
   * @private
   * @param name - The name of the matcher.
   * @param matcher - The matcher function.
   * @param asNot - If set to true, the matcher will be applied as a "not matcher."
   * @param value - The expected value.
   * @returns A joiner.
   */
  function applyMatcher(name, matcher, asNot, value) {
    let expected = arguments.length === 4 ? value : NULL_VALUE;
    let errorProperties = {};
    const context = {
      setErrorProperties: function (errProps) {
        errorProperties = errProps;
      },
      setExpected: function (_value) {
        expected = _value;
      },
    };
    if (!!matcher.call(context, this._actual, value) !== asNot) {
      return {
        and: this,
      };
    }
    throw new ExpectationError(
      objectAssign(
        {
          description: this._description,
          operator: (asNot ? 'not ' : '') + makeHumanReadable(name),
          actual: this._actual,
          expected: expected,
          stackFn: this[name],
        },
        errorProperties
      )
    );
  }

  /**
   * Applies a promised matcher to a set of arguments.
   *
   * @private
   * @param name - The name of the matcher.
   * @param matcher - The matcher function.
   * @param asNot - If set to true, the matcher will be applied as a "not matcher."
   * @param value - The expected value.
   * @returns A joiner.
   */
  function applyPromisedMatcher(name, matcher, asNot, value) {
    let expected = arguments.length === 4 ? value : NULL_VALUE;
    const context = {
      setExpected: function (_value) {
        expected = _value;
      },
    };
    const caller = function (actual) {
      if (!!matcher.call(context, actual, value) !== asNot) {
        return actual;
      }
      throw new ExpectationError({
        operator: (asNot ? 'not ' : '') + makeHumanReadable(name),
        actual: actual,
        expected: expected,
        stackFn: this[name],
      });
    };
    const retValue = this._promise.then(caller, caller);
    retValue.and = new PromisedExpectation(retValue);
    return retValue;
  }

  /**
   * Adds a matcher.
   *
   * @private
   * @param name - The name of the matcher.
   * @param matcher - The matcher function.
   */
  function addMatcher(name, matcher) {
    Expectation.prototype[name] = partial(applyMatcher, name, matcher, false);
    ReversedExpectation.prototype[name] = partial(
      applyMatcher,
      name,
      matcher,
      true
    );
    PromisedExpectation.prototype[name] = partial(
      applyPromisedMatcher,
      name,
      matcher,
      false
    );
    ReversedPromisedExpectation.prototype[name] = partial(
      applyPromisedMatcher,
      name,
      matcher,
      true
    );
  }

  /**
   * Creates an alias to a matcher.
   *
   * @param name - The name of the matcher to alias.
   * @param alias - The new name for the matcher.
   */
  function aliasMatcher(name, alias) {
    if (!Expectation.prototype[name]) {
      return;
    }
    const caller = function () {
      return this[name].apply(this, arguments);
    };
    Expectation.prototype[alias] = caller;
    ReversedExpectation.prototype[alias] = caller;
    PromisedExpectation.prototype[alias] = caller;
    ReversedPromisedExpectation.prototype[alias] = caller;
  }

  /**
   * Adds multiple matchers
   *
   * @param matchers - The matchers to add.
   */
  function addMatchers(matchers) {
    for (const name in matchers) {
      if (!matchers.hasOwnProperty(name)) {
        continue;
      }
      addMatcher(name, matchers[name]);
    }
  }

  // Default Matchers

  addMatchers(
    /**
     * @lends Expectation.prototype
     */ {
      /**
       * Returns whether the actual value is identical to the expected value.
       * Uses the `===` operator.
       *
       * @param actual - The actual value.
       * @param expected - The value to compare the original value against.
       * @returns True if the actual value and the expected value are strictly identical.
       */
      toBe: function (actual, expected) {
        return actual === expected;
      },

      /**
       * Returns whether the original value is equal to the expected value. Uses
       * the `==` operator.
       *
       * @param actual - The actual value.
       * @param expected - The value to compare the original value against.
       * @returns True if the acutal value and expected value are equal.
       */
      toEqual: function (actual, expected) {
        // eslint-disable-next-line eqeqeq
        return actual == expected;
      },

      /**
       * Returns whether the original value is an instance of the constructor
       * function passed.
       *
       * @param actual - The actual value.
       * @param constructor - The constructor function to check against.
       * @returns True if the actual value is an instance of the contructor.
       */
      toBeAnInstanceOf: function (actual, constructor) {
        if (typeOf(constructor) !== 'function') {
          throw new ExpectationError({
            message:
              'toBeAnInstanceOf matcher requires a constructor function.',
          });
        }
        return instanceOf(actual, constructor);
      },

      /**
       * Returns whether the original value is of the passed type-string.
       *
       * @param actual - The actual value.
       * @param type - The type name in lowercase.
       * @returns True if the actual value has a type string equal to the type argument.
       */
      toBeOfType: function (actual, type) {
        return typeOf(actual) === type;
      },

      /**
       * Returns whether the original value is an object.
       *
       * Note that this will be false if the original value is an array.
       *
       * @param actual - The actual value.
       * @returns - True if the actual value is an object.
       */
      toBeObject: function (actual) {
        return typeOf(actual) === 'object';
      },

      /**
       * Returns whether the original value is a function.
       *
       * @param actual - The actual value.
       * @returns True if the actual value is a function.
       */
      toBeFunction: function (actual) {
        return typeOf(actual) === 'function';
      },

      /**
       * Returns whether the original value is an array.
       *
       * @param actual - The actual value.
       * @returns True if the actual value is an array.
       */
      toBeArray: function (actual) {
        return typeOf(actual) === 'array';
      },

      /**
       * Returns whether the original value is a string.
       *
       * @param actual - The actual value.
       * @returns True if the actual value is a string.
       */
      toBeString: function (actual) {
        return typeOf(actual) === 'string';
      },

      /**
       * Returns whether the original value is a number.
       *
       * @param actual - The actual value.
       * @returns - True if the actual value is a number.
       */
      toBeNumber: function (actual) {
        return typeOf(actual) === 'number';
      },

      /**
       * Returns whether the original value is a boolean.
       *
       * @param actual - The actual value.
       * @returns True if the actual value is a boolean.
       */
      toBeBoolean: function (actual) {
        return typeOf(actual) === 'boolean';
      },

      /**
       * Returns whether the original value is null.
       *
       * @param actual - The actual value.
       * @returns True if the actual value is `null`
       */
      toBeNull: function (actual) {
        return actual === null;
      },

      /**
       * Returns whether the original value is undefined.
       *
       * @param actual - The actual value.
       * @returns True if the actual value is undefined.
       */
      toBeUndefined: function (actual) {
        return actual === undefined;
      },

      /**
       * Returns whether the original value is NaN.
       *
       * @param actual - The actual value.
       * @returns True if the actual value is NaN.
       */
      toBeNaN: function (actual) {
        return isNaN(actual);
      },

      /**
       * Returns whether the original value is the boolean value `true`.
       *
       * Note that this function does not cast the original value into a boolean.
       *
       * @param actual - The actual value.
       * @returns - True if the actual value is the boolean `true`
       */
      toBeTrue: function (actual) {
        return actual === true;
      },

      /**
       * Returns whether the original value is the boolean value `false`.
       *
       * Note that this function does not cast the original value into a boolean.
       *
       * @param actual - The actual value.
       * @returns - True if the actual value is the boolean `false`
       */
      toBeFalse: function (actual) {
        return actual === false;
      },

      /**
       * Returns whether the original value is "truthy."
       *
       * A truthy value is any javascript value that can be cast into the
       * boolean `true` value.
       *
       * @param actual - The actual value.
       * @returns True if the value can be casted to the boolean value `true`
       */
      toBeTruthy: function (actual) {
        return !!actual === true;
      },

      /**
       * Returns whether the original value is "falsy."
       *
       * A falsy value is any javascript value that can be cast into the boolean
       * `false` value.
       *
       * @param actual - The actual value.
       * @returns True if the value can be casted to the boolean value `false`
       */
      toBeFalsy: function (actual) {
        return !!actual === false;
      },

      /**
       * Returns whether the actual value has the given length.
       *
       * For strings, arrays, arguments and any object value that has a `length`
       * property, the value's `length` property will be checked. For objects
       * without a `length` property, the number of the object's keys will be checked.
       *
       * @param actual - The actual value.
       * @param length - The expected length.
       * @returns True if the value has the expected length.
       */
      toHaveLength: function (actual, length) {
        const type = typeOf(actual);
        switch (type) {
          case 'string':
          case 'array':
          case 'arguments':
            return actual.length === length;
          case 'object':
            return (
              ('length' in actual
                ? actual.length
                : Object.keys(actual).length) === length
            );
          default:
            return false;
        }
      },

      /**
       * Returns whether the actual value has a length of 0.
       *
       * For strings, arrays, arguments and any object value that has a `length`
       * property, the value's `length` property will be checked. For objects
       * without a `length` property, the number of the object's keys will be checked
       *
       * @param actual - The actual value.
       * @returns - True if the value is empty.
       */
      toBeEmpty: function (actual) {
        const type = typeOf(actual);
        switch (type) {
          case 'string':
          case 'array':
          case 'arguments':
            return !actual.length;
          case 'object':
            return 'length' in actual
              ? !actual.length
              : !Object.keys(actual).length;
          default:
            return false;
        }
      },

      /**
       * Returns whether the original object value has a member of a particular name.
       *
       * @param actual - The actual value.
       * @param name - The name of the member.
       * @returns True if the value has a member of the provided name.
       */
      toHaveMember: function (actual, name) {
        try {
          return name in actual;
        } catch (e) {
          return false;
        }
      },

      /**
       * Matches like toHaveMember, but only checks for members that are the
       * value's own (i.e., not inherited).
       *
       * @param actual - The actual value.
       * @param name - The name of the member.
       * @returns True if the value has its own member of the provide name.
       */
      toHaveOwnMember: function (actual, name) {
        try {
          return actual.hasOwnProperty(name) && name in actual;
        } catch (e) {
          return false;
        }
      },

      /**
       * Returns whether the original object value has a property with the name passed.
       *
       * Unlike `toHaveMember`, this function's definition of "property" does
       * not include function members (i.e., methods).
       *
       * @param actual - The actual value.
       * @param name - The name of the property.
       * @returns - True if the value has the property provided.
       */
      toHaveProperty: function (actual, name) {
        try {
          return name in actual && typeOf(actual[name]) !== 'function';
        } catch (e) {
          return false;
        }
      },

      /**
       * Matches like toHaveProperty, but only checks for properties that are
       * the value's own (i.e., not inherited).
       *
       * @param actual - The actual value.
       * @param name - The name of the property.
       * @returns - True if the value has the own property provided.
       */
      toHaveOwnProperty: function (actual, name) {
        try {
          return (
            actual.hasOwnProperty(name) &&
            name in actual &&
            typeOf(actual[name]) !== 'function'
          );
        } catch (e) {
          return false;
        }
      },

      /**
       * Returns whether the original object value has a method with the name passed.
       *
       * Unlike `toHaveMember`, this matcher only checks for function members.
       *
       * @param actual - The actual value.
       * @param name - The name of the method.
       * @returns - True if the value has a function property of the name provided.
       */
      toHaveMethod: function (actual, name) {
        try {
          return name in actual && typeOf(actual[name]) === 'function';
        } catch (e) {
          return false;
        }
      },

      /**
       * Matches like toHaveMethod, but only checks for methods that are the
       * value's own (i.e., not inherited).
       *
       * @param actual - The actual value.
       * @param name - The name of the method.
       * @returns - True if the value has an own method function property of the
       *   name provided.
       */
      toHaveOwnMethod: function (actual, name) {
        try {
          return (
            actual.hasOwnProperty(name) &&
            name in actual &&
            typeOf(actual[name]) === 'function'
          );
        } catch (e) {
          return false;
        }
      },

      /**
       * Returns whether the original value is equivalent in composition to the
       * passed value.
       *
       * @param actual - The actual value.
       * @param expected - The value to check against.
       * @returns True if the actual and expected value have similar structures.
       */
      toBeLike: function (actual, expected) {
        return deepEqual(actual, expected);
      },

      toHaveShape: function (actual, shape) {
        if (!compareShape(shape, actual)) {
          this.setExpected(JSON.parse(JSON.stringify(shape, replacer)));
          return false;
        }
        return true;
      },

      /**
       * Returns whether the actual function value has thrown.
       *
       * This matcher can be used without passing the `error` argument, in which
       * case the matcher only checks if the actual value throws.
       *
       * Optionally, one could pass an `error` argument that could either be a
       * string, a regular expression or a constructor function:
       *
       * - If the `error` argument is a string, the `error` argument is compared
       *   against the `message` of the actual value's thrown error.
       * - If the `error` argument is a regular expression, the `message` of the
       *   actual value's thrown error is tested against the `error` argument.
       * - If the `error` argument is a constructor function, the `name` property
       *   of the actual value's thrown error is compared against the `name`
       *   value of the constructor function's `prototype`.
       *
       * @param actual - The actual value.
       * @param error - If provided, the matcher will check against this based
       *   on the rules given above.
       * @returns True if the provided function actual value throws an error
       *   similar to the provided error value.
       */
      toThrow: function (actual, error) {
        const errorType = typeOf(error);
        if (error) {
          if (
            errorType === 'function' &&
            (error === Error || error.prototype instanceof Error)
          ) {
            this.setExpected(error.prototype.name);
          } else {
            this.setExpected(error);
          }
        }

        if (typeOf(actual) !== 'function') {
          throw new ExpectationError({
            message:
              'The value passed to expect() must be a ' +
              'function when toThrow is used.',
            actual: typeOf(actual),
            expected: 'function',
          });
        }

        let actualError = NULL_VALUE;
        try {
          actual();
        } catch (e) {
          actualError = e;
        }
        if (actualError === NULL_VALUE) {
          this.setErrorProperties({
            message: 'Expected function to throw',
            actual: null,
            expected: error,
          });
          return false;
        }

        if (!error) {
          return true;
        }
        if (!(actualError instanceof Error)) {
          this.setErrorProperties({
            message: `Expected the thrown value to inherit from Error, got ${typeOf(
              actualError
            )}`,
            actual: actualError,
            expected: error,
          });
          return false;
        }
        switch (errorType) {
          case 'string': {
            if (actualError.message === error) {
              return true;
            }
            this.setErrorProperties({
              message:
                'Expected function to throw an error with a message ' +
                'that match the expected string',
              actual: actualError.message,
              expected: error,
            });
            return false;
          }
          case 'regexp': {
            if (error.test(actualError.message)) {
              return true;
            }
            this.setErrorProperties({
              message:
                'Expected function to throw an error with a message that ' +
                'match the expected regexp pattern',
              actual: actualError.message,
              expected: error.toString(),
            });
            return false;
          }
          case 'function':
            return actualError.name === error.prototype.name;
          default:
            return false;
        }
      },

      /**
       * Returns whether the actual value matches a regular expression.
       *
       * @param actual - The actual value.
       * @param expression - The regular expression to check.
       * @returns True if the provided string value matches the regular expression value.
       */
      toMatch: function (actual, expression) {
        this.setExpected(expression.toString());
        return expression.test(actual);
      },
    }
  );

  /**
   * Aliases so method names really match proper English articles.
   */
  aliasMatcher('toBeBoolean', 'toBeABoolean');
  aliasMatcher('toBeFunction', 'toBeAFunction');
  aliasMatcher('toBeArray', 'toBeAnArray');
  aliasMatcher('toBeObject', 'toBeAnObject');
  aliasMatcher('toBeNumber', 'toBeANumber');
  aliasMatcher('toBeString', 'toBeAString');

  /**
   * The main expectation function.
   *
   * @param actual - The actual value.
   * @param description - The value to test.
   * @returns An expectation object.
   */
  function expect(actual, description) {
    return new Expectation(actual, description);
  }

  expect.promised = function (actual, description) {
    return new PromisedExpectation(actual, description);
  };

  /**
   * A representation of a null value used as a placeholder for user input.
   *
   * @type {Object}
   */
  expect.NULL_VALUE = NULL_VALUE;

  /**
   * Returns the type of a value.
   *
   * @param {any} value - The value.
   * @returns {string} The string type of the value.
   */
  expect.typeOf = typeOf;

  /**
   * Used to forcefully fail an expectation.
   *
   * @param message - An optional message.
   */
  expect.fail = function (message) {
    throw new ExpectationError({
      message: message || 'Force failed.',
      stackFn: expect.fail,
    });
  };

  /**
   * Adds a matcher.
   *
   * @param {string} name - The name of the matcher.
   * @param {module:expectacle.MatcherFunction} matcher - The matcher function.
   */
  expect.addMatcher = addMatcher;

  expect.shape = InternalShapes;

  /**
   * Adds multiple matchers
   *
   * @param {Object<string, module:expectacle.MatcherFunction} matchers - The
   *   matchers to add.
   */
  expect.addMatchers = addMatchers;

  // Export
  if (typeof module !== 'undefined') {
    module.exports = expect;
  } else {
    exports.expect = expect;
  }
})(typeof exports !== 'undefined' ? exports : this);
