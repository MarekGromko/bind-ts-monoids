import { Maybe, None, Some } from '../src/maybe.ts';

describe('Maybe', () => {
    describe('Some', () => {
        it('stores the supplied value and identifies itself as some', () => {
            const maybe = Maybe.some(42);

            expect(maybe).to.be.instanceOf(Some);
            expect(maybe.kind).to.equal('some');
            expect(maybe.get()).to.equal(42);
        });

        it('returns its value from getOrElse regardless of the default', () => {
            expect(Maybe.some('value').getOrElse('fallback')).to.equal('value');
        });

        it('reports the correct type guards', () => {
            const maybe = Maybe.some(42);

            expect(maybe.isSome()).to.equal(true);
            expect(maybe.isNone()).to.equal(false);
        });

        it('folds with onSome and does not call onNone', () => {
            const onNone = () => {
                throw new Error('onNone should not be called');
            };

            expect(Maybe.some(3).fold(onNone, (value) => value * 2)).to.equal(6);
        });

        it('binds by passing the value to the callback and returning its result', () => {
            const result = Maybe.some(5).bind((value) => Maybe.some(value + 1));

            expect(result.kind).to.equal('some');
            expect(result.get()).to.equal(6);
        });

        it('maps the value into another Some', () => {
            const result = Maybe.some(5).map((value) => value.toString());

            expect(result.kind).to.equal('some');
            expect(result.get()).to.equal('5');
        });

        it('maps null or undefined results into None', () => {
            expect(Maybe.some(1).map(() => null).kind).to.equal('none');
            expect(Maybe.some(1).map(() => undefined).kind).to.equal('none');
        });

        it('keeps falsy non-null map results in Some', () => {
            expect(
                Maybe.some(1)
                    .map(() => 0)
                    .get(),
            ).to.equal(0);
            expect(
                Maybe.some(1)
                    .map(() => false)
                    .get(),
            ).to.equal(false);
            expect(
                Maybe.some(1)
                    .map(() => '')
                    .get(),
            ).to.equal('');
        });

        it('can bind or flatMap to None', () => {
            const bound = Maybe.some(1).bind(() => Maybe.none<string>());
            const flatMapped = Maybe.some(1).flatMap(() => Maybe.none<string>());

            expect(bound.kind).to.equal('none');
            expect(flatMapped.kind).to.equal('none');
        });

        it('flatMaps by returning the callback result without nesting', () => {
            const inner = Maybe.some('inner');
            const result = Maybe.some('outer').flatMap(() => inner);

            expect(result).to.equal(inner);
        });

        it('invokes bind, map, and flatMap callbacks exactly once', () => {
            let calls = 0;
            const callback = (value: number) => {
                calls += 1;
                return value + 1;
            };

            Maybe.some(1).bind((value) => {
                callback(value);
                return Maybe.some(value);
            });
            Maybe.some(1).map(callback);
            Maybe.some(1).flatMap((value) => {
                callback(value);
                return Maybe.some(value);
            });

            expect(calls).to.equal(3);
        });

        it('propagates callback errors', () => {
            const failure = new Error('callback failed');
            const callback = () => {
                throw failure;
            };

            expect(() => Maybe.some(1).map(callback)).to.throw(failure);
            expect(() => Maybe.some(1).bind(callback)).to.throw(failure);
            expect(() => Maybe.some(1).flatMap(callback)).to.throw(failure);
        });

        it('supports values that are themselves null or undefined when constructed directly', () => {
            const nullValue = new Some<null>(null);
            const undefinedValue = new Some<undefined>(undefined);

            expect(nullValue.kind).to.equal('some');
            expect(nullValue.get()).to.equal(null);
            expect(undefinedValue.kind).to.equal('some');
            expect(undefinedValue.get()).to.equal(undefined);
        });
    });

    describe('None', () => {
        it('identifies itself as none', () => {
            expect(Maybe.none()).to.be.instanceOf(None);
            expect(Maybe.none().kind).to.equal('none');
        });

        it('reports the correct type guards', () => {
            const maybe = Maybe.none<number>();

            expect(maybe.isSome()).to.equal(false);
            expect(maybe.isNone()).to.equal(true);
        });

        it('returns the supplied default from getOrElse', () => {
            expect(Maybe.none<number>().getOrElse(7)).to.equal(7);
        });

        it('returns falsy defaults unchanged', () => {
            expect(Maybe.none<number>().getOrElse(0)).to.equal(0);
            expect(Maybe.none<boolean>().getOrElse(false)).to.equal(false);
            expect(Maybe.none<string>().getOrElse('')).to.equal('');
        });

        it('throws when get is called', () => {
            expect(() => Maybe.none().get()).to.throw(Error, 'Cannot get value from None');
        });

        it('folds with onNone and does not call onSome', () => {
            const onSome = () => {
                throw new Error('onSome should not be called');
            };

            expect(Maybe.none<number>().fold(() => 'empty', onSome)).to.equal('empty');
        });

        it('binds to None without calling the callback', () => {
            let called = false;
            const result = Maybe.none<number>().bind(() => {
                called = true;
                return Maybe.some('value');
            });

            expect(result.kind).to.equal('none');
            expect(called).to.equal(false);
        });

        it('maps to None without calling the callback', () => {
            let called = false;
            const result = Maybe.none<number>().map(() => {
                called = true;
                return 'value';
            });

            expect(result.kind).to.equal('none');
            expect(called).to.equal(false);
        });

        it('flatMaps to None without calling the callback', () => {
            let called = false;
            const result = Maybe.none<number>().flatMap(() => {
                called = true;
                return Maybe.some('value');
            });

            expect(result.kind).to.equal('none');
            expect(called).to.equal(false);
        });

        it('keeps None through a chain of map, bind, and flatMap', () => {
            let calls = 0;
            const result = Maybe.none<number>()
                .map((value) => {
                    calls += 1;
                    return value + 1;
                })
                .bind((value) => {
                    calls += 1;
                    return Maybe.some(value + 1);
                })
                .flatMap((value) => {
                    calls += 1;
                    return Maybe.some(value + 1);
                });

            expect(result.kind).to.equal('none');
            expect(calls).to.equal(0);
        });
    });

    describe('factories', () => {
        it('creates Some with Maybe.some', () => {
            expect(Maybe.some('x')).to.be.instanceOf(Some);
        });

        it('creates None with Maybe.none', () => {
            expect(Maybe.none()).to.be.instanceOf(None);
        });

        it('creates None from null and undefined', () => {
            expect(Maybe.fromNullable(null).kind).to.equal('none');
            expect(Maybe.fromNullable(undefined).kind).to.equal('none');
        });

        it('creates distinct instances for separate factory calls', () => {
            expect(Maybe.some(1)).not.to.equal(Maybe.some(1));
            expect(Maybe.none()).not.to.equal(Maybe.none());
        });

        it('creates Some from non-null values, including falsy values', () => {
            expect(Maybe.fromNullable(0).kind).to.equal('some');
            expect(Maybe.fromNullable(false).kind).to.equal('some');
            expect(Maybe.fromNullable('').kind).to.equal('some');
            expect(Maybe.fromNullable('value').get()).to.equal('value');
        });
    });
});
