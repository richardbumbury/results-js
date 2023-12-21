import { Action as IAction, Effect as IEffect } from "../interfaces";

/**
 * Represents an executable action within an application.
 *
 * @template P The type of parameters the action accepts.
 * @template S The type of the state on which the action is performed.
 * @template C The type of the content returned by the action's execution.
 */
export class Action<P = any, S = any, C = any> implements IAction<P, S, C> {

    /**
     * The name of the action, serving as an identifier.
     */
    private readonly _name: string;

    /**
     * The parameters passed to the action, used in its execution.
     */
    private readonly _params: P[];

    /**
     * The function that encapsulates the operation the action will execute.
     * It takes the current state and parameters, and returns the new state resulting from the action.
     * Supports asynchronous operations, as indicated by the possible Promise return type.
     */
    private readonly _exec: (currentState: S, params: P[]) => IEffect<S, C>;

    /**
     * The timestamp when the action was created or initialized.
     * Useful for tracking, logging, or timing purposes.
     */
    private readonly _timestamp: Date;

    /**
     * Constructs a new Action.
     *
     * @param name The name of the action, providing a unique identifier.
     * @param params Parameters required for executing the action.
     * @param exec The function that defines the execution logic of the action.
     */
    private constructor(name: string, params: P[], exec: (currentState: S, params: P[]) => IEffect<S, C>) {
        this._name = name;
        this._params = params;
        this._exec = exec;
        this._timestamp = new Date();
    }

    /**
     * Gets the name of the action.
     *
     * @returns The name of the action.
     */
    get name(): string {
        return this._name;
    }

    /**
     * Gets the parameters for the action.
     *
     * @returns An array of parameters.
     */
    get params(): P[] {
        return this._params;
    }

    /**
     * Gets the execution logic of the action.
     *
     * @returns The function encapsulating the action's execution logic.
     */
    get exec(): (currentState: S, params: P[]) => IEffect<S, C> {
        return this._exec;
    }

    /**
     * Gets the timestamp marking the creation of the action.
     *
     * @returns The timestamp of the action's creation.
     */
    get timestamp(): Date {
        return this._timestamp;
    }

    /**
     * Factory method to create a new Action instance.
     *
     * @param name The name of the action.
     * @param params Parameters required for the action.
     * @param exec The execution function that defines the action's logic.
     *
     * @returns A new instance of the Action class.
     */
    static create<P, S, C>(name: string, params: P[], exec: (currentState: S, params: P[]) => IEffect<S, C>): Action<P, S, C> {
        return new Action<P, S, C>(name, params, exec);
    }
}
