import { Maybe, None } from '../src/maybe.ts';
import { Monad } from '../src/monad.ts';

describe('Maybe', () => {
    describe('constructors', () => {
        it('throws when Maybe is instantiated directly', () => {
            expect(() => Reflect.construct(Maybe, [])).to.throw(
                Error,
                'Maybe cannot be instantiated directly',
            );
        });

        it('of creates a Some containing the supplied value', () => {
            const value = { id: 7 };
            const result = Maybe.of(value);

            expect(result).to.be.instanceOf(Maybe.Some);
            expect(result.get()).to.equal(value);
        });

        it('of treats null and undefined as present values', () => {
            const nullValue = Maybe.of(null);
            const undefinedValue = Maybe.of(undefined);

            expect(nullValue).to.be.instanceOf(Maybe.Some);
            expect(nullValue.get()).to.equal(null);
            expect(undefinedValue).to.be.instanceOf(Maybe.Some);
            expect(undefinedValue.get()).to.equal(undefined);
        });

        it('ofNullable returns None for null and undefined', () => {
            expect(Maybe.ofNullable(null)).to.be.instanceOf(Maybe.None);
            expect(Maybe.ofNullable(undefined)).to.be.instanceOf(Maybe.None);
        });

        it('ofNullable wraps non-nullish values in Some', () => {
            const value = { name: 'Ada' };
            const result = Maybe.ofNullable(value);

            expect(result).to.be.instanceOf(Maybe.Some);
            expect(result.get()).to.equal(value);
        });

        it('ofNullable preserves falsy values', () => {
            expect(Maybe.ofNullable(0).get()).to.equal(0);
            expect(Maybe.ofNullable(false).get()).to.equal(false);
            expect(Maybe.ofNullable('').get()).to.equal('');
        });
    });

    describe('Some', () => {
        it('maps the contained value into a new Some', () => {
            const result = Maybe.of(4).map((value) => value * 3);

            expect(result).to.be.instanceOf(Maybe.Some);
            expect(result.get()).to.equal(12);
        });

        it('calls the map transform exactly once with the contained value', () => {
            const received: number[] = [];

            Maybe.of(5).map((value) => {
                received.push(value);
                return value;
            });

            expect(received).to.deep.equal([5]);
        });

        it('returns and infers None when mapping produces null or undefined', () => {
            const nullResult: None = Maybe.of(1).map(() => null);
            const undefinedResult: None = Maybe.of(1).map(() => undefined);

            expect(nullResult).to.be.instanceOf(None);
            expect(undefinedResult).to.be.instanceOf(None);
        });

        it('flatMaps to the exact Maybe returned by the transform', () => {
            const expected = Maybe.of('chained');
            const result = Maybe.of(1).flatMap(() => expected);

            expect(result).to.equal(expected);
        });

        it('flatMaps to None when the transform returns None', () => {
            const result = Maybe.of(1).flatMap(() => new Maybe.None());

            expect(result).to.be.instanceOf(Maybe.None);
        });

        it('calls the flatMap transform exactly once with the contained value', () => {
            const received: string[] = [];

            Maybe.of('value').flatMap((value) => {
                received.push(value);
                return Maybe.of(value.length);
            });

            expect(received).to.deep.equal(['value']);
        });

        it('get returns the original contained value', () => {
            const value = { nested: [1, 2] };

            expect(Maybe.of(value).get()).to.equal(value);
        });

        it('getOrElse returns the contained value instead of the fallback', () => {
            expect(Maybe.of('present').getOrElse('fallback')).to.equal('present');
        });

        it('fold calls only onSome and returns its result', () => {
            let noneCalls = 0;
            let someCalls = 0;
            const value: Maybe<number> = Maybe.of(8);

            const result = value.fold(
                () => {
                    noneCalls += 1;
                    return 'absent';
                },
                (value) => {
                    someCalls += 1;
                    return `value:${value}`;
                },
            );

            expect(result).to.equal('value:8');
            expect(noneCalls).to.equal(0);
            expect(someCalls).to.equal(1);
        });

        it('identifies itself as present and not absent', () => {
            const value = Maybe.of('here');

            expect(value.isPresent()).to.equal(true);
            expect(value.isAbsent()).to.equal(false);
        });
    });

    describe('None', () => {
        it('map returns None without invoking the transform', () => {
            const value: Maybe<number> = new Maybe.None();
            let calls = 0;

            const result = value.map((item) => {
                calls += 1;
                return item * 2;
            });

            expect(result).to.be.instanceOf(Maybe.None);
            expect(calls).to.equal(0);
        });

        it('flatMap returns None without invoking the transform', () => {
            const value: Maybe<number> = new Maybe.None();
            let calls = 0;

            const result = value.flatMap((item) => {
                calls += 1;
                return Maybe.of(item * 2);
            });

            expect(result).to.be.instanceOf(Maybe.None);
            expect(calls).to.equal(0);
        });

        it('get throws an error when no value is present', () => {
            expect(() => new Maybe.None().get()).to.throw(Error, 'No value present');
        });

        it('getOrElse returns the exact fallback value', () => {
            const fallback = { default: true };

            expect(new Maybe.None().getOrElse(fallback)).to.equal(fallback);
        });

        it('getOrElse supports undefined as the fallback', () => {
            expect(new Maybe.None().getOrElse(undefined)).to.equal(undefined);
        });

        it('fold calls only onNone and returns its result', () => {
            let noneCalls = 0;
            let someCalls = 0;
            const value: Maybe<number> = new Maybe.None();

            const result = value.fold(
                () => {
                    noneCalls += 1;
                    return 'absent';
                },
                (item) => {
                    someCalls += 1;
                    return `value:${item}`;
                },
            );

            expect(result).to.equal('absent');
            expect(noneCalls).to.equal(1);
            expect(someCalls).to.equal(0);
        });

        it('identifies itself as absent and not present', () => {
            const value = new Maybe.None();

            expect(value.isPresent()).to.equal(false);
            expect(value.isAbsent()).to.equal(true);
        });
    });

    describe('Monad operations', () => {
        it('bind is an alias for flatMap on Some', () => {
            const expected = Maybe.of('bound');
            const result = Maybe.of(1).bind(() => expected);

            expect(result).to.equal(expected);
        });

        it('bind preserves None and skips its transform', () => {
            const value: Maybe<number> = new Maybe.None();
            let calls = 0;

            const result = value.bind((item) => {
                calls += 1;
                return Maybe.of(item);
            });

            expect(result).to.be.instanceOf(Maybe.None);
            expect(calls).to.equal(0);
        });

        it('satisfies the functor identity law for Some and None', () => {
            expectEquivalent(
                Maybe.of(6).map((value) => value),
                Maybe.of(6),
            );
            expectEquivalent(
                (new Maybe.None() as Maybe<number>).map((value) => value),
                new Maybe.None(),
            );
        });

        it('satisfies the functor composition law for Some and None', () => {
            const first = (value: number) => value + 2;
            const second = (value: number) => `${value}!`;

            expectEquivalent(
                Maybe.of(3).map(first).map(second),
                Maybe.of(3).map((value) => second(first(value))),
            );
            expectEquivalent(
                (new Maybe.None() as Maybe<number>).map(first).map(second),
                new Maybe.None(),
            );
        });

        it('satisfies the monad left identity law', () => {
            const transform = (value: number) => Maybe.of(`${value * 2}`);

            expectEquivalent(Maybe.of(4).flatMap(transform), transform(4));
        });

        it('satisfies the monad right identity law for Some and None', () => {
            expectEquivalent(Maybe.of('value').flatMap(Maybe.of), Maybe.of('value'));
            expectEquivalent(
                (new Maybe.None() as Maybe<string>).flatMap(Maybe.of),
                new Maybe.None(),
            );
        });

        it('satisfies the monad associativity law for Some and None', () => {
            const first = (value: number) => Maybe.of(value + 1);
            const second = (value: number) => Maybe.of(`${value * 2}`);

            expectEquivalent(
                Maybe.of(3).flatMap(first).flatMap(second),
                Maybe.of(3).flatMap((value) => first(value).flatMap(second)),
            );
            expectEquivalent(
                (new Maybe.None() as Maybe<number>).flatMap(first).flatMap(second),
                new Maybe.None(),
            );
        });
    });
});

/**
 * Asserts that two monadic values are equivalent by comparing their `Some`
 * status and, when both contain a value, their contents.
 */
function expectEquivalent<T>(actual: Monad<T>, expected: Monad<T>): void {
    expect(actual instanceof Maybe.Some).to.equal(expected instanceof Maybe.Some);
    if (actual instanceof Maybe.Some && expected instanceof Maybe.Some) {
        expect(actual.get()).to.deep.equal(expected.get());
    }
}
