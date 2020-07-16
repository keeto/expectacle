export = expect;

declare function expect(value?: any, description?: string): expect.Expectation;

declare namespace expect {
  export interface Chainer {
    and: Expectation;
  }

  export interface Expectation {
    not: Expectation;

    toBe(v: any): Chainer;
    toEqual(v: any): Chainer;
    toBeAnInstanceOf(v: any): Chainer;
    toBeOfType(v: any): Chainer;

    toBeArray(): Chainer;
    toBeBoolean(): Chainer;
    toBeFunction(): Chainer;
    toBeNumber(): Chainer;
    toBeObject(): Chainer;
    toBeString(): Chainer;

    toBeAnArray(): Chainer;
    toBeABoolean(): Chainer;
    toBeAFunction(): Chainer;
    toBeANumber(): Chainer;
    toBeAnObject(): Chainer;
    toBeAString(): Chainer;

    toBeNull(): Chainer;
    toBeUndefined(): Chainer;
    toBeNaN(): Chainer;
    toBeTrue(): Chainer;
    toBeFalse(): Chainer;
    toBeTruthy(): Chainer;
    toBeFalsy(): Chainer;

    toBeEmpty(): Chainer;
    toHaveLength(v: number): Chainer;
    toHaveMember(v: string): Chainer;
    toHaveOwnMember(v: string): Chainer;
    toHaveProperty(v: string): Chainer;
    toHaveOwnProperty(v: string): Chainer;
    toHaveMethod(v: string): Chainer;
    toHaveOwnMethod(v: string): Chainer;

    toBeLike(v: any): Chainer;

    toHaveShape(v: { [name: string]: Shape } | Shape): Chainer;

    toThrow(v: any): Chainer;
    toMatch(v: any): Chainer;
  }

  interface PromisedExpectation<T> extends Expectation {
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): Promise<TResult1 | TResult2>;

    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): Promise<T | TResult>;
  }

  interface Shape {
    name: string;
    checker: () => void;
  }

  interface InternalShape {
    Array: (subtype: any) => Shape;
    ArrayStructure: (types: Array<any>) => Shape;
    Object: (descriptor: any) => Shape;
    Literal: (decriptor: any) => Shape;
    LiteralArray: (types: Array<any>) => Shape;
    Arguments: () => Shape;
    Boolean: () => Shape;
    Date: () => Shape;
    Function: () => Shape;
    Null: () => Shape;
    Number: () => Shape;
    RegExp: () => Shape;
    String: () => Shape;
    Undefined: () => Shape;
  }

  export const NULL_VALUE: {};
  export const shape: InternalShape;
  export function promised<T = any>(
    value: T,
    description?: string
  ): expect.PromisedExpectation<T>;
  export function typeOf(value: any): string;
  export function fail(opt_message?: string): void;
  export function addMatcher(name: string, matcher: any): void;
  export function addMatchers(matchers: { [name: string]: any }): void;
}
