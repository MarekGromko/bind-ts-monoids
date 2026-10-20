export class Maybe<T>{
    private x!: T

    get(): T {
        return this.x;
    }
}