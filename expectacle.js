/**
 *
 * The MIT License
 *
 * Copyright (c) 2014 Mark Obcena <http://keetology.com>
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
 *
 */
(function(exports) {

  var slice = Array.prototype.slice;
  var toString = Object.prototype.toString;

  /**
   * @typedef
   * @type {function}
   * @param {*} expected The expected value.
   * @param {*} received The received value.
   * @return {boolean} True if the expected value passes the check, false
   *     otherwise.
   */
  var MatcherFunction;

  /**
   * Used as a stand-in value for things that are not supposed to exist.
   *
   * @const
   */
  var NULL_VALUE = {};

  /**
   * A mapping of known types used in the typeOf function.
   *
   * @type {Object.<string, string>}
   * @private
   */
  var knownTypes = {
    '[object Arguments]': 'arguments',
    '[object Array]': 'array',
    '[object Boolean]': 'boolean',
    '[object Date]': 'date',
    '[object Function]': 'function',
    '[object Number]': 'number',
    '[object Object]': 'object',
    '[object RegExp]': 'regexp',
    '[object String]': 'string'
  };

  /**
   * A regular expression used to get the typename of an object.
   *
   * @type {RegExp}
   * @private
   */
  var typeMatcher = /\[object\s(.*)\]/;

  /**
   * Returns the type of an item as a string.
   *
   * @param {*} item The item to test.
   * @return {string} The type of the item as a string.
   * @private
   */
  function typeOf(item) {
    if (item === null) {
      return 'null';
    }
    if (item === undefined) {
      return 'undefined';
    }
    var str = toString.call(item);
    if (str in knownTypes) {
      return knownTypes[str];
    } else {
      var type = str.replace(typeMatcher, '$1').toLowerCase();
      return (knownTypes[str] = type);
    }
  }

  /**
   * Checks whether the item is an instance of a type.
   *
   * @param {*} item The item to check.
   * @param {function} type The constructor function to check.
   * @return {boolean} True if the item is an instance of the type, false
   *     otherwise.
   * @private
   */
  function instanceOf(item, type) {
    var itemType = typeOf(item);
    if (itemType == 'string' || itemType == 'number' || itemType == 'boolean') {
      item = Object(item);
    }
    return item instanceof type;
  }

  /**
   * Binds arguments to a function without changing the this value.
   *
   * @param {function} fn The function to bind.
   * @param {..*} args A variable-length list of arguments to pass.
   * @return {function} The function with the arguments bound.
   * @private
   */
  function partial(fn, args) {
    args = slice.call(arguments, 1);
    return function() {
      return fn.apply(this, args.concat(slice.call(arguments)));
    };
  }

  /**
   * The NodeJS assert module's objEquiv function, with the dependence on
   * microfunctions removed.
   *
   * @private
   */
  function objEquiv(a, b) {
    if (a == null || b == null) {
      return false;
    }
    if (a.prototype !== b.prototype) {
      return false;
    }
    if (typeOf(a) == 'arguments') {
      if (!typeOf(b) != 'arguments') {
        return false;
      }
      a = pSlice.call(a);
      b = pSlice.call(b);
      return deepEqual(a, b);
    }
    try {
      var ka = Object.keys(a);
      var kb = Object.keys(b);
    } catch (e) {
      return false;
    }
    if (ka.length != kb.length) {
      return false;
    }
    ka.sort();
    kb.sort();
    var key, i;
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i]) {
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
   * The NodeJS assert module's deepEqual function, with the buffer test
   * removed.
   *
   * @private
   */
  function deepEqual(actual, expected) {
    if (actual === expected) {
      return true;
    } else if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();
    } else if (actual instanceof RegExp && expected instanceof RegExp) {
      return actual.source === expected.source &&
             actual.global === expected.global &&
             actual.multiline === expected.multiline &&
             actual.lastIndex === expected.lastIndex &&
             actual.ignoreCase === expected.ignoreCase;
    } else if (typeof actual != 'object' && typeof expected != 'object') {
      return actual == expected;
    } else {
      return objEquiv(actual, expected);
    }
  }

  /**
   * Represents a wrongful expectation.
   *
   * @constructor
   * @param {Object} options The error object options.
   * @extends Error
   */
  function ExpectationError(options) {
    if (!(this instanceof ExpectationError)) {
      return new ExpectationError(options);
    }
    this.name = 'ExpectationError';
    this.operator = options.operator;
    this.expected = options.expected;
    this.received = options.received;
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
   * @param {string} key The key of the property.
   * @param {*} value The value to replace.
   * @return {*} The formatted value.
   * @private
   */
  function replacer(key, value) {
    if (value === undefined) {
      return '' + value;
    } else if (typeof value === 'number'
               && (isNaN(value) || !isFinite(value))) {
      return value.toString();
    } else if (typeof value === 'function' || value instanceof RegExp) {
      return value.toString();
    }
    return value;
  }

  /**
   * Returns the string representation of the error.
   *
   * @return {string} The string representation of the error.
   */
  ExpectationError.prototype.toString = function() {
    if (this.message) {
      return this.name + ': ' + this.message;
    } else {
      return [
        this.name + ': Expected',
        JSON.stringify(this.expected, replacer),
        this.operator,
        (this.received != NULL_VALUE) ?
            JSON.stringify(this.received, replacer) :
            ''
      ].join(' ');
    }
  };

  /**
   * Represents an expectation.
   *
   * @constructor
   * @param {*} value The value to test.
   */
  function Expectation(value) {
    this._expected = value;
    if (this._declareNot) {
      this.not = new ReversedExpectation(value);
    }
  }

  var hasDefineProperty = false;
  try {
    Object.defineProperty({}, 'test', {value: 1});
    hasDefineProperty = true;
  } catch(e) {
  }

  var notGetter = function() {
    return this._not || (this._not = new ReversedExpectation(this._expected));
  };


  // For environments that support getters, we define getters for the 'not'
  // property.
  if (hasDefineProperty) {
    Object.defineProperty(Expectation.prototype, 'not', {get: notGetter });
  } else if (typeof Expectation.prototype.__defineGetter__ == 'function') {
    Expectation.prototype.__defineGetter__('not', notGetter);
  } else {
    Expectation.prototype._declareNot = true;
  }

  /**
   * Represents an expectation whose matchers are
   * reversed. Used primarily as the not value in
   * a regular Expectation.
   *
   * @constructor
   * @extends Expectation
   * @param {*} value The value to test.
   */
  function ReversedExpectation(value) {
    this._expected = value;
  }

  /**
   * Returns the human-readable representation of a camel-cased string.
   *
   * @param {string} str The camel-cased string.
   * @return {string} The human-readable representation.
   * @private
   */
  function makeHumanReadable(str) {
    return str.replace(/[A-Z]/g, function(match) {
      return ' ' + match.toLowerCase();
    }).replace(/\Wna\Wn/g, ' NaN');
  }

  /**
   * Applies a matcher to a set of arguments.
   *
   * @param {string} name The name of the matcher.
   * @param {module:expectacle.MatcherFunction} matcher The matcher function.
   * @param {boolean} asNot If set to true, the matcher will be applied as a
   *     "not matcher."
   * @param {*} value The received value.
   * @private
   */
  function applyMatcher(name, matcher, asNot, value) {
    var received = arguments.length == 4 ? value : NULL_VALUE;
    var context = {
      setReceived: function(value) {
        received = value;
      }
    };
    if ((!!matcher.call(context, this._expected, value)) != asNot) return;
    throw new ExpectationError({
      operator: (asNot ? 'not ' : '') + makeHumanReadable(name),
      expected: this._expected,
      received: received,
      stackFn: this[name]
    });
  }

  /**
   * Adds a matcher.
   *
   * @param {string} name The name of the matcher.
   * @param {module:expectacle.MatcherFunction} matcher The matcher function.
   * @private
   */
  function addMatcher(name, matcher) {
    Expectation.prototype[name] =
      partial(applyMatcher, name, matcher, false);
    ReversedExpectation.prototype[name] =
      partial(applyMatcher, name, matcher, true);
  }

  /**
   * Adds multiple matchers
   *
   * @param {Object.<string, module:expectacle.MatcherFunction} matchers The
   *     matchers to add.
   */
  function addMatchers(matchers) {
    for (var name in matchers) {
      if (!matchers.hasOwnProperty(name)) {
        continue;
      }
      addMatcher(name, matchers[name]);
    }
  }

  // Default Matchers

  addMatchers(/** @lends Expectation.prototype */ {

    /**
     * Returns whether the original value is identical to the passed value. Uses
     * the `===` operator.
     *
     * @param {*} expected The expected value.
     * @param {*} value The value to compare the original value against.
     * @return {boolean}
     */
    toBe: function(expected, value) {
      return expected === value;
    },

    /**
     * Returns whether the original value is equal to the passed value. Uses the
     * `==` operator.
     *
     * @param {*} expected The expected value.
     * @param {*} value The value to compare the original value against.
     * @return {boolean}
     */
    toEqual: function(expected, value) {
      return expected == value;
    },

    /**
     * Returns whether the original value is an instance of the constructor
     * function passed.
     *
     * @param {*} expected The expected value.
     * @param {function} constructor The constructor function to check against.
     * @return {boolean}
     */
    toBeAnInstanceOf: function(expected, constructor) {
      if (typeOf(constructor) != 'function') {
        throw new ExpectationError({
          message: 'toBeAnInstanceOf matcher requires a constructor function.'
        });
      }
      return instanceOf(expected, constructor);
    },

    /**
     * Returns whether the original value is of the  passed type-string.
     *
     * @param {*} expected The expected value.
     * @param {string} type The type name in lowercase.
     * @return {boolean}
     */
    toBeOfType: function(expected, type) {
      return typeOf(expected) == type;
    },

    /**
     * Returns whether the original value is an object.
     *
     * Note that this will be false if the original value is an array.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeObject: function(expected) {
      return typeOf(expected) == 'object';
    },

    /**
     * Returns whether the original value is a function.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeFunction: function(expected) {
      return typeOf(expected) == 'function';
    },

    /**
     * Returns whether the original value is an array.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeArray: function(expected) {
      return typeOf(expected) == 'array';
    },

    /**
     * Returns whether the original value is a string.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeString: function(expected) {
      return typeOf(expected) == 'string';
    },

    /**
     * Returns whether the original value is a number.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeNumber: function(expected) {
      return typeOf(expected) == 'number';
    },

    /**
     * Returns whether the original value is a boolean.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeBoolean: function(expected) {
      return typeOf(expected) == 'boolean';
    },

    /**
     * Returns whether the original value is null.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeNull: function(expected) {
      return expected === null;
    },

    /**
     * Returns whether the original value is undefined.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeUndefined: function(expected) {
      return expected === undefined;
    },

    /**
     * Returns whether the original value is NaN.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeNaN: function(expected) {
      return isNaN(expected);
    },

    /**
     * Returns whether the original value is the boolean
     * value `true`.
     *
     * Note that this function does not cast the original
     * value into a boolean.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeTrue: function(expected) {
      return expected === true;
    },

    /**
     * Returns whether the original value is the boolean
     * value `false`.
     *
     * Note that this function does not cast the original
     * value into a boolean.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeFalse: function(expected) {
      return expected === false;
    },

    /**
     * Returns whether the original value is "truthy."
     *
     * A truthy value is any javascript value that can be
     * cast into the boolean `true` value.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeTruthy: function(expected) {
      return (!!expected) === true;
    },

    /**
     * Returns whether the original value is "falsy."
     *
     * A falsy value is any javascript value that can be
     * cast into the boolean `false` value.
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeFalsy: function(expected) {
      return (!!expected) === false;
    },

    /**
     * Returns whether the expected value has the given length.
     *
     * For strings, arrays, arguments and any object value that has a `length`
     * property, the value's `length` property will be checked. For objects
     * without a `length` property, the number of the object's keys will be
     * checked.
     *
     * @param {*} expected The expected value.
     * @param {number} length The expected length.
     * @return {boolean}
     */
    toHaveLength: function(expected, length) {
      var type = typeOf(expected);
      switch (type) {
        case 'string':
        case 'array':
        case 'arguments':
          return expected.length === length;
        case 'object':
          return ('length' in expected ?
                      expected.length :
                      Object.keys(expected).length
                 ) == length;
      }
      return false;
    },

    /**
     * Returns whether the expected value has a length of 0.
     *
     * For strings, arrays, arguments and any object value that has a `length`
     * property, the value's `length` property will be checked. For objects
     * without a `length` property, the number of the object's keys will be
     * checked
     *
     * @param {*} expected The expected value.
     * @return {boolean}
     */
    toBeEmpty: function(expected) {
      var type = typeOf(expected);
      switch (type) {
        case 'string':
        case 'array':
        case 'arguments':
          return !expected.length;
        case 'object':
          return 'length' in expected ?
              !expected.length :
              !Object.keys(expected).length;
      }
      return false;
    },

    /**
     * Returns whether the original object value has a member of a particular
     * name.
     *
     * @param {*} expected The expected value.
     * @param {string} name The name of the member.
     * @return {boolean}
     */
    toHaveMember: function(expected, name) {
      try {
        return (name in expected);
      } catch(e) {
        return false;
      }
    },

    /**
     * Matches like toHaveMember, but only checks for members that are the
     * value's own (i.e., not inherited).
     *
     * @param {*} expected The expected value.
     * @param {string} name The name of the member.
     * @return {boolean}
     */
    toHaveOwnMember: function(expected, name) {
      try {
        return (expected.hasOwnProperty(name) && name in expected);
      } catch(e) {
        return false;
      }
    },

    /**
     * Returns whether the original object value has a property with
     * the name passed.
     *
     * Unlike `toHaveMember`, this function's definition of "property"
     * does not include function members (i.e., methods).
     *
     * @param {*} expected The expected value.
     * @param {string} name The name of the property.
     * @return {boolean}
     */
    toHaveProperty: function(expected, name) {
      try {
        return (name in expected) && (typeOf(expected[name]) != 'function');
      } catch(e) {
        return false;
      }
    },

    /**
     * Matches like toHaveProperty, but only checks for properties that are the
     * value's own (i.e., not inherited).
     *
     * @param {*} expected The expected value.
     * @param {string} name The name of the property.
     * @return {boolean}
     */
    toHaveOwnProperty: function(expected, name) {
      try {
        return expected.hasOwnProperty(name) && (name in expected) &&
            (typeOf(expected[name]) != 'function');
      } catch(e) {
        return false;
      }
    },

    /**
     * Returns whether the original object value has a method with
     * the name passed.
     *
     * Unlike `toHaveMember`, this matcher only checks for function members.
     *
     * @param {*} expected The expected value.
     * @param {string} name The name of the method.
     * @return {boolean}
     */
    toHaveMethod: function(expected, name) {
      try {
        return (name in expected) && (typeOf(expected[name]) == 'function');
      } catch(e) {
        return false;
      }
    },

    /**
     * Matches like toHaveMethod, but only checks for methods that are the
     * value's own (i.e., not inherited).
     *
     * @param {*} expected The expected value.
     * @param {string} name The name of the method.
     * @return {boolean}
     */
    toHaveOwnMethod: function(expected, name) {
      try {
        return expected.hasOwnProperty(name) && (name in expected) &&
            (typeOf(expected[name]) == 'function');
      } catch(e) {
        return false;
      }
    },

    /**
     * Returns whether the original value is equivalent in composition
     * to the passed value.
     *
     * @param {*} expected The expected value.
     * @param {*} value The value to check against.
     * @return {boolean}
     */
    toBeLike: function(expected, value) {
      return deepEqual(expected, value);
    },

    /**
     * Returns whether the expected function value has thrown.
     *
     * This matcher can be used without passing the `error` argument, in which
     * case the matcher only checks if the expected value throws.
     *
     * Optionally, one could pass an `error` argument that could either be a
     * string, a regular expression or a constructor function:
     *
     * - If the `error` argument is a string, the `error` argument is compared
     *   against the `message` of the expected value's thrown error.
      * - If the `error` argument is a regular expression, the `message` of the
      *   expected value's thrown error is tested against the `error` argument.
      * - If the `error` argument is a constructor function, the `name` property
      *   of the expected value's thrown error is compared against the `name`
      *   value of the constructor function's `prototype`.
      *
     * @param {*} expected The expected value.
     * @param {string?|regexp?|function?} error If provided, the matcher will
     *     check against this based on the rules given above.
     * @return {boolean}
     */
    toThrow: function(expected, error) {
      var errorType = typeOf(error);
      if (error) {
        if (errorType == 'function' &&
            (error == Error || error.prototype instanceof Error)) {
          this.setReceived(error.prototype.name);
        } else {
          this.setReceived(error);
        }
      }
      if (typeOf(expected) != 'function') {
        return false;
      }
      try {
        expected();
        return false;
      } catch(e) {
        if (!error) return true;
        switch (errorType) {
          case 'string':
            return e.message == error;
            break;
          case 'regexp':
            return error.test(e.message);
            break;
          case 'function':
            return e.name == error.prototype.name;
            break;
        }
      }
    },

    /**
     * Returns whether the expected value matches a regular expression.
     *
     * @param {*} expected The expected value.
     * @param {regexp} expression The regular expression to check.
     * @return {boolean}
     */
    toMatch: function(expected, expression) {
      this.setReceived(expression.toString());
      return expression.test(expected);
    }

  });

  /**
   * The main expectation function.
   */
  function expect(value) {
    return new Expectation(value);
  }

  /**
   * A representation of a null value used as a placeholder for user input.
   *
   * @type {Object}
   */
  expect.NULL_VALUE = NULL_VALUE;

  /**
   * Returns the type of a value.
   *
   * @param {*} value The value.
   * @return {string} The string type of the value.
   */
  expect.typeOf = typeOf;

  /**
   * Used to forcefully fail an expectation.
   *
   * @param {string?} opt_message An optional message.
   */
  expect.fail = function(opt_message) {
    throw new ExpectationError({
      message: opt_message || 'Force failed.',
      stackFn: expect.fail
    });
  };

  /**
   * Adds a matcher.
   *
   * @param {string} name The name of the matcher.
   * @param {module:expectacle.MatcherFunction} matcher The matcher function.
   */
  expect.addMatcher = addMatcher;

  /**
   * Adds multiple matchers
   *
   * @param {Object.<string, module:expectacle.MatcherFunction} matchers The
   *     matchers to add.
   */
  expect.addMatchers = addMatchers;

  // Export
  if (typeof module != 'undefined') {
    module.exports = expect;
  } else {
    exports.expect = expect;
  }

})(typeof exports != 'undefined' ? exports : this);
