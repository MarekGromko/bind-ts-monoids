import { Maybe, None, Some } from '../src/maybe.ts';
import { Failure, Result, Success } from '../src/result.ts';

describe('Result', () => {
    describe('Success', () => {
        it('stores the supplied value and identifies itself as success', () => {
            const result = Result.success(42);

            expect(result).to.be.instanceOf(Success);
            expect(result.kind).to.equal('success');
            expect(result.get()).to.equal(42);
        });

        it('returns its value from getOrElse regardless of the default', () => {
            expect(Result.success('value').getOrElse('fallback')).to.equal('value');
        });

        it('reports the correct type guards', () => {
            const result = Result.success(42);

            expect(result.isSuccess()).to.equal(true);
            expect(result.isFailure()).to.equal(false);
        });

        it('converts to Some through asMaybe', () => {
            const maybe = Result.success('value').asMaybe();

            expect(maybe).to.be.instanceOf(Some);
            expect(maybe.kind).to.equal('some');
            expect(maybe.get()).to.equal('value');
        });

        it('folds with onSuccess and does not call onFailure', () => {
            const onFailure = () => {
                throw new Error('onFailure should not be called');
            };

            expect(Result.success(3).fold(onFailure, (value) => value * 2)).to.equal(6);
        });

        it('maps the success value into a new success', () => {
            const result = Result.success(5).map((value) => value.toString());

            expect(result.kind).to.equal('success');
            expect(result.get()).to.equal('5');
        });

        it('preserves falsy, null, and undefined mapped values as successes', () => {
            expect(
                Result.success(1)
                    .map(() => 0)
                    .get(),
            ).to.equal(0);
            expect(
                Result.success(1)
                    .map(() => false)
                    .get(),
            ).to.equal(false);
            expect(
                Result.success(1)
                    .map(() => '')
                    .get(),
            ).to.equal('');
            expect(
                Result.success(1)
                    .map(() => null)
                    .get(),
            ).to.equal(null);
            expect(
                Result.success(1)
                    .map(() => undefined)
                    .get(),
            ).to.equal(undefined);
        });

        it('binds by passing the value to the callback and returning its result', () => {
            const result = Result.success(5).bind((value) => Result.success(value + 1));

            expect(result.kind).to.equal('success');
            expect(result.get()).to.equal(6);
        });

        it('flatMaps without nesting the callback result', () => {
            const inner = Result.success('inner');
            const result = Result.success('outer').flatMap(() => inner);

            expect(result).to.equal(inner);
        });

        it('can bind or flatMap to a failure', () => {
            const bound = Result.success(1).bind(() => Result.failure('bind failed'));
            const flatMapped = Result.success(1).flatMap(() => Result.failure('flatMap failed'));

            expect(bound.kind).to.equal('failure');
            expect(bound.getError()).to.equal('bind failed');
            expect(flatMapped.kind).to.equal('failure');
            expect(flatMapped.getError()).to.equal('flatMap failed');
        });

        it('invokes map, bind, and flatMap callbacks exactly once', () => {
            let calls = 0;
            const callback = (value: number) => {
                calls += 1;
                return value + 1;
            };

            Result.success(1).map(callback);
            Result.success(1).bind((value) => {
                callback(value);
                return Result.success(value);
            });
            Result.success(1).flatMap((value) => {
                callback(value);
                return Result.success(value);
            });

            expect(calls).to.equal(3);
        });

        it('throws when getError is called', () => {
            expect(() => Result.success(1).getError()).to.throw(
                Error,
                'Cannot get error from Success',
            );
        });

        it('propagates callback errors', () => {
            const callbackError = new Error('callback failed');
            const callback = () => {
                throw callbackError;
            };

            expect(() => Result.success(1).map(callback)).to.throw(callbackError);
            expect(() => Result.success(1).bind(callback)).to.throw(callbackError);
            expect(() => Result.success(1).flatMap(callback)).to.throw(callbackError);
        });

        it('converts a success containing null or undefined to Some', () => {
            const nullMaybe = new Success<null>(null).asMaybe();
            const undefinedMaybe = new Success<undefined>(undefined).asMaybe();

            expect(nullMaybe.kind).to.equal('some');
            expect(nullMaybe.get()).to.equal(null);
            expect(undefinedMaybe.kind).to.equal('some');
            expect(undefinedMaybe.get()).to.equal(undefined);
        });
    });

    describe('Failure', () => {
        it('stores the supplied error and identifies itself as failure', () => {
            const result = Result.failure('problem');

            expect(result).to.be.instanceOf(Failure);
            expect(result.kind).to.equal('failure');
            expect(result.getError()).to.equal('problem');
        });

        it('reports the correct type guards', () => {
            const result = Result.failure<number, string>('problem');

            expect(result.isSuccess()).to.equal(false);
            expect(result.isFailure()).to.equal(true);
        });

        it('converts to None through asMaybe', () => {
            const maybe = Result.failure<number, string>('problem').asMaybe();

            expect(maybe).to.be.instanceOf(None);
            expect(maybe.kind).to.equal('none');
        });

        it('folds with onFailure and does not call onSuccess', () => {
            const onSuccess = () => {
                throw new Error('onSuccess should not be called');
            };

            expect(
                Result.failure<number, string>('problem').fold(
                    (error) => `error: ${error}`,
                    onSuccess,
                ),
            ).to.equal('error: problem');
        });

        it('throws when get is called', () => {
            expect(() => Result.failure('problem').get()).to.throw(
                Error,
                'Cannot get value from Failure',
            );
        });

        it('preserves the same failure and error through map', () => {
            const failure = Result.failure<number, string>('problem');
            const mapped = failure.map((value) => value.toString());

            expect(mapped).to.equal(failure);
            expect(mapped.kind).to.equal('failure');
            expect(mapped.getError()).to.equal('problem');
        });

        it('preserves the same failure through bind and flatMap', () => {
            const failure = Result.failure<number, string>('problem');
            let calls = 0;
            const callback = () => {
                calls += 1;
                return Result.success('value');
            };

            expect(failure.bind(callback)).to.equal(failure);
            expect(failure.flatMap(callback)).to.equal(failure);
            expect(calls).to.equal(0);
        });

        it('does not invoke map on a failure', () => {
            let called = false;
            const result = Result.failure<number, string>('problem').map(() => {
                called = true;
                return 'value';
            });

            expect(result.kind).to.equal('failure');
            expect(result.getError()).to.equal('problem');
            expect(called).to.equal(false);
        });

        it('keeps the failure through a chain of map, bind, and flatMap', () => {
            let calls = 0;
            const result = Result.failure<number, string>('problem')
                .map((value) => {
                    calls += 1;
                    return value + 1;
                })
                .bind((value) => {
                    calls += 1;
                    return Result.success(value + 1);
                })
                .flatMap((value) => {
                    calls += 1;
                    return Result.success(value + 1);
                });

            expect(result.kind).to.equal('failure');
            expect(result.getError()).to.equal('problem');
            expect(calls).to.equal(0);
        });
    });

    describe('factories and monad laws', () => {
        it('recognizes Success and Failure instances with Result.isResult', () => {
            expect(Result.isResult(Result.success('ok'))).to.equal(true);
            expect(Result.isResult(Result.failure('problem'))).to.equal(true);
        });

        it('rejects values that are not Success or Failure instances', () => {
            expect(Result.isResult(null)).to.equal(false);
            expect(Result.isResult(undefined)).to.equal(false);
            expect(Result.isResult(42)).to.equal(false);
            expect(Result.isResult({ kind: 'success' })).to.equal(false);
            expect(Result.isResult({ kind: 'failure' })).to.equal(false);
        });

        it('creates success and failure variants through the Result factory', () => {
            expect(Result.success('ok')).to.be.instanceOf(Success);
            expect(Result.failure('problem')).to.be.instanceOf(Failure);
        });

        it('exposes variant constructors through the Result factory', () => {
            expect(new Result.Success(1)).to.be.instanceOf(Success);
            expect(new Result.Failure('problem')).to.be.instanceOf(Failure);
        });

        it('creates distinct instances for separate factory calls', () => {
            expect(Result.success(1)).not.to.equal(Result.success(1));
            expect(Result.failure('problem')).not.to.equal(Result.failure('problem'));
        });

        it('satisfies left identity for successful values', () => {
            const fn = (value: number) => Result.success(value * 2);

            expect(Result.success(3).bind(fn)).to.deep.equal(fn(3));
        });

        it('satisfies right identity for successes and failures', () => {
            const success = Result.success(3);
            const failure = Result.failure<number, string>('problem');
            const identity = <T>(value: T) => Result.success(value);

            expect(success.bind(identity)).to.deep.equal(success);
            expect(failure.bind(identity)).to.equal(failure);
        });

        it('satisfies associativity for successful compositions', () => {
            const first = (value: number) => Result.success(value + 2);
            const second = (value: number) => Result.success(value * 3);
            const value = Result.success(4);

            expect(value.bind(first).bind(second)).to.deep.equal(
                value.bind((item) => first(item).bind(second)),
            );
        });

        it('satisfies associativity when a composition fails', () => {
            const first = (value: number) => Result.success(value + 2);
            const second = (value: number) => Result.failure<number, string>(`failed at ${value}`);
            const value = Result.success(4);

            expect(value.bind(first).bind(second)).to.deep.equal(
                value.bind((item) => first(item).bind(second)),
            );
        });
    });

    describe('Result and Maybe interoperability', () => {
        it('represents success as Some and failure as None', () => {
            const success = Result.success('present').asMaybe();
            const failure = Result.failure<string, string>('absent').asMaybe();

            expect(success).to.be.instanceOf(Some);
            expect(success.get()).to.equal('present');
            expect(failure).to.be.instanceOf(None);
            expect(failure).to.deep.equal(Maybe.none());
        });
    });
});
