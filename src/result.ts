import { Maybe, None, Some } from './maybe.ts';
import type { Monad } from './monad.ts';

/**
 * Represents a computation that either succeeds with a value or fails with an error.
 * Operations such as {@link map} and {@link bind} run only for successful results;
 * failures retain their error value unchanged.
 *
 * @typeParam T - Type of the value represented by `Success`.
 * @typeParam E - Type of the value represented by `Failure`.
 */
export interface ResultLike<T, E> extends Monad<T> {
    /** Discriminates between a successful (`success`) and failed (`failure`) result. */
    readonly kind: 'success' | 'failure';

    /**
     * Converts this result to a `Maybe` containing its success value, or to `None` for a failure.
     *
     * @returns The success value as `Some`, or the absent `Maybe` variant for a failure.
     */
    asMaybe(): Maybe<T>;

    /**
     * Returns the success value.
     *
     * @returns The contained value when this is a success.
     * @throws {Error} When this is a failure.
     */
    get(): T;

    /**
     * Returns the failure value.
     *
     * @returns The contained error when this is a failure.
     * @throws {Error} When this is a success.
     */
    getError(): E;

    /**
     * Handles both variants by invoking the callback for the current result.
     *
     * @typeParam U - Return type of the failure handler.
     * @typeParam V - Return type of the success handler.
     * @param onFailure - Callback invoked with the error when this is a failure.
     * @param onSuccess - Callback invoked with the value when this is a success.
     * @returns The value returned by the callback corresponding to this variant.
     */
    fold<U, V>(onFailure: (error: E) => U, onSuccess: (value: T) => V): U | V;

    /**
     * Transforms the success value while preserving failures and their error type.
     *
     * @typeParam U - Type returned by the mapping function.
     * @param fn - Function applied to a success value; not called for a failure.
     * @returns A result containing the mapped value, or the unchanged failure.
     */
    map<U>(fn: (value: T) => U): Result<U, E>;

    /**
     * Composes a function that returns another result, avoiding a nested result.
     *
     * @typeParam U - Type of the value in the resulting result.
     * @typeParam F - Error type that may be returned by `fn`; defaults to `E`.
     * @param fn - Function applied to a success value; not called for a failure.
     * @returns The function result for a success, or the unchanged failure. The error type
     * includes both `E` and `F`.
     */
    bind<U, F = E>(fn: (value: T) => Result<U, F>): Result<U, E | F>;

    /**
     * Alias for {@link bind} that composes a function returning another result.
     *
     * @typeParam U - Type of the value in the resulting result.
     * @typeParam F - Error type that may be returned by `fn`; defaults to `E`.
     * @param fn - Function applied to a success value; not called for a failure.
     * @returns The composed result, with error type `E | F`.
     */
    flatMap<U, F = E>(fn: (value: T) => Result<U, F>): Result<U, E | F>;

    /**
     * Checks whether this result is a success and narrows its type when true.
     *
     * @returns `true` for `Success`; otherwise `false`.
     */
    isSuccess(): this is Success<T, E>;

    /**
     * Checks whether this result is a failure and narrows its type when true.
     *
     * @returns `true` for `Failure`; otherwise `false`.
     */
    isFailure(): this is Failure<T, E>;
}

/**
 * A result represented by either its successful or failed variant.
 *
 * @typeParam T - Type of the successful value.
 * @typeParam E - Type of the failure value.
 */
export type Result<T, E> = Success<T, E> | Failure<T, E>;

/**
 * A `Result` variant containing a successful value.
 *
 * @typeParam T - Type of the successful value.
 * @typeParam E - Error type associated with this result; defaults to `never`.
 */
export class Success<T, E = never> implements ResultLike<T, E> {
    /** The successful value stored by this instance. */
    private readonly value: T;

    /**
     * Creates a successful result containing `value`.
     *
     * @param value - Value to store as the success value.
     */
    constructor(value: T) {
        this.value = value;
    }

    /** Identifies this instance as the successful variant. */
    get kind(): 'success' {
        return 'success';
    }

    /**
     * Converts the success value to `Some`.
     *
     * @returns A `Some` containing the stored value.
     */
    asMaybe(): Some<T> {
        return Maybe.some(this.value);
    }

    /**
     * Returns the success value; `defaultValue` is unused for this variant.
     *
     * @param defaultValue - Fallback value, unused by `Success`.
     * @returns The stored success value.
     */
    getOrElse(_defaultValue: T): T {
        return this.value;
    }

    /**
     * Returns the success value.
     *
     * @returns The stored value.
     */
    get(): T {
        return this.value;
    }

    /**
     * Attempts to retrieve an error from this successful result.
     *
     * @returns This method never returns.
     * @throws {Error} Always, because a success has no error value.
     */
    getError(): E {
        throw new Error('Cannot get error from Success');
    }

    /**
     * Invokes the success handler.
     *
     * @typeParam U - Return type of the failure handler.
     * @typeParam V - Return type of the success handler.
     * @param onFailure - Handler for failures; unused by `Success`.
     * @param onSuccess - Handler invoked with the stored value.
     * @returns The value returned by `onSuccess`.
     */
    fold<V>(_onFailure: (error: E) => never, onSuccess: (value: T) => V): V {
        return onSuccess(this.value);
    }

    /**
     * Maps the success value into a new result.
     *
     * @typeParam U - Type returned by the mapping function.
     * @param fn - Function applied to the stored value.
     * @returns A successful result containing the mapped value.
     */
    map<U>(fn: (value: T) => U): Result<U, E> {
        return success<U, E>(fn(this.value));
    }

