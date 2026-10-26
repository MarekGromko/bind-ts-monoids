/**
 * Base contract for monadic values that support mapping and chaining.
 * Concrete types must satisfy the monad laws: left identity, right identity,
 * and associativity.
 * @typeParam T Type of the value contained in this monad.
 */
export abstract class Monad<T> {
    /**
     * Transforms the contained value and wraps the result in a new monad.
     * @param transform Function applied to the contained value.
     */
    abstract map<U>(transform: (value: T) => U): Monad<U>;

    /**
     * Transforms the contained value with a function that returns another monad.
     * @param transform Function applied to the contained value.
     */
    abstract flatMap<U>(transform: (value: T) => Monad<U>): Monad<U>;

    /**
     * Alias for `flatMap` that chains another monadic computation.
     * @param transform Function applied to the contained value.
     */
    bind<U>(transform: (value: T) => Monad<U>): Monad<U> {
        return this.flatMap(transform);
    }
}
