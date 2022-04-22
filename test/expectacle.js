/* global Promise */

'use strict';
var expect = require('./../expectacle');

describe('Expectacle', function() {
  describe('Function: expect()', function() {
    it('should return a new expectation object', function() {
      var returnValue = expect();
      if (typeof returnValue !== 'object') {
        throw new Error('Expect returns non-object.');
      }
    });

    it('should return a new expectation object with a not matcher.', function() {
      var returnValue = expect();
      if (typeof returnValue.not !== 'object') {
        throw new Error('Expect returns non-object.');
      }
    });
  });

  describe('Function: expect.fail()', function() {
    it('should throw a new ExpectationError when called.', function() {
      var error = null;
      try {
        expect.fail();
      } catch (e) {
        error = e;
      }
      if (error === null) {
        throw new Error('expect.fail did not throw an error.');
      }
      if (error.name !== 'ExpectationError') {
        throw new Error('expect.fail threw a wrong error.');
      }
    });

    it('should use the passed argument as the error message.', function() {
      var message = 'This is an error message.';
      var error = null;
      try {
        expect.fail(message);
      } catch (e) {
        error = e;
      }
      if (error === null) {
        throw new Error('expect.fail did not throw an error.');
      }
      if (error.message !== message) {
        throw new Error('expect.fail threw a wrong error.');
      }
    });
  });

  describe('Default Matchers', function() {
    describe('toBe Matcher', function() {
      it('should strictly match value to the expected value.', function() {
        var testObj = {};
        try {
          // basic
          expect(1).toBe(1);
          expect('hello world').toBe('hello world');
          expect(true).toBe(true);
          expect(testObj).toBe(testObj);

          // reversed
          expect(1).not.toBe(0);
          expect(1).not.toBe('1');
          expect(1).not.toBe({
            valueOf: function() {
              return 1;
            }
          });

          expect(true).not.toBe(1);
          expect(true).not.toBe('true');
          expect(false).not.toBe(0);
          expect(false).not.toBe('false');
          expect(false).not.toBe(undefined);
          expect(false).not.toBe(null);
          expect(false).not.toBe('');
        } catch (e) {
          throw new Error('expect.toBe failed: ' + e.message);
        }
      });
    });

    describe('toEqual Matcher', function() {
      it('should match value to the expected value, coercing when necessary.', function() {
        var testObj = {};
        try {
          // basic
          expect(1).toEqual(1);
          expect('hello world').toEqual('hello world');
          expect(true).toEqual(true);
          expect(testObj).toEqual(testObj);

          expect(1).toEqual(true);
          expect(1).toEqual('1');
          expect(1).toEqual({
            valueOf: function() {
              return 1;
            }
          });
          expect(1).toEqual({
            toString: function() {
              return '1';
            }
          });

          expect(0).toEqual(false);
          expect(0).toEqual('0');
          expect(0).toEqual({
            valueOf: function() {
              return 0;
            }
          });
          expect(0).toEqual({
            toString: function() {
              return '0';
            }
          });

          expect(false).toEqual('');

          // Works because [] is coerced into a string ([].toString()), and
          // [].toString() is like calling [].join(','): it returns an empty
          // string which is equal to false.
          expect(false).toEqual([]);

          expect(undefined).toEqual(null);
        } catch (e) {
          throw new Error('expect.toBe failed: ' + e.message);
        }
      });
    });

    describe('toBeAnInstanceOf', function() {
      it('should throw an error if called without a function argument.', function(done) {
        try {
          expect(1).toBeAnInstanceOf(1);
          done(
            new Error('toBeAnInstanceOf succeeds without a function argument.')
          );
        } catch (e) {
          done();
        }
      });

      it('should check whether the value is an instance of the expected constructor', function() {
        var TestConstructor = function() {};
        var TestConstructor2 = function() {};
        TestConstructor2.prototype = new TestConstructor();
        try {
          // Base Objects.
          expect(true).toBeAnInstanceOf(Boolean);
          expect(1).toBeAnInstanceOf(Number);
          expect('').toBeAnInstanceOf(String);
          expect({}).toBeAnInstanceOf(Object);
          expect([]).toBeAnInstanceOf(Array);
          expect(/hello/).toBeAnInstanceOf(RegExp);
          expect(function() {}).toBeAnInstanceOf(Function);
          expect(new Date()).toBeAnInstanceOf(Date);

          var testObj = new TestConstructor2();

          expect(testObj).toBeAnInstanceOf(TestConstructor);
          expect(testObj).toBeAnInstanceOf(TestConstructor2);
          expect(testObj).toBeAnInstanceOf(Object);
        } catch (e) {
          throw new Error('toBeAnInstanceOf failed: ' + e.message);
        }
      });
    });

    describe('toBeOfType', function() {
      it('should correctly identify the type of the value.', function() {
        try {
          // Base Objects.
          expect(true).toBeOfType('boolean');
          expect(1).toBeOfType('number');
          expect('').toBeOfType('string');
          expect({}).toBeOfType('object');
          expect([]).toBeOfType('array');
          expect(/hello/).toBeOfType('regexp');
          expect(function() {}).toBeOfType('function');
          expect(new Date()).toBeOfType('date');
          expect(
            (function() {
              return arguments;
            })()
          ).toBeOfType('arguments');
        } catch (e) {
          throw new Error('toBeOfType failed: ' + e.message);
        }
      });
    });

    describe('toBeBoolean', function() {
      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeBoolean();
          done(new Error('toBeBoolean passed on array.'));
        } catch (e) {
          done();
        }
      });

      it('should be aliased as toBeABoolean', function() {
        expect(Boolean()).toBeABoolean();
        expect(null).not.toBeABoolean();
      });
    });

    describe('toBeFunction', function() {
      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeFunction();
          done(new Error('toBeFunction passed on array.'));
        } catch (e) {
          done();
        }
      });

      it('should be aliased as toBeAFunction', function() {
        expect(function() {}).toBeAFunction();
        expect(1).not.toBeAFunction();
      });
    });

    describe('toBeArray', function() {
      it('should fail if the value is an object.', function(done) {
        try {
          expect({}).toBeArray();
          done(new Error('toBeArray passed on object.'));
        } catch (e) {
          done();
        }
      });

      it('should be aliased as toBeAnArray', function() {
        expect([]).toBeAnArray();
        expect(0).not.toBeAnArray();
      });
    });

    describe('toBeObject', function() {
      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeObject();
          done(new Error('toBeObject passed on array.'));
        } catch (e) {
          done();
        }
      });

      it('should be aliased as toBeAnObject', function() {
        expect({}).toBeAnObject();
        expect(null).not.toBeAnObject();
      });
    });

    describe('toBeNumber', function() {
      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeNumber();
          done(new Error('toBeNumber passed on array.'));
        } catch (e) {
          done();
        }
      });

      it('should be aliased as toBeANumber', function() {
        expect(Number()).toBeANumber();
        expect(String()).not.toBeANumber();
      });
    });

    describe('toBeString', function() {
      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeString();
          done(new Error('toBeString passed on array.'));
        } catch (e) {
          done();
        }
      });

      it('should be aliased as toBeAString', function() {
        expect('').toBeAString();
        expect(1).not.toBeAString();
      });
    });

    describe('toHaveLength', function() {
      it("should compare the value with the expected value's length property", function() {
        try {
          expect('hello').toHaveLength(5);
          expect([1, 2]).toHaveLength(2);
          expect(
            (function() {
              return arguments;
            })(1)
          ).toHaveLength(1);
          expect({ length: 50 }).toHaveLength(50);
          expect({ a: 1, b: 2, c: 3 }).toHaveLength(3);
          expect({}).toHaveLength(0);
        } catch (e) {
          throw new Error('toHaveLength failed: ' + e.message);
        }
      });
    });

    describe('toBeEmpty', function() {
      it("should compare the value with the expected value's length property", function() {
        try {
          expect('').toBeEmpty();
          expect([]).toBeEmpty();
          expect(
            (function() {
              return arguments;
            })()
          ).toBeEmpty();
          expect({ length: 0 }).toBeEmpty();
          expect({}).toBeEmpty();
        } catch (e) {
          throw new Error('toBeEmpty failed: ' + e.message);
        }
      });
    });

    describe('toHaveMember', function() {
      it('should fail if the value is inaccessible.', function(done) {
        try {
          expect(null).toHaveMember('toString');
          done(new Error('toHaveMember passed with a null value.'));
        } catch (e) {
          done();
        }
      });

      it('should pass if the member name exists in the object.', function() {
        try {
          expect({}).toHaveMember('toString');
          expect({ hello: 1 }).toHaveMember('hello');
        } catch (e) {
          throw new Error('toHaveMember failed: ' + e.message);
        }
      });
    });

    describe('toHaveOwnMember', function() {
      it('should fail if the member is inherited.', function(done) {
        try {
          expect({}).toHaveOwnMember('toString');
          done(new Error('toHaveMember passed with an inherited member.'));
        } catch (e) {
          done();
        }
      });
    });

    describe('toHaveProperty', function() {
      it('should pass if the property exists in the object.', function() {
        try {
          expect({ hello: 1 }).toHaveProperty('hello');
        } catch (e) {
          throw new Error('toHaveProperty failed: ' + e.message);
        }
      });

      it('should fail for methods.', function(done) {
        try {
          expect({ hello: function() {} }).toHaveProperty('hello');
          done(new Error('toHaveProperty passes with a method.'));
        } catch (e) {
          done();
        }
      });
    });

    describe('toHaveOwnProperty', function() {
      it('should fail for inherited properties.', function(done) {
        var X = function() {};
        X.prototype.y = 1;
        try {
          expect(new X()).toHaveOwnProperty('y');
          done(
            new Error('toHaveOwnProperty passes with an inherited property.')
          );
        } catch (e) {
          done();
        }
      });
    });

    describe('toHaveMethod', function() {
      it('should pass if the method exists in the object.', function() {
        try {
          expect({ hello: function() {} }).toHaveMethod('hello');
          expect({}).toHaveMethod('toString');
        } catch (e) {
          throw new Error('toHaveMethod failed: ' + e.message);
        }
      });

      it('should fail for properties.', function(done) {
        try {
          expect({ hello: 1 }).toHaveMethod('hello');
          done(new Error('toHaveMethod passes with a method.'));
        } catch (e) {
          done();
        }
      });
    });

    describe('toHaveOwnMethod', function() {
      it('should fail for inherited methods.', function(done) {
        var X = function() {};
        X.prototype.y = function() {};
        try {
          expect(new X()).toHaveOwnMethod('y');
          done(new Error('toHaveOwnMethod passes with an inherited method.'));
        } catch (e) {
          done();
        }
      });
    });

    describe('toThrow', function() {
      it('should fail if the function does not throw.', function() {
        var fn = function() {
          return 'x';
        };
        var error = null;
        try {
          expect(fn).toThrow('y');
        } catch (e) {
          error = e;
        }
        if (!error) {
          throw new Error('toThrow passed but was expected to fail.');
        }
        if (error.message !== 'Expected function to throw') {
          throw new Error('Unexpected message: ' + error.message);
        }
        if (error.actual !== null) {
          throw new Error('error.actual should be null.');
        }
        if (error.expected !== 'y') {
          throw new Error('error.expected should be "y".');
        }
      });

      it('should fail if the error message does not match the expected string.', function() {
        var fn = function() {
          throw new Error('x');
        };
        var error = null;
        try {
          expect(fn).toThrow('y');
        } catch (e) {
          error = e;
        }
        if (!error) {
          throw new Error('toThrow passed but was expected to fail.');
        }
        if (
          error.message !==
          'Expected function to throw an error with a message that match the expected string'
        ) {
          throw new Error('Unexpected message: ' + error.message);
        }
        if (error.actual !== 'x') {
          throw new Error(
            'error.actual should be the message from the error that the function throw.'
          );
        }
        if (error.expected !== 'y') {
          throw new Error('error.expected should be "y".');
        }
      });

      it('should fail if the error message does not match the expected regexp.', function() {
        var fn = function() {
          throw new Error('x');
        };
        var error = null;
        try {
          expect(fn).toThrow(/error-id:\d+/i);
        } catch (e) {
          error = e;
        }
        if (!error) {
          throw new Error('toThrow passed but was expected to fail.');
        }
        if (
          error.message !==
          'Expected function to throw an error with a message that match the expected regexp pattern'
        ) {
          throw new Error('Unexpected message: ' + error.message);
        }
        if (error.actual !== 'x') {
          throw new Error(
            'error.actual should be the message from the error that the function throw.'
          );
        }
        if (error.expected !== '/error-id:\\d+/i') {
          throw new Error(
            'error.expected should be a stringified version of the regexp.'
          );
        }
      });

      it('should fail if the the value passed to expect() is not a function.', function() {
        var error = null;
        try {
          expect('x').toThrow();
        } catch (e) {
          error = e;
        }
        if (!error) {
          throw new Error('toThrow passed but was expected to fail.');
        }
        if (
          error.message !==
          'The value passed to expect() must be a function when toThrow is used.'
        ) {
          throw new Error('Unexpected message: ' + error.message);
        }
        if (error.actual !== 'string') {
          throw new Error(
            'error.actual should be the type of the actual value.'
          );
        }
        if (error.expected !== 'function') {
          throw new Error('error.expected should be "function".');
        }
      });

      it('should fail if the the function throws but is expected not to throw.', function() {
        var error = null;
        try {
          expect(function() {
            throw new Error('x');
          }).not.toThrow();
        } catch (e) {
          error = e;
        }
        if (!error) {
          throw new Error('toThrow passed but was expected to fail.');
        }
        if (
          /Expected .+ not to throw/.test(error.message) === false
        ) {
          throw new Error('Unexpected message: ' + error.message);
        }
      });

      it('should pass if the function does not throw and we expected it not to.', function() {
        expect(function() {
          return 'x';
        }).not.toThrow();
      });

      it('should pass if the function throws and we no expected value is used.', function() {
        expect(function() {
          throw new Error('x');
        }).toThrow();
      });

      it('should pass if the error message match the expected string.', function() {
        expect(function() {
          throw new Error('x');
        }).toThrow('x');
      });

      it('should pass if the error message match the expected regexp pattern.', function() {
        expect(function() {
          throw new Error('x');
        }).toThrow(/^x$/);
      });
    });

    describe('toHaveShape', function() {
      it('should known basic shapes', function(done) {
        try {
          expect(
            (function() {
              return arguments;
            })()
            // eslint-disable-next-line new-cap
          ).toHaveShape(expect.shape.Arguments());
          expect([]).toHaveShape(expect.shape.Array());
          expect(true).toHaveShape(expect.shape.Boolean());
          expect(new Date()).toHaveShape(expect.shape.Date());
          expect(function() {}).toHaveShape(expect.shape.Function());
          // eslint-disable-next-line new-cap
          expect(null).toHaveShape(expect.shape.Null());
          expect(1).toHaveShape(expect.shape.Number());
          expect({}).toHaveShape(expect.shape.Object());
          expect(/m/g).toHaveShape(expect.shape.RegExp());
          expect('string').toHaveShape(expect.shape.String());
          // eslint-disable-next-line new-cap
          expect(undefined).toHaveShape(expect.shape.Undefined());
          expect({
            hello: 'world',
            someValue: 1,
            somethingElse: {
              world: {
                what: true
              }
            },
            message: {}
          }).toHaveShape({
            hello: expect.shape.String(),
            someValue: expect.shape.Number(),
            somethingElse: {
              world: {
                what: expect.shape.Boolean()
              }
            },
            message: expect.shape.Object()
          });
          done();
        } catch (e) {
          done(e);
        }
      });

      it('should be able to compare array shapes with a single type', function(done) {
        try {
          expect([1, 2, 3]).toHaveShape(
            expect.shape.Array(expect.shape.Number())
          );
          expect([1, 'string', 3]).not.toHaveShape(
            expect.shape.Array(expect.shape.Number())
          );
          done();
        } catch (e) {
          done(e);
        }
      });

      it('should be able to compare ArrayStructure types.', function(done) {
        try {
          expect([1, 'string']).toHaveShape(
            // eslint-disable-next-line new-cap
            expect.shape.ArrayStructure([
              expect.shape.Number(),
              expect.shape.String()
            ])
          );
          expect([1, 1]).not.toHaveShape(
            // eslint-disable-next-line new-cap
            expect.shape.ArrayStructure([
              expect.shape.Number(),
              expect.shape.String()
            ])
          );
          expect([{ str: 'hello' }]).toHaveShape(
            // eslint-disable-next-line new-cap
            expect.shape.ArrayStructure([
              {
                str: expect.shape.String()
              }
            ])
          );
          done();
        } catch (e) {
          done(e);
        }
      });

      it('should be able to compare Object shape.', function(done) {
        try {
          expect({
            str: 'string',
            num: 1,
            bool: true
          }).toHaveShape(
            expect.shape.Object({
              str: expect.shape.String(),
              num: expect.shape.Number(),
              bool: expect.shape.Boolean()
            })
          );
          expect({
            nested: {
              str: 'string',
              num: 1,
              bool: true
            }
          }).toHaveShape(
            expect.shape.Object({
              nested: {
                str: expect.shape.String(),
                num: expect.shape.Number(),
                bool: expect.shape.Boolean()
              }
            })
          );
          expect({
            array: [1, 2, 'string']
          }).toHaveShape(
            expect.shape.Object({
              array: [
                expect.shape.Number(),
                expect.shape.Number(),
                expect.shape.String()
              ]
            })
          );
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe('expect.promised', function() {
    it('should check a promised value', function() {
      return expect.promised(Promise.resolve(false)).toBeFalse();
    });

    it('should cache throwed items', function() {
      // eslint-disable-next-line prefer-promise-reject-errors
      return expect.promised(Promise.reject(false)).toBeFalse();
    });
  });

  describe('Chaining.', function() {
    it('should be able to chain matchers', function(done) {
      try {
        expect([1, 2, 3])
          .toBeAnArray()
          .and.toHaveLength(3);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('should be able to fail chained matchers', function(done) {
      try {
        expect([1, 2, 3])
          .toBeAnArray()
          .and.toHaveLength(2);
        done(new Error('Unexpected success.'));
      } catch (e) {
        done();
      }
    });

    it('should be able to chain promised matchers', function() {
      var retVal = expect
        .promised(Promise.resolve([1, 2, 3]))
        .toBeAnArray()
        .and.toHaveLength(2);
      return retVal.then(
        function() {
          throw new Error('Unexpected success');
        },
        function() {
          // Success
        }
      );
    });
  });

  describe('Descriptions', function() {
    it('should include a description if defined', function(done) {
      try {
        expect([1, 2, 3], 'my-array-description')
          .toBeAnArray()
          .and.toHaveLength(2);
      } catch (e) {
        if (/my-array-description/.test(e.message)) {
          done();
        }
        throw new Error('Invalid description');
      }
    });
  });

  describe('Error properties', function() {
    it('should throw an ExpectationError with known properties', function() {
      var error = null;
      try {
        expect('a').toBe('b');
      } catch (e) {
        error = e;
      }
      if (!error) {
        throw new Error('Expected error to be thrown.');
      }
      expect(error.name).toBe('ExpectationError');
      expect(error.actual).toBe('a');
      expect(error.expected).toBe('b');
      expect(error.operator).toBe('to be');
      expect(error.message).toBe('ExpectationError: Expected  "a" to be "b"');
    });
  });
});
