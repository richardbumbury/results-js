import { IAction } from "../interfaces";

/**
 * The Action class implements the IAction interface, providing a concrete representation of an executable action within a system.
 *
 * @template P The type of parameters the action accepts.
 * @template R The type of the response produced by executing the action.
 */
export class Action<P = any, R = any> implements IAction<P, R> {
    /**
     * The name of the action.
     */
    private readonly _name: string;

    /**
     * The parameters passed to the action.
     */
    private readonly _params: P[];

    /**
     * The function encapsulating the operation the action will execute.
     */
    private readonly _exec: (params: P[]) => R;

    /**
     * The timestamp when the action was created or initialized.
     */
    private readonly _timestamp: Date;

    /**
     * Constructs a new Action object representing an executable action to change the state within an application.
     *
     * @param name The name of the action.
     * @param params The parameters passed to the action required for its execution.
     * @param exec The function encapsulating the execution logic that is invoked to perform the action.
     */
    private constructor(name: string, params: P[], exec: (params: P[]) => R) {
        this._name = name;
        this._params = params;
        this._exec = exec;
        this._timestamp = new Date();
    }

    /**
     * Provides access to the name of the action.
     *
     * @returns The name of the action.
     */
    get name(): string {
        return this._name;
    }

    /**
     * Provides access to the parameters used to execute the action.
     *
     * @returns An array of parameters for the action.
     */
    get params(): P[] {
        return this._params;
    }

    /**
     * Provides access to the action's execution logic.
     *
     * @returns The exec function of the action.
     */
    get exec(): (params: P[]) => R {
        return this._exec;
    }

    /**
     * Provides access to the timestamp of the action.
     *
     * @returns The timestamp indicating when the action was created.
     */
    get timestamp(): Date {
        return this._timestamp;
    }

    /**
     * Creates a new action.
     *
     * @template P The type of parameters that the action will accept.
     * @template R The type of the result that the action will produce upon execution.
     *
     * @param name The name of the action.
     * @param params The parameters passed to the `exec` function during execution.
     * @param exec The execution logic of the action.
     *
     * @returns A new instance of Action, configured with the specified name, execution logic, and parameters.
     */
    static create<P = any, R = any>(name: string, exec: (params: P[]) => R, ...params: P[]): Action<P, R> {
        return new Action<P, R>(name, params, exec);
    }

}
