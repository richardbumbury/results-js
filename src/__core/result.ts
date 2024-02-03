import { randomUUID as uuid } from "crypto";
import { diff, Diff } from "deep-diff";
import { ResultJSON } from "../__interfaces";
import { Action } from "./action";

/**
 * Represents the outcome of an action performed on a state.
 * This class encapsulates the result of the action, including the state transitions and any associated errors.
 *
 * @template S The type of the state on which the action is performed.
 * @template P The type of parameters the action accepts.
 * @template C The type of the content returned by the action's execution.
 *
 */
export class Result<S, P, C> {
    /**
     * A unique identifier for each result instance.
     */
    private readonly _id: string;

    /**
     * An optional identifier used to correlate this action with other related actions.
     */
    private readonly _correlationId?: string;

    /**
     * Indicates whether the action was successful.
     */
    private readonly _success: boolean;

    /**
     * The content or value produced by the action if successful.
     */
    private readonly _content: C | null;

    /**
     * An array of errors encountered during the action's execution.
     */
    private readonly _errors: Error[];

    /**
     * The action associated with this result.
     */
    private readonly _action: Action<P, S, C>;

    /**
     * The state before the action was applied.
     */
    private readonly _prevState: S | null;

    /**
     * The state after the action was applied.
     */
    private readonly _nextState: S | null;

    /**
     * The timestamp when the Result instance was created.
     */
    private readonly _timestamp: Date;

    /**
     * The execution time of the action, calculated as the difference between the action's timestamp and the result's timestamp.
     * This may also represent the time it took to rehydrate the result if the result is deserialized.
     */
    private readonly _executionTime: number | null;

    /**
     * The metadata related to the result object.
     */
    private _metadata: any

    /**
     * Constructs a new Result object representing the outcome of an action.
     *
     * @param success Indicates the success or failure of the action.
     * @param content The result produced by the action, if successful.
     * @param errors An array of errors encountered, if any.
     * @param action The action that led to this result.
     * @param prevState The state before the action was applied.
     * @param nextState The state after the action was applied.
     */
    private constructor(success: boolean, content: C | null = null, errors: Error[] = [], action: Action<P, S, C>, prevState: S | null = null, nextState: S | null = null, correlationId?: string) {
        this._id = uuid();
        this._correlationId = correlationId;
        this._success = success;
        this._content = content;
        this._errors = errors;
        this._action = action;
        this._prevState = prevState;
        this._nextState = nextState;
        this._timestamp =  new Date();
        this._executionTime = action.timestamp ? this._timestamp.getTime() - action.timestamp.getTime() : null;
    }

    /**
     * Provides access to the unique identifier of the action instance.
     *
     * @returns The unique identifier of the action.
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Provides access to an optional identifier used to correlate multiple actions.
     *
     * @returns The correlation identifier of the action.
     */
    public get correlationId(): string | undefined {
        return this._correlationId;
    }

    /**
     * Provides access to the success status of the action.
     *
     * @returns True if the action was successful, false otherwise.
     */
    public get success(): boolean {
        return this._success;
    }

    /**
     * Provides access to the content produced by the action if it was successful.
     * This could be the result of a computation, data retrieval, etc.
     *
     * @returns The content generated by the action, or null if the action failed.
     */
    public get content(): C | null {
        return this._content;
    }

    /**
     * Provides access to the errors encountered during the action's execution.
     * Multiple errors can be captured, reflecting various issues that occurred.
     *
     * @returns An array of errors, if any were encountered during the action.
     */
    public get errors(): Error[] {
        return this._errors;
    }

    /**
     * Provides access to the action associated with this result.
     * This allows tracing back to the action that led to the current result.
     *
     * @returns The action that generated this result.
     */
    public get action(): Action<P, S, C> {
        return this._action;
    }

    /**
     * Provides access tp the state of the system before the action was executed.
     * Useful for understanding the state transition caused by the action.
     *
     * @returns The state before the action, or null if not applicable.
     */
    public get prevState(): S | null {
        return this._prevState;
    }

