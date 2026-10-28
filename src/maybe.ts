import type { Monad } from './monad.ts';

/**
 * Represents an optional value that is either present as {@link Some} or absent as {@link None}.
 *
 * @typeParam T - The type of the value represented when this instance is `Some`.
 */
export interface MaybeLike<T> extends Monad<T> {
    /** Discriminates between a present (`some`) and absent (`none`) value. */
    readonly kind: 'some' | 'none';

    /**
     * Returns the contained value, or the supplied fallback when this is `None`.
     *
     * @param defaultValue - Value returned when no value is present.
     * @returns The contained value for `Some`, otherwise `defaultValue`.
     */
    getOrElse(defaultValue: T): T;

    /**
     * Returns the contained value.
     *
     * @returns The value for `Some`.
     * @throws {Error} `None` throws because it has no value to return.
     */
    get(): T | undefined;

    /**
     * Eliminates this optional value by invoking the handler for its current variant.
     *
     * @typeParam U - Return type of the `None` handler.
     * @typeParam V - Return type of the `Some` handler.
     * @param onNone - Handler invoked when this is `None`.
     * @param onSome - Handler invoked with the contained value when this is `Some`.
     * @returns The result of the handler corresponding to this variant.
     */
    fold<U, V>(onNone: () => U, onSome: (value: T) => V): U | V;

    /**
     * Applies a function that returns another `Maybe`, flattening the result.
     *
     * @typeParam U - Type of the value in the resulting `Maybe`.
     * @param fn - Function applied to the contained value; it is not called for `None`.
     * @returns The function result for `Some`, or an absent value for `None`.
     */
    flatMap<U>(fn: (value: T) => MaybeLike<U>): MaybeLike<U>;

    /**
     * Applies a function that returns another `Maybe`.
     *
     * @typeParam U - Type of the value in the resulting `Maybe`.
     * @param fn - Function applied to the contained value; it is not called for `None`.
     * @returns The function result for `Some`, or an absent value for `None`.
     */
    bind<U>(fn: (value: T) => MaybeLike<U>): MaybeLike<U>;

    /**
     * Transforms the contained value while preserving the optional context.
     * A `null` or `undefined` result becomes `None`.
     *
     * @typeParam U - Type returned by the mapping function.
     * @param fn - Function applied to the contained value; it is not called for `None`.
     * @returns A `Maybe` containing the mapped value, or `None` when absent/nullish.
     */
    map<U>(fn: (value: T) => U): MaybeLike<U>;

    /**
     * Type guard that narrows this instance to {@link Some}.
     *
     * @returns `true` when this instance contains a value.
     */
    isSome(): this is Some<T>;

    /**
     * Type guard that narrows this instance to {@link None}.
     *
     * @returns `true` when this instance is absent.
     */
    isNone(): this is None<T>;
}

/**
 * A value that is either present as {@link Some} or absent as {@link None}.
 */
export type Maybe<T> = Some<T> | None<T>;

/** A `Maybe` variant that contains a value. */
export class Some<T> implements MaybeLike<T> {
    /** The value stored by this instance. */
    private readonly value: T;

    /**
     * Creates a `Some` containing the supplied value.
     *
     * @param value - Value to store; direct construction permits `null` or `undefined` when included in `T`.
     */
    constructor(value: T) {
        this.value = value;
    }

    /** Identifies this instance as the present variant. */
    get kind(): 'some' {
        return 'some';
    }

    /**
     * Returns the contained value; the fallback is unused for `Some`.
     *
     * @param defaultValue - Fallback value, unused by this variant.
     * @returns The contained value.
     */
    getOrElse(defaultValue: T): T {
        return this.value;
    }

    /**
     * Returns the contained value.
     *
     * @returns The stored value.
     */
    get(): T {
        return this.value;
    }

    /**
     * Invokes the present-value handler.
     *
     * @typeParam U - Return type of the absent-value handler.
     * @typeParam V - Return type of the present-value handler.
     * @param onNone - Handler used by `None`; unused for `Some`.
     * @param onSome - Handler invoked with the stored value.
     * @returns The result of `onSome`.
     */
    fold<V>(_onNone: () => never, onSome: (value: T) => V): V {
        return onSome(this.value);
    }

    /**
     * Applies a function to the stored value and returns its `Maybe` result.
     *
     * @typeParam U - Type of the resulting value.
     * @param fn - Function applied to the stored value.
     * @returns The function result.
     */
    bind<U>(fn: (value: T) => MaybeLike<U>): MaybeLike<U> {
        return fn(this.value);
    }