    /**
     * Applies a function that returns another result.
     *
     * @typeParam U - Type of the value in the returned result.
     * @typeParam F - Error type of the result returned by `fn`; defaults to `E`.
     * @param fn - Function applied to the stored success value.
     * @returns The result returned by `fn`.
     */
    bind<U, F = E>(fn: (value: T) => Result<U, F>): Result<U, F> {
        return fn(this.value);
    }

    /**
     * Alias for {@link bind}.
     *
     * @typeParam U - Type of the value in the returned result.
     * @typeParam F - Error type of the result returned by `fn`; defaults to `E`.
     * @param fn - Function applied to the stored success value.
     * @returns The result returned by `fn`.
     */
    flatMap<U, F = E>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
        return this.bind(fn);
    }

    /**
     * Narrows this instance to `Success`.
     *
     * @returns Always `true`.
     */
    isSuccess(): this is Success<T, E> {
        return true;
    }

    /**
     * Checks whether this instance is `Failure`.
     *
     * @returns Always `false`.
     */
    isFailure(): this is Failure<T, E> {
        return false;
    }
}

/**
 * A `Result` variant containing a failure value.
 *
 * @typeParam T - Type of the success value this result could contain.
 * @typeParam E - Type of the failure value.
 */
export class Failure<T, E> implements ResultLike<T, E> {
    /** The failure value stored by this instance. */
    private readonly error: E;

    /**
     * Creates a failed result containing `error`.
     *
     * @param error - Value to store as the failure value.
     */
    constructor(error: E) {
        this.error = error;
    }

    /** Identifies this instance as the failed variant. */
    get kind(): 'failure' {
        return 'failure';
    }

    /**
     * Converts this failure to the absent `Maybe` variant.
     *
     * @returns {None<T>} The `None` instance created to represent absence.
     */
    asMaybe(): None<T> {
        return Maybe.none();
    }

    /**
     * Attempts to retrieve a success value from this failed result.
     *
     * @returns This method never returns.
     * @throws {Error} Always, because a failure has no success value.
     */
    get(): never {
        throw new Error('Cannot get value from Failure');
    }

    /**
     * Returns the failure value.
     *
     * @returns The stored error.
     */
    getError(): E {
        return this.error;
    }

    /**
     * Invokes the failure handler.
     *
     * @typeParam U - Return type of the failure handler.
     * @typeParam V - Return type of the success handler.
     * @param onFailure - Handler invoked with the stored error.
     * @param onSuccess - Handler for successes; unused by `Failure`.
     * @returns The value returned by `onFailure`.
     */
    fold<U>(onFailure: (error: E) => U, _onSuccess: (value: T) => never): U {
        return onFailure(this.error);
    }

    /**
     * Preserves this failure without invoking the mapping function.
     *
     * @typeParam U - Type of the success value in the resulting result.
     * @param fn - Function that would transform a success value; unused by `Failure`.
     * @returns A failure containing the original error.
     */
    map<U>(fn: (value: T) => U): Failure<U, E> {
        return this as unknown as Failure<U, E>;
    }

    /**
     * Preserves this failure without invoking the supplied function.
     *
     * @typeParam U - Type of the success value in the resulting result.
     * @typeParam F - Error type the function could return; defaults to `E`.
     * @param fn - Function that would compose a success value; unused by `Failure`.
     * @returns A failure containing the original error, typed with error type `E | F`.
     */
    bind<U, F = E>(fn: (value: T) => Result<U, F>): Failure<U, E> {
        return this as unknown as Failure<U, E>;
    }

    /**
     * Alias for {@link bind}; preserves this failure without invoking `fn`.
     *
     * @typeParam U - Type of the success value in the resulting result.
     * @typeParam F - Error type the function could return; defaults to `E`.
     * @param fn - Function that would compose a success value; unused by `Failure`.
     * @returns A failure containing the original error, typed with error type `E | F`.
     */
    flatMap<U, F = E>(fn: (value: T) => Result<U, F>): Failure<U, E> {
        return this.bind(fn);
    }

    /**
     * Checks whether this instance is `Success`.
     *
     * @returns Always `false`.
     */
    isSuccess(): this is Success<T, E> {
        return false;
    }

    /**
     * Narrows this instance to `Failure`.
     *
     * @returns Always `true`.
     */
    isFailure(): this is Failure<T, E> {
        return true;
    }
}

/**
 * Creates a successful result.
 *
 * @typeParam T - Type of the success value.
 * @typeParam E - Error type associated with the result; defaults to `never`.
 * @param value - Value to wrap as a success.
 * @returns A {@link Success} instance containing the supplied value.
 */
function success<T, E = unknown>(value: T): Success<T, E> {
    return new Success<T, E>(value);
}

/**
 * Creates a failed result.
 *
 * @typeParam T - Type of the success value this result could contain; defaults to `never`.
 * @typeParam E - Type of the failure value; defaults to `unknown`.
 * @param error - Value to wrap as a failure.
 * @returns A {@link Failure}
 */
function failure<T = never, E = unknown>(error: E): Failure<T, E> {
    return new Failure<T, E>(error);
}

/**
 * Checks whether a value is an instance of {@link Success} or {@link Failure}.
 *
 * @typeParam T - Type of the success value represented by the result.
 * @typeParam E - Type of the failure value represented by the result.
 * @param value - Value to check.
 * @returns `true` when `value` is a `Success` or `Failure` instance; otherwise `false`.
 */
function isResult<T = unknown, E = unknown>(value: unknown): value is Result<T, E> {
    return value instanceof Success || value instanceof Failure;
}
/**
 * Factory methods and variant constructors for creating {@link ResultLike} values.
 *
 * Use {@link Result.success} or {@link Result.failure} to create a result through
 * the interface, or {@link Success} and {@link Failure} to construct a variant directly.
 */
export const Result = { Success, Failure, success, failure, isResult };