    /**
     * Provides access to the state of the system after the action was executed.
     * This represents the new state resulting from the action.
     *
     * @returns The state after the action, or null if the action did not alter the state.
     */
    public get nextState(): S | null {
        return this._nextState;
    }

    /**
     * Provides access to the timestamp of when the Result was created.
     *
     * @returns The timestamp.
     */
    public get timestamp(): Date {
        return this._timestamp;
    }

    /**
     * Provides access to the execution time of the action.
     *
     * @returns The execution time in milliseconds.
     */
    public get executionTime(): number | null {
        return this._executionTime;
    }

    /**
     * Provides access to the metadata attached to the result object.
     */
    public get metadata(): any {
        return this._metadata;
    }

    /**
     * Sets metadata to for result object.
     */
    public set metadata(data: any) {
        this._metadata = data;
    }

    /**
     * Creates a successful result instance representing a successful outcome of an action.
     * This method is used when an action completes successfully, producing a new state and content.
     *
     * @param action The action that led to this successful result.
     * @param content The content produced by the action, if successful.
     * @param prevState The state before the action was applied.
     * @param nextState The state after the action was applied.
     *
     * @returns An instance of Result representing a successful action outcome.
     */
    public static success<S, P, C>(action: Action<P, S, C>, content: C, prevState: S | null, nextState: S): Result<S, P, C> {
        return new Result<S, P, C>(true, content, [], action, prevState, nextState, action.correlationId);
    }


    /**
     * Creates a failure result instance representing an unsuccessful outcome of an action.
     * This method is used when an action results in an error(s), impacting the state.
     *
     * @param action The action that led to this unsuccessful result.
     * @param errors The errors encountered during the action's execution.
     * @param prevState The state before the action was applied.
     * @param nextState The state after the action was attempted, null if the state is unchanged.
     *
     * @returns An instance of Result representing a failed action outcome.
     */
    public static failure<S, P, C>(action: Action<P, S, C>, errors: Error[], prevState: S | null, nextState: S | null = null): Result<S, P, C> {
        return new Result<S, P, C>(false, null, errors, action, prevState, nextState, action.correlationId);
    }

    /**
     * Static method to deserialize a JSON object into a Result instance.
     * It reconstructs the state of a Result based on its serialized form.
     * This method assumes that the action associated with the result can be reattached or identified through other means, as function references cannot be serialized directly.
     *
     * @param json The JSON object representing a serialized Result.
     * @param callback A callback function for deserializing the state. It receives the serialized state and returns the deserialized state.
     *
     * @returns A new Result instance with properties populated from the JSON object.
     *
     * @throws When the JSON structure is invalid or essential properties are missing.
     */
    public static fromJSON<S, P, C>(json: ResultJSON<S, P, C>, callback?: (state: any) => S): Result<S, P, C> {
        if (typeof json.success !== 'boolean' || !json.action || !Array.isArray(json.errors)) {
            throw new Error("Invalid JSON structure for Result.");
        }

        const action = Action.fromJSON<P, S, C>({
            name: json.action.name,
            params: json.action.params,
            correlationId: json.action.correlationId
        });

        const errors = json.errors.map(e => new Error(e.message));

        const nextState = callback ? callback(json.nextState) : json.nextState;
        const prevState = callback ? callback(json.prevState) : json.prevState;

        return new Result<S, P, C>(
            json.success,
            json.content,
            errors,
            action,
            prevState,
            nextState,
            json.action.correlationId
        );
    }


    /**
     * Serializes the result into a JSON-friendly format.
     * This method returns a plain object containing the serializable properties of the result.
     * It is useful for scenarios where the result needs to be converted to a JSON string, such as when storing the result in a database or sending it over a network.
     *
     * @returns An object representing the result's serializable state.
     */
    public toJSON(): ResultJSON<S, P, C> {
        return {
            id: this._id,
            success: this._success,
            content: this._content,
            errors: this._errors.map(error => ({ message: error.message, name: error.name })),
            action: {
                name: this._action.name,
                params: this._action.params,
            },
            prevState: this._prevState,
            nextState: this._nextState,
            timestamp: this._timestamp.toISOString(),
            executionTime: this._executionTime,
        };
    }

