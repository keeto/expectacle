(function(exports) {

  var slice = Array.prototype.slice;
  var toString = Object.prototype.toString;

  /**
   * Used as a stand-in value for things that are not supposed to exist.
   *
   * @const
   * @private
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
   * The NodeJS assert module's objEquiv function, with the
   * dependence on microfunctions removed.
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
   * The NodeJS assert module's deepEqual function, with the
   * buffer test removed.
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
   * Truncates a string.
   *
   * @private
   */
  function truncate(s, n) {
    return (typeof s != 'string') ? s : s.length < n ? s : s.slice(0, n);
  }

  /**
   * Returns the string representation of the error.
   */
  ExpectationError.prototype.toString = function() {
    if (this.message) {
      return this.name + ': ' + this.message;
    } else {
      return [
        this.name + ': Expected',
        truncate(JSON.stringify(this.expected, replacer), 128),
        this.operator,
        (this.received != NULL_VALUE) ?
            truncate(JSON.stringify(this.received, replacer), 128) :
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
   * @private
   */
  function makeHumanReadable(str) {
    return str.replace(/[A-Z]/g, function(match) {
      return ' ' + match.toLowerCase();
    }).replace(/\Wna\Wn/g, ' NaN');
  }

  /**
   * @private
   */
  function applyMatcher(name, matcher, value) {
    this._received = arguments.length == 3 ? value : NULL_VALUE;
    if (matcher.call(this, value)) return;
    throw new ExpectationError({
      operator: makeHumanReadable(name),
      expected: this._expected,
      received: this._received,
      stackFn: this[name]
    });
  }

  /**
   * @private
   */
  function applyNotMatcher(name, matcher, value) {
    this._received = arguments.length == 3 ? value : NULL_VALUE;
    if (!matcher.call(this, value)) return;
    throw new ExpectationError({
      operator: 'not ' + makeHumanReadable(name),
      expected: this._expected,
      received: this._received,
      stackFn: this[name]
    });
  }

  /**
   * @private
   */
  function addMatcher(name, matcher) {
    Expectation.prototype[name] =
      partial(applyMatcher, name, matcher);
    ReversedExpectation.prototype[name] =
      partial(applyNotMatcher, name, matcher);
  }

  /**
   * @private
   */
  function addMatchers(matchers) {
    for (var name in matchers) {
      if (!matchers.hasOwnProperty(name)) {
        continue;
      }
      addMatcher(name, matchers[name]);
    }
  }

  /**
   * The matcher functions used to test items.
   *
   * @type {Object.<string, key>}
   */
  addMatchers(/** @lends Expectation.prototype */ {

    /**
     * Returns whether the original value is identical to the
     * passed value. Uses the `===` operator.
     *
     * @param {*} value The value to compare the original
     *     value against.
     */
    toBe: function(value) {
      return this._expected === value;
    },

    /**
     * Returns whether the original value is equal to the
     * passed value. Uses the `==` operator.
     *
     * @param {*} value The value to compare the original
     *     value against.
     */
    toEqual: function(value) {
      return this._expected == value;
    },

    /**
     * Returns whether the original value is an instance
     * of the constructor function passed.
     *
     * @param {function} constructor The constructor function to
     *     check against.
     */
    toBeAnInstanceOf: function(constructor) {
      return instanceOf(this._expected, constructor);
    },

    /**
     * Returns whether the original value is of the
     * passed type-string.
     *
     * @param {string} type The type name in lowercase.
     */
    toBeOfType: function(type) {
      return typeOf(this._expected) == type;
    },

    /**
     * Returns whether the original value is an object.
     * Note that this will be false if the original value
     * is an array.
     */
    toBeObject: function() {
      return typeOf(this._expected) == 'object';
    },

    /**
     * Returns whether the original value is a function.
     */
    toBeFunction: function() {
      return typeOf(this._expected) == 'function';
    },

    /**
     * Returns whether the original value is an array.
     */
    toBeArray: function() {
      return typeOf(this._expected) == 'array';
    },

    /**
     * Returns whether the original value is a string.
     */
    toBeString: function() {
      return typeOf(this._expected) == 'string';
    },

    /**
     * Returns whether the original value is a number.
     */
    toBeNumber: function() {
      return typeOf(this._expected) == 'number';
    },

    /**
     * Returns whether the original value is a boolean.
     */
    toBeBoolean: function() {
      return typeOf(this._expected) == 'boolean';
    },

    /**
     * Returns whether the original value is null.
     */
    toBeNull: function() {
      return this._expected === null;
    },

    /**
     * Returns whether the original value is undefined.
     */
    toBeUndefined: function() {
      return this._expected === undefined;
    },

    /**
     * Returns whether the original value is NaN.
     */
    toBeNaN: function() {
      return isNaN(this._expected);
    },

    /**
     * Returns whether the original value is the boolean
     * value `true`.
     *
     * Note that this function does not cast the original
     * value into a boolean.
     */
    toBeTrue: function() {
      return this._expected === true;
    },

    /**
     * Returns whether the original value is the boolean
     * value `false`.
     *
     * Note that this function does not cast the original
     * value into a boolean.
     */
    toBeFalse: function() {
      return this._expected === false;
    },

    /**
     * Returns whether the original value is "truthy."
     *
     * A truthy value is any javascript value that can be
     * cast into the boolean `true` value.
     */
    toBeTruthy: function() {
      return (!!this._expected) === true;
    },

    /**
     * Returns whether the original value is "falsy."
     *
     * A falsy value is any javascript value that can be
     * cast into the boolean `false` value.
     */
    toBeFalsy: function() {
      return (!!this._expected) === false;
    },

    /**
     * Returns whether the original value has the given
     * length.
     *
     * For strings, arrays, arguments and any object
     * value that has a `length` property, the value's
     * `length` property will be checked. For objects
     * without a `length` property, the object's keys
     * will be check.
     */
    toHaveLength: function(length) {
      var expected = this._expected;
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
     * Returns whether the original value is empty.
     *
     * For strings, arrays, arguments and any object
     * value that has a `length` property, the value's
     * `length` property will be checked. For objects
     * without a `length` property, the object's keys
     * will be check.
     */
    toBeEmpty: function() {
      var expected = this._expected;
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
     * Returns whether the original object value
     * has a member with the name passed.
     */
    toHaveMember: function(name) {
      try {
        return (name in this._expected);
      } catch(e) {
        return false;
      }
    },

    /**
     * Returns whether the original object value has a property with
     * the name passed.
     *
     * Unlike `toHaveMember`, this function's definition of "property"
     * does not include function properties.
     */
    toHaveProperty: function(name) {
      var expected = this._expected;
      try {
        return (name in expected) && (typeOf(expected[name]) != 'function');
      } catch(e) {
        return false;
      }
    },

    /**
     * Returns whether the original object value has a method with
     * the name passed.
     */
    toHaveMethod: function(name) {
      var expected = this._expected;
      try {
        return (name in expected) && (typeOf(expected[name]) == 'function');
      } catch(e) {
        return false;
      }
    },

    /**
     * Returns whether the original value is equivalent in composition
     * to the passed value.
     */
    toBeLike: function(value) {
      return deepEqual(this._expected, value);
    },

    /**
     * Returns whether the function has thrown.
     */
    toThrow: function(error) {
      var expected = this._expected;
      var errorType = typeOf(error);
      if (error) {
        if (errorType == 'function' &&
            (error == Error || error.prototype instanceof Error)) {
          this._received = error.prototype.name;
        } else {
          this._received = error;
        }
      }
      if (typeOf(expected) != 'function')
        return false;
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
     * Returns whether the expected value matches the expression.
     */
    toMatch: function(expression) {
      this._received = expression.toString();
      return expression.test(this._expected);
    }

  });

  /**
   * The main expectation function.
   */
  function expect(value) {
    return new Expectation(value);
  }

  /**
   * Used to forcefully fail an expectation.
   */
  expect.fail = function(message) {
    throw new ExpectationError({
      message: message || 'Force failed.',
      stackFn: expect.fail
    });
  };

  /**
   * Adds a matcher
   */
  expect.addMatcher = addMatcher;

  /**
   * Adds multiple matchers
   */
  expect.addMatchers = addMatchers;

  // Export
  if (typeof module != 'undefined') {
    module.exports = expect;
  } else {
    exports.expect = expect;
  }

})(typeof exports != 'undefined' ? exports : this);
