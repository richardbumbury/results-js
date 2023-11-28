import { IAction } from "../interfaces";
import { Result } from "./result";

/**
 * Extends the standard Error class to include additional context relevant to actions and results.
 * An Issue is used to represent errors or problems that arise from performing actions, encapsulating both the error details and the context in which the error occurred.
 *
 * @template T The type of the state associated with the action that caused the issue.
 */
export class Issue<T, P, R> extends Error {
    /**
     * The failed result associated with the issue.
     */
    public result: Result<T, P, R>;

    /**
     * The action associated with this result.
     */
    public action: IAction<P, R>;

    /**
     * Constructs a new Issue object representing the failed outcome of an action.
     *
     * @param message The error message.
     * @param result The failed result associated with the issue.
     * @param action The action that led to this issue.
     */
    constructor(message: string, result: Result<T, P, R>, action: IAction<P, R>) {
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
    static fromAction<T, P, R>(action: IAction<P, R>, error: Error): Issue<T, P, R> {
        return new Issue<T, P, R>(error.message, Result.failure<T, P, R>(action, [error], null, null), action);
    }
}
