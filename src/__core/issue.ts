import { randomUUID as uuid } from "crypto";
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
     * A unique identifier for each issue instance.
     */
    private readonly _id: string;

    /**
     * An optional identifier used to correlate this issue with other related issues and actions.
     */
    private readonly _correlationId?: string;

    /**
     * The failed result associated with the issue.
     */
    public readonly result: Result<S, P, C>;

    /**
     * The action associated with this result.
     */
    public readonly action: Action<P, S, C>;

    /**
     * Map that holds unique error codes with corresponding error messages.
     */
    private static readonly _codes = new Map<string, string>();

    /**
     * Map that holds additional error messages that might be relevant for specific issues.
     */
    private static readonly _messages = new Map<string, string>();

    /**
     * Constructs a new Issue object representing the failed outcome of an action.
     *
     * @param message The error message.
     * @param result The failed result associated with the issue.
     * @param action The action that led to this issue.
     *
     * @throws An Error is an attempt is made to create an issue from a successful result.
     */
    private constructor(message: string, result: Result<S, P, C>, action: Action<P, S, C>, correlationId?: string) {
        super(message);
        if (!result.success) {
            this._id = uuid();
            this._correlationId = correlationId;
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
     * Provides access to the unique identifier of the issue instance.
     *
     * @returns The unique identifier of the issue.
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Provides access to an optional identifier used to correlate multiple issues and actions.
     *
     * @returns The correlation identifier of the issue.
     */
    public get correlationId(): string | undefined {
        return this._correlationId;
    }

    public static get code() {
        return {
            /**
             * Sets an error code and its associated message.
             *
             * @param code The unique error code.
             * @param message The message associated with the error code.
             */
            set: ({ code, message }: { code: string, message: string }) => {
                Issue._codes.set(code, message);
            },

            /**
             * Retrieves the message associated with a given error code.
             *
             * @param code The error code.
             * 
             * @returns The message associated with the error code, or undefined if not found.
             */
            get: (code: string): string | undefined => {
                return Issue._codes.get(code);
            }
        };
    }

    public static get message() {
        return {
            /**
             * Sets an additional message for a specific issue.
             *
             * @param issueId The unique identifier of the issue.
             * @param message The additional message to associate with the issue.
             */
            set: ({ issueId, message }: { issueId: string, message: string }) => {
                Issue._messages.set(issueId, message);
            },

            /**
             * Retrieves the additional message associated with a specific issue.
             *
             * @param issueId The unique identifier of the issue.
             * 
             * @returns The additional message associated with the issue, or undefined if not found.
             */
            get: (issueId: string): string | undefined => {
                return Issue._messages.get(issueId);
            }
        };
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
        return new Issue<S, P, C>(error.message, Result.failure<S, P, C>(action, [error], null, null), action, action.correlationId);
    }
}
