import { Monad } from './monad.ts';

/**
 * Represents an optional value that may be present (`Some`) or absent (`None`).
 * @typeParam T Type of the value contained when present.
 * @see Some
 * @see None
 */
export abstract class Maybe<T> extends Monad<T> {
    /**
     * Wraps a value in a `Some`, including `null` or `undefined` if supplied.
     * @param thing Value to wrap.
     */
    static of<T>(thing: T): Some<T> {
        return new Some<T>(thing);
    }

    /**
     * Wraps a non-nullish value in `Some`, or returns `None` for `null` and `undefined`.
     * @param thing Value to wrap if it is not nullish.
     */
    static ofNullable<T>(thing: T): T extends null | undefined ? None : Some<NonNullable<T>>;
    static ofNullable<T>(thing: T): None | Some<NonNullable<T>> {
        if (thing === null || thing === undefined) {
            return new None();
        }
        return new Some<NonNullable<T>>(thing);
    }

    /** Constructor for a present value. */
    static readonly Some: typeof Some;

    /** Constructor for an absent value. */
    static readonly None: typeof None;

    /** Prevents direct instantiation while allowing concrete subclasses. */
    constructor() {
        super();
        if (new.target === Maybe) {
            throw new Error('Maybe cannot be instantiated directly');
        }
    }

    /**
     * Returns the contained value, or throws when this instance is `None`.
     */
    abstract get(): T;

    /**
     * Returns the contained value, or the supplied fallback when this instance is `None`.
     * @param defaultValue Value returned when no value is present.
     */
    abstract getOrElse<U>(defaultValue: U): T | U;

    /**
     * Applies the callback corresponding to this instance and returns its result.
     * @param onNone Callback invoked when this instance is `None`.
     * @param onSome Callback invoked with the contained value when this instance is `Some`.
     */
    abstract fold<U, V>(onNone: () => U, onSome: (value: T) => V): U | V;

    /**
     * Returns whether a value is present and narrows this instance to `Some<T>`.
     */
    abstract isPresent(): this is Some<T>;

    /**
     * Returns whether no value is present and narrows this instance to `Maybe.None`.
     */
    abstract isAbsent(): this is None;
}

/**
 * Represents a present value, including `null` or `undefined` when explicitly wrapped.
 * @see Maybe
 * @see None
 */
export class Some<T> extends Maybe<T> {
    private readonly data: T;

    /**
     * Creates a present value containing `data`.
     * @param data Value to store.
     */
    constructor(data: T) {
        super();
        this.data = data;
    }

    /**
     * Transforms the contained value, returning `None` for a nullish result
     * and `Some` otherwise.
     * @param transform Function applied to the contained value.
     */
    map<U>(transform: (value: T) => U): ReturnType<typeof Maybe.ofNullable<U>> {
        return Maybe.ofNullable(transform(this.data));
    }

    /**
     * Transforms the contained value with a function that returns another `Maybe`.
     * @param transform Function applied to the contained value.
     */
    flatMap<U>(transform: (value: T) => Maybe<U>): Maybe<U> {
        return transform(this.data);
    }

    /** Returns the contained value. */
    get(): T {
        return this.data;
    }

    /**
     * Returns the contained value; `defaultValue` is not used for `Some`.
     * @param defaultValue Fallback returned only by `None`.
     */
    getOrElse<U>(_defaultValue: U): T | U {
        return this.data;
    }

    /**
     * Calls `onSome` with the contained value and returns its result.
     * @param onNone Callback used by `None`; not called for `Some`.
     * @param onSome Callback invoked with this instance's value.
     */
    fold<V>(_onNone: () => never, onSome: (value: T) => V): V {
        return onSome(this.data);
    }

    /**
     * Returns `true`, identifying this instance as a present value.
     */
    isPresent(): this is Some<T> {
        return true;
    }

    /**
     * Returns `false`, identifying this instance as not absent.
     */
    isAbsent(): this is None {
        return false;
    }
}
Object.assign(Maybe, { Some });

/**
 * Represents the absence of a value.
 * @see Maybe
 * @see Some
 */
export class None extends Maybe<never> {
    /**
     * Creates an absent value.
     */
    constructor() {
        super();
    }

    /**
     * Returns a new `None` without invoking a transform.
     * @param _transform Transform that is not invoked because no value is present.
     */
    map<U>(_transform: never): None {
        return new None();
    }

    /**
     * Returns a new `None` without invoking a transform.
     * @param _transform Transform that is not invoked because no value is present.
     */
    flatMap(_transform: never): None {
        return new None();
    }

    /**
     * Throws because this instance contains no value.
     */
    get(): never {
        throw new Error('No value present');
    }

    /**
     * Returns `defaultValue` because this instance contains no value.
     * @param defaultValue Value returned when no value is present.
     */
    getOrElse<U>(defaultValue: U): U {
        return defaultValue;
    }

    /**
     * Calls `onNone` and returns its result.
     * @param onNone Callback invoked because no value is present.
     * @param _onSome Callback used by `Some`; not called for `None`.
     */
    fold<U>(onNone: () => U, _onSome: never): U {
        return onNone();
    }

    /**
     * Returns `false`, identifying this instance as not present.
     */
    isPresent(): this is Some<never> {
        return false;
    }

    /**
     * Returns `true`, identifying this instance as absent.
     */
    isAbsent(): this is None {
        return true;
    }
}
Object.assign(Maybe, { None });

export default Maybe;
