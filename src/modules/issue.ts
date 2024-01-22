import { Action } from "./action";
import { Result } from "./result";

/**
 * Extends the standard Error class to include additional context relevant to actions and results.
 * An Issue is used to represent errors or problems that arise from performing actions, encapsulating both the error details and the context in which the error occurred.
 *
 * @template S The type of the state on which the action is performed.
 * @template P The type of parameters the action accepts.
 * @template C The type of the content returned by the action's execution.
 */
export class Issue<S, P, C> extends Error {
    /**
     * The failed result associated with the issue.
     */
    public readonly result: Result<S, P, C>;

    /**
     * The action associated with this result.
     */
    public readonly action: Action<P, S, C>;

    /**
     * Constructs a new Issue object representing the failed outcome of an action.
     *
     * @param message The error message.
     * @param result The failed result associated with the issue.
     * @param action The action that led to this issue.
     */
    private constructor(message: string, result: Result<S, P, C>, action: Action<P, S, C>) {
        super(message);
        if (!result.success) {
            this.name = this.constructor.name;
            this.result = result;
            this.action = action;

            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            }
        } else {
            throw new Error("Issue cannot be created from a successful result.");
        }
    }

    /**
     * Static method to create an Issue instance from an action and an error.
     * This method can be used to quickly encapsulate an error into an Issue object along with the action that led to the error.
     *
     * @param action The action that resulted in the error.
     * @param error The error that occurred.
     *
     * @returns {Issue<T>} A new Issue instance encapsulating the error and the action.
     */
    public static fromAction<S, P, C>(action: Action<P, S, C>, error: Error): Issue<S, P, C> {
        return new Issue<S, P, C>(error.message, Result.failure<S, P, C>(action, [error], null, null), action);
    }
}
