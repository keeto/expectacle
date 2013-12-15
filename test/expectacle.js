var expect = require('./../expectacle');

describe('Expectacle', function() {

  describe('Function: expect()', function() {

    it('should return a new expectation object', function() {
      var returnValue = expect();
      if (typeof returnValue != 'object') {
        throw new Error('Expect returns non-object.');
      }
    });

    it('should return a new expectation object with a not matcher.', function() {
      var returnValue = expect();
      if (typeof returnValue.not != 'object') {
        throw new Error('Expect returns non-object.');
      }
    });

  });

  describe('Function: expect.fail()', function() {

    it('should throw a new ExpectationError when called.', function() {
      var error = null;
      try {
        expect.fail();
      } catch(e) {
        error = e;
      }
      if (error == null) {
        throw new Error('expect.fail did not throw an error.');
      }
      if (error.name != 'ExpectationError') {
        throw new Error('expect.fail threw a wrong error.');
      }
    });

    it('should use the passed argument as the error message.', function() {
      var message = 'This is an error message.';
      var error = null;
      try {
        expect.fail(message);
      } catch(e) {
        error = e;
      }
      if (error == null) {
        throw new Error('expect.fail did not throw an error.');
      }
      if (error.message != message) {
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
          expect(1).not.toBe({valueOf: function() { return 1; }});

          expect(true).not.toBe(1);
          expect(true).not.toBe('true');
          expect(false).not.toBe(0);
          expect(false).not.toBe('false');
          expect(false).not.toBe(undefined);
          expect(false).not.toBe(null);
          expect(false).not.toBe('');
        } catch(e) {
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
          expect(1).toEqual({valueOf: function() { return 1; }});
          expect(1).toEqual({toString: function() { return '1'; }});

          expect(0).toEqual(false);
          expect(0).toEqual('0');
          expect(0).toEqual({valueOf: function() { return 0; }});
          expect(0).toEqual({toString: function() { return '0'; }});

          expect(false).toEqual('');

          // Works because [] is coerced into a string ([].toString()), and
          // [].toString() is like calling [].join(','): it returns an empty
          // string which is equal to false.
          expect(false).toEqual([]);

          expect(undefined).toEqual(null);
        } catch(e) {
          throw new Error('expect.toBe failed: ' + e.message);
        }
      });

    });

    describe('toBeAnInstanceOf', function() {

      it('should throw an error if called without a function argument.', function(done) {
        try {
          expect(1).toBeAnInstanceOf(1);
          done(new Error('toBeAnInstanceOf succeeds without a function argument.'));
        } catch(e) {
          done();
        }
      });

      it('should check whether the value is an instance of the expected constructor', function() {
        var testConstructor = function() {};
        var testConstructor2 = function() {};
        testConstructor2.prototype = new testConstructor;
        try {
          // Base Objects.
          expect(true).toBeAnInstanceOf(Boolean);
          expect(1).toBeAnInstanceOf(Number);
          expect('').toBeAnInstanceOf(String);
          expect({}).toBeAnInstanceOf(Object);
          expect([]).toBeAnInstanceOf(Array);
          expect(/hello/).toBeAnInstanceOf(RegExp);
          expect(function() {}).toBeAnInstanceOf(Function);
          expect(new Date).toBeAnInstanceOf(Date);

          var testObj = new testConstructor2();

          expect(testObj).toBeAnInstanceOf(testConstructor);
          expect(testObj).toBeAnInstanceOf(testConstructor2);
          expect(testObj).toBeAnInstanceOf(Object);
        } catch(e) {
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
          expect(new Date).toBeOfType('date');
          expect(function() { return arguments; } ()).toBeOfType('arguments');
        } catch(e) {
          throw new Error('toBeOfType failed: ' + e.message);
        }
      });

    });

    describe('toBeObject', function() {

      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeObject();
          done(new Error('toBeObject passed on array.'));
        } catch(e) {
          done();
        }
      });

    });

    describe('toHaveLength', function() {

      it('should compare the value with the expected value\'s length property', function() {
        try {
          expect('hello').toHaveLength(5);
          expect([1, 2]).toHaveLength(2);
          expect(function() {return arguments; } (1)).toHaveLength(1);
          expect({length: 50}).toHaveLength(50);
          expect({a: 1, b: 2, c: 3}).toHaveLength(3);
          expect({}).toHaveLength(0);
        } catch(e) {
          throw new Error('toHaveLength failed: ' + e.message);
        }
      });

    });

    describe('toBeEmpty', function() {

      it('should compare the value with the expected value\'s length property', function() {
        try {
          expect('').toBeEmpty();
          expect([]).toBeEmpty();
          expect(function() {return arguments; } ()).toBeEmpty();
          expect({length: 0}).toBeEmpty();
          expect({}).toBeEmpty();
        } catch(e) {
          throw new Error('toBeEmpty failed: ' + e.message);
        }
      });

    });

    describe('toHaveMember', function() {

      it('should fail if the value is inaccessible.', function(done) {
        try {
          expect(null).toHaveMember('toString');
          done(new Error('toHaveMember passed with a null value.'));
        } catch(e) {
          done();
        }
      });

      it('should pass if the member name exists in the object.', function() {
        try {
          expect({}).toHaveMember('toString');
          expect({hello: 1}).toHaveMember('hello');
        } catch(e) {
          throw new Error('toHaveMember failed: ' + e.message);
        }
      });

    });

    describe('toHaveOwnMember', function() {

      it('should fail if the member is inherited.', function(done) {
        try {
          expect({}).toHaveOwnMember('toString');
          done(new Error('toHaveMember passed with an inherited member.'));
        } catch(e) {
          done();
        }
      });

    });

    describe('toHaveProperty', function() {

      it('should pass if the property exists in the object.', function() {
        try {
          expect({hello: 1}).toHaveProperty('hello');
        } catch(e) {
          throw new Error('toHaveProperty failed: ' + e.message);
        }
      });

      it('should fail for methods.', function(done) {
        try {
          expect({hello: function() {}}).toHaveProperty('hello');
          done(new Error('toHaveProperty passes with a method.'));
        } catch(e) {
          done();
        }
      });

    });

    describe('toHaveOwnProperty', function() {

      it('should fail for inherited properties.', function(done) {
        var X = function(){};
        X.prototype.y = 1;
        try {
          expect(new X()).toHaveOwnProperty('y');
          done(new Error('toHaveOwnProperty passes with an inherited property.'));
        } catch(e) {
          done();
        }
      });

    });

    describe('toHaveMethod', function() {

      it('should pass if the method exists in the object.', function() {
        try {
          expect({hello: function() {}}).toHaveMethod('hello');
          expect({}).toHaveMethod('toString');
        } catch(e) {
          throw new Error('toHaveMethod failed: ' + e.message);
        }
      });

      it('should fail for properties.', function(done) {
        try {
          expect({hello: 1}).toHaveMethod('hello');
          done(new Error('toHaveMethod passes with a method.'));
        } catch(e) {
          done();
        }
      });

    });

    describe('toHaveOwnMethod', function() {

      it('should fail for inherited methods.', function(done) {
        var X = function(){};
        X.prototype.y = function(){};
        try {
          expect(new X()).toHaveOwnMethod('y');
          done(new Error('toHaveOwnMethod passes with an inherited method.'));
        } catch(e) {
          done();
        }
      });

    });

  });

});