    /**
     * Checks if the result represents a successful outcome.
     * 
     * @returns True if the result is a success, false otherwise.
     */
    public isSuccess(): boolean {
        return this._success;
    }

    /**
     * Checks if the result represents a failure.
     * 
     * @returns True if the result is a failure, false otherwise.
     */
    public isFailure(): boolean {
        return !this._success;
    }

    /**
     * Transforms the content of this result using a provided function.
     * If the result is successful, the transformation function is applied to its content.
     * If the result is a failure, the original errors are preserved.
     *
     * @template U The type of the result after applying the transformation.
     *
     * @param f A transformation function to apply to the content of this result.
     *
     * @returns A new Result instance with the transformed content if successful, or the original failure with its errors if not successful.
     */
    public map<U>(f: (content: C) => U): Result<S, P, U> {
        if (this._success) {
            const content = this._content !== null ? f(this._content) : null;

            return Result.success<S, P, U>(this._action as any, content as unknown as U, this._prevState as unknown as S, this._nextState as unknown as S);
        } else {
            return Result.failure<S, P, U>(this._action as any, this._errors, this._prevState as unknown as S, this._nextState as unknown as S);
        }
    }

    /**
     * Applies a given function to the content of this result, if successful, and returns a new Result.
     * This method is typically used for chaining operations that also return a Result, allowing for the composition of results-producing functions.
     * If the content of this result is null, the function is still applied, allowing the function to handle the null case.
     *
     * @template U The type of the result's content after applying the function.
     *
     * @param f A function that takes the successful content (which may be null) and returns a new Result with potentially different content type.
     *
     * @returns A new Result instance with the transformed content if successful, or the original failure with its errors if not successful.
     */
    public bind<U>(f: (content: C) => Result<S, P, U>): Result<S, P, U> {
        if (this._success) {
            return f(this._content as C);
        } else {
            return Result.failure<S, P, U>(this._action as any, this._errors, this._prevState, this._nextState);
        }
    }

    /**
     * Applies one of two provided functions based on the success or failure of this result.
     * This method is a branching operation, allowing different handling for successful and failed outcomes.
     *
     * @template U The type of the result returned by either of the provided functions.
     *
     * @param onSuccess A function to be called if this result is successful. It takes the content (which may be null) and returns a new value.
     * @param onFailure A function to be called if this result is a failure. It takes the array of errors and returns a new value.
     *
     * @returns The result of calling either the onSuccess or onFailure function, based on the success status of this result. If the content of a successful result is null, onSuccess is still called with null casted to type C.
     */
    public fold<U>(onSuccess: (content: C) => U, onFailure: (errors: Error[]) => U): U {
        if (this._success) {
            return this._content !== null ? onSuccess(this._content) : onSuccess(null as unknown as C);
        } else {
            return onFailure(this._errors);
        }
    }

    /**
     * Provides a mechanism to recover from a failure, applying a function to the errors to produce a new successful result.
     * If the result is already successful, it returns the current instance.
     *
     * @param f A function that takes the array of errors and returns a new content value of the same type as the original content.
     *
     * @returns A successful Result with new content if the original Result was a failure, otherwise returns the original Result.
     */
    public recover(f: (errors: Error[]) => C): Result<S, P, C> {
        if (this._success) {
            return this;
        } else {
            return Result.success<S, P, C>(this._action, f(this._errors), this._prevState, this._nextState as unknown as S);
        }
    }

    /**
     * Provides an alternative Result if the current result is a failure.
     * If the result is successful, it returns the current instance.
     *
     * @param f A function that returns an alternative Result.
     *
     * @returns The current Result if it's successful, or the Result returned by function f if it's a failure.
     */
    public orElse(f: () => Result<S, P, C>): Result<S, P, C> {
        return this._success ? this : f();
    }

    /**
     * Generates a diff between the previous and next states of the action's result.
     * 
     * @returns An array of diff objects representing changes from the previous state to the next state, or undefined if no diff can be computed.
     */
    public generateDiff(): Diff<S, S>[] | undefined {
        if (this._prevState !== null && this._nextState !== null) {
            return diff(this._prevState, this._nextState);
        }

        return undefined;
    }
}
