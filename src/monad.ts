/**
 * Describes a value that supports transformation and monadic composition.
 *
 * @typeParam T - Type of the value represented by this monad.
 */
export interface Monad<T> {
    /**
     * Applies a function that returns another monad and composes its result.
     *
     * @typeParam U - Type of the value represented by the resulting monad.
     * @param fn - Function applied to the value represented by this monad.
     * @returns The monad returned by `fn`, composed according to the implementing type's rules.
     */
    bind<U>(fn: (value: T) => Monad<U>): Monad<U>;

    /**
     * Transforms the represented value while preserving the monadic context.
     *
     * @typeParam U - Type returned by the mapping function.
     * @param fn - Function applied to the value represented by this monad.
     * @returns A monad representing the transformed value.
     */
    map<U>(fn: (value: T) => U): Monad<U>;

    /**
     * Composes a function that returns a monad, avoiding a nested monadic result.
     *
     * @typeParam U - Type of the value represented by the resulting monad.
     * @param fn - Function applied to the value represented by this monad.
     * @returns The composed monadic result.
     */
    flatMap<U>(fn: (value: T) => Monad<U>): Monad<U>;
}