    /**
     * Maps the stored value into a new `Maybe`.
     *
     * @typeParam U - Type returned by the mapping function.
     * @param fn - Function applied to the stored value.
     * @returns `Some` of the mapped value, or `None` if the result is `null` or `undefined`.
     */
    map<U>(fn: (value: T) => U): MaybeLike<U> {
        return Maybe.fromNullable(fn(this.value));
    }

    /**
     * Applies a function returning `Maybe`; this is an alias for {@link bind}.
     *
     * @typeParam U - Type of the resulting value.
     * @param fn - Function applied to the stored value.
     * @returns The function result without adding another `Maybe` layer.
     */
    flatMap<U>(fn: (value: T) => MaybeLike<U>): MaybeLike<U> {
        return this.bind(fn);
    }

    /**
     * Narrows this instance to `Some`.
     *
     * @returns Always `true`.
     */
    isSome(): this is Some<T> {
        return true;
    }

    /**
     * Narrows this instance to `None` when true.
     *
     * @returns Always `false`.
     */
    isNone(): this is None<T> {
        return false;
    }
}

/** A `Maybe` variant that represents the absence of a value. */
export class None<T> implements MaybeLike<T> {
    /** Identifies this instance as the absent variant. */
    get kind(): 'none' {
        return 'none';
    }

    /**
     * Returns the supplied fallback because this instance contains no value.
     *
     * @param defaultValue - Value to return.
     * @returns `defaultValue`.
     */
    getOrElse(defaultValue: T): T {
        return defaultValue;
    }

    /**
     * Attempts to retrieve a value from this absent instance.
     *
     * @returns This method never returns.
     * @throws {Error} Always throws because `None` contains no value.
     */
    get(): never {
        throw new Error('Cannot get value from None');
    }

    /**
     * Invokes the absent-value handler.
     *
     * @typeParam U - Return type of the absent-value handler.
     * @typeParam V - Return type of the present-value handler.
     * @param onNone - Handler invoked for this instance.
     * @param onSome - Handler used by `Some`; unused for `None`.
     * @returns The result of `onNone`.
     */
    fold<U, V>(onNone: () => U, onSome: (value: T) => V): U | V {
        return onNone();
    }

    /**
     * Preserves the absent value without invoking the function.
     *
     * @typeParam U - Type parameter of the resulting `Maybe`.
     * @param fn - Function that would transform a present value; unused for `None`.
     * @returns This absent instance typed as `Maybe<U>`.
     */
    flatMap<U>(fn: (value: T) => MaybeLike<U>): MaybeLike<U> {
        return this as unknown as MaybeLike<U>;
    }

    /**
     * Preserves absence without invoking the function.
     *
     * @typeParam U - Type of the value in the resulting `Maybe`.
     * @param fn - Function that would transform a present value; unused for `None`.
     * @returns A new `None<U>`.
     */
    bind<U>(fn: (value: T) => MaybeLike<U>): MaybeLike<U> {
        return new None<U>();
    }

    /**
     * Preserves absence without invoking the mapping function.
     *
     * @typeParam U - Type returned by the mapping function.
     * @param fn - Function that would transform a present value; unused for `None`.
     * @returns A new `None<U>`.
     */
    map<U>(fn: (value: T) => U): MaybeLike<U> {
        return new None<U>();
    }

    /**
     * Narrows this instance to `Some` when true.
     *
     * @returns Always `false`.
     */
    isSome(): this is Some<T> {
        return false;
    }

    /**
     * Narrows this instance to `None`.
     *
     * @returns Always `true`.
     */
    isNone(): this is None<T> {
        return true;
    }
}

/**
 * Creates a `Some` containing the supplied value.
 *
 * @typeParam T - Type of the contained value.
 * @param value - Value to wrap.
 * @returns A new `Some` instance.
 */
function some<T>(value: T): Some<T> {
    return new Some(value);
}

/**
 * Creates an empty `Maybe`.
 *
 * @typeParam T - Type of a value that may later be represented by this `Maybe`.
 * @returns A new `None<T>` instance.
 */
function none<T>(): None<T> {
    return new None();
}

/**
 * Infers a concrete result type for a non-nullish input.
 *
 * @typeParam T - Type of the supplied value.
 * @param value - Value to inspect.
 * @returns `None<T>` when `T` is nullish, otherwise `Some<T>`.
 */
function fromNullable<T>(value: T): T extends null | undefined ? None<T> : Some<T>;

/**
 * Wraps a value in the corresponding `Maybe` variant.
 *
 * @typeParam T - Type of the supplied value.
 * @param value - Value to inspect.
 * @returns `None` for `null` or `undefined`; otherwise `Some` containing the value.
 */
function fromNullable<T>(value: T): MaybeLike<T> {
    return value === null || value === undefined ? new None() : new Some(value);
}

/** Factory methods for creating and converting {@link MaybeLike} values. */
export const Maybe = { Some, None, some, none, fromNullable };
