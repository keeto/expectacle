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

    describe('toBeLike', function() {
      it('should fail if the two objects are not like each other', function(done) {
        try {
          expect({x: true}).toBeLike({x: false});
          done(new Error('similar objects should match'));
        } catch(e) {
          done();
        }
      });
      it('should fail if the two objects are not strictly like each other', function(done) {
        try {
          expect({x: true, y: '', z: {a: 1, b: 2}}).toBeLike({x: 1, y: 0, z: {a: true, b: 2}});
          done(new Error('expect.toBeLike should have failed'));
        } catch(e) {
          done();
        }
      });
      it('should pass if the two objects are like each other', function(done) {
        try {
          expect({x: true, y: [1, 2], z: {a: '', b: 2}}).toBeLike({x: true, y: [1, 2], z: {a: '', b: 2}});
          done();
        } catch(e) {
          done(new Error(e));
        }
      });
      it('should fail if the expect.type matchers are not matched', function(done) {
        try {
          expect({}).toBeLike({x: expect.type.any});
          done(new Error('expect.type.any should not match undefined'));
        } catch(e) {
          done();
        }
      });
      it('should consider an object to match if the expect.type placeholders are satisfied', function(done) {
        var type = expect.type;
        try {
          expect({
            deep: {
              a: [],
              b: true,
              c: {},
              d: new Date(),
              r: /pattern/g,
              x: 123,
              y: 'hello',
              z: function() {}
            },
            a: '',
            b: 123,
            c: []
          }).toBeLike({
            deep: {
              a: type.arr(),
              b: type.bool(),
              c: type.obj(),
              d: type.date(),
              r: type.regexp(),
              x: type.number(),
              y: type.string(),
              z: type.func()
            },
            a: type.string(),
            b: type.number(),
            c: type.arr()
          });
          done();
        } catch(e) {
          done(new Error(e));
        }
      });
      it('should fail if expect.type.any is used for an undefined property', function(done) {
        try {
          expect({}).toBeLike({a: expect.type.any()});
          done(new Error('undefined should not match expect.type.any'));
        } catch(e) {
          done();
        }
      });
      it('should fail if expect.type.bool is used for a number', function(done) {
        try {
          expect({a: 1}).toBeLike({a: expect.type.bool()});
          done(new Error('a number should not match expect.type.bool'));
        } catch(e) {
          done();
        }
      });
      it('should fail if expect.type.obj is used for an array', function(done) {
        try {
          expect({a: []}).toBeLike({a: expect.type.obj()});
          done(new Error('an array should not match expect.type.obj'));
        } catch(e) {
          done();
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

    describe('toBeBoolean', function() {

      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeBoolean();
          done(new Error('toBeBoolean passed on array.'));
        } catch(e) {
          done();
        }
      });

      it('should be aliased as toBeABoolean', function () {
        expect(Boolean()).toBeABoolean();
        expect(null).not.toBeABoolean();
      });

    });

    describe('toBeFunction', function() {

      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeFunction();
          done(new Error('toBeFunction passed on array.'));
        } catch(e) {
          done();
        }
      });

      it('should be aliased as toBeAFunction', function () {
        expect(function () {}).toBeAFunction();
        expect(1).not.toBeAFunction();
      });

    });

    describe('toBeArray', function() {

      it('should fail if the value is an object.', function(done) {
        try {
          expect({}).toBeArray();
          done(new Error('toBeArray passed on object.'));
        } catch(e) {
          done();
        }
      });

      it('should be aliased as toBeAnArray', function () {
        expect([]).toBeAnArray();
        expect(0).not.toBeAnArray();
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

      it('should be aliased as toBeAnObject', function () {
        expect({}).toBeAnObject();
        expect(null).not.toBeAnObject();
      });

    });


    describe('toBeNumber', function() {

      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeNumber();
          done(new Error('toBeNumber passed on array.'));
        } catch(e) {
          done();
        }
      });

      it('should be aliased as toBeANumber', function () {
        expect(Number()).toBeANumber();
        expect(String()).not.toBeANumber();
      });

    });

    describe('toBeString', function() {

      it('should fail if the value is an array.', function(done) {
        try {
          expect([]).toBeString();
          done(new Error('toBeString passed on array.'));
        } catch(e) {
          done();
        }
      });

      it('should be aliased as toBeAString', function () {
        expect('').toBeAString();
        expect(1).not.toBeAString();
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
