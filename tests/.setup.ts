import * as Chai from 'chai';

Object.defineProperty(globalThis, 'expect', { value: Chai.expect });
declare global {
    const expect: typeof Chai.expect;
}
