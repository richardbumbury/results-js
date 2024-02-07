import { randomUUID as uuid } from "crypto";
import { IssueJSON } from "../interfaces";
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
     * A unique identifier for each issue.
     */
    private readonly _id: string;

    /**
     * An optional identifier used to correlate this issue with other related issues and actions.
     */
    private readonly _correlationId?: string;

    /**
     * The failed result associated with the issue.
     */
    private readonly _result: Result<S, P, C>;

    /**
     * The action associated with this issue.
     */
    private readonly _action: Action<P, S, C>;

     /**
     * The timestamp when the issue  was created.
     */
     private readonly _timestamp: Date;

     /**
      * The execution time of the action, calculated as the difference between the action's timestamp and the issue's timestamp.
      * This may also represent the time it took to rehydrate the issue if the issue is deserialized.
      */
     private readonly _executionTime: number | null;

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
            this._result = result;
            this._action = action;
            this._timestamp =  new Date();
            this._executionTime = action.timestamp ? this._timestamp.getTime() - action.timestamp.getTime() : null;

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

    /**
     * Provides access to the action associated with this issue.
     * This allows tracing back to the action that led to the current issue.
     *
     * @returns The action that generated this issue.
     */
    public get action(): Action<P, S, C> {
        return this._action;
    }

    /**
     * Provides access to the result associated with this issue.
     *
     * @returns The result associate with this issue.
     */
    public get result(): Result<S, P, C> {
        return this._result;
    }

    /**
     * Provides access to the timestamp of when the issue was created.
     *
     * @returns The timestamp.
     */
    public get timestamp(): Date {
        return this._timestamp;
    }

    /**
     * Provides access to the execution time of the action associated with the issue.
     *
     * @returns The execution time in milliseconds.
     */
    public get executionTime(): number | null {
        return this._executionTime;
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

    /**
     * Static method to deserialize a JSON object into a Issue instance.
     * It reconstructs the state of an Issue based on its serialized form.
     * This method assumes that the action associated with the result can be reattached or identified through other means, as function references cannot be serialized directly.
     *
     * @param json The JSON object representing a serialized Issue.
     *
     * @returns A new Issue instance with properties populated from the JSON object.
     *
     * @throws When the JSON structure is invalid or essential properties are missing.
     */
    public static async fromJSON<S, P, C>(json: IssueJSON<S, P, C>): Promise<Issue<S, P, C>> {
        if (typeof json !== 'object' || !json.action || !json.result || !json.result.errors ) {
            throw new Error("Invalid JSON structure for Issue.");
        }

        const action = Action.fromJSON<P, S, C>({
            id: json.action.id,
            name: json.action.name,
            params: json.action.params,
            correlationId: json.action.correlationId
        });

        const result = await Result.fromJSON<S, P, C>(json.result)

        return new Issue<S, P, C>(
            json.message,
            result,
            action,
            json.correlationId
        );
    };

    /**
     * Serializes the issue into a JSON-friendly format.
     * This method returns a plain object containing the serializable properties of the issue,
     * making it suitable for logging, storing, or transmitting as a JSON string.
     *
     * @returns An object representing the issue's serializable state.
     */
    public toJSON(): IssueJSON<S, P, C> {
        return {
            id: this._id,
            correlationId: this._correlationId,
            name: this.name,
            message: this.message,
            action: {
                id: this.action.id,
                correlationId: this.action.correlationId,
                name: this.action.name,
                params: this.action.params,
            },
            result: this.result ? this.result.toJSON() : null,
            timestamp: this._timestamp.toISOString(),
            executionTime: this._executionTime,
        };
    }

    /**
     * Converts the issue into a string representation for debugging or logging.
     * This representation includes key details such as the issue's error message, associated action's name and ID, and execution time (if present).
     *
     * @returns A string representation of the issue.
     */
    public toString(): string {
        let string = `Issue ID: ${this._id}\n`;

        if (this._correlationId) {
            string += `Correlation ID: ${this._correlationId}\n`;
        }

        string += `Action Name: ${this._action.name}, Action ID: ${this._action.id}\n`;
        string += `Error Message: ${this.message}\n`;
        string += `Timestamp: ${this._timestamp.toISOString()}\n`;

        if (this._executionTime !== null) {
            string += `Execution Time: ${this._executionTime}ms\n`;
        }
        return string;
    }
}
