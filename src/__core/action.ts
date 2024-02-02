import { ActionJSON, Effect } from "../__interfaces";
import { Ledger } from "./ledger";

/**
 * Represents an executable action within an application.
 *
 * @template P The type of parameters the action accepts.
 * @template S The type of the state on which the action is performed.
 * @template C The type of the content returned by the action's execution.
 */
export class Action<P , S , C > {

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
     * It takes the current state and parameters, and returns a Promise that resolves to an Effect.
     * The Effect represents the effect of an action's execution, including its direct outcome and impact on the state.
     */
    private _exec: (currentState: S, params: P[]) => Promise<Effect<S, C>>;

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
    private constructor(name: string, params: P[], exec: (currentState: S, params: P[]) => Promise<Effect<S, C>>) {
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
    public get name(): string {
        return this._name;
    }

    /**
     * Provides access to the parameters for the action.
     *
     * @returns An array of parameters.
     */
    public get params(): P[] {
        return this._params;
    }

    /**
     * Provides access to the timestamp marking the creation of the action.
     *
     * @returns The timestamp of the action's creation.
     */
    public get timestamp(): Date {
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
    public static create<P, S, C>(name: string, params: P[], exec: (currentState: S, params: P[]) => Promise<Effect<S, C>>): Action<P, S, C> {
        if (!Ledger.has(name)){
            Ledger.set(name, exec)
        }

        return new Action<P, S, C>(name, params, exec);
    }

    /**
     * Reconstructs an Action instance from a JSON object.
     * This static method is used to create a new Action instance based on previously serialized data.
     * The exec function cannot be serialized, and it needs to be reattached to the Action after using fromJSON.
     *
     * @param json The JSON object to reconstruct the Action from. It should contain the name, params. A new timestamp will be automatically generated.
     *
     * @returns A new instance of the Action class with the name, params, and timestamp set from the JSON object.
     */
    public static fromJSON<P, S, C>(json: { name: string; params: P[]; }): Action<P, S, C> {
        return new Action<P, S, C>(json.name, json.params, async () => {
            throw new Error("Exec function not implemented. Attach exec function using attach().");
        });
    }

    /**
     * Serializes the action into a JSON-friendly format.
     * This method returns a plain object containing the serializable properties of the action.
     * It is useful for scenarios where the action needs to be converted to a JSON string, such as when storing the action in a database or sending it over a network.
     *
     * @returns An object containing the action's serializable data: name, parameters, and timestamp.
     */
    public toJSON(): ActionJSON<P> {
        return { name: this._name, params: this._params, timestamp: this._timestamp };
    }

    /**
     * Attaches an execution function to the action.
     * This function defines the asynchronous logic to be executed when the action is invoked.
     *
     * @param exec The execution function that defines the action's logic. It takes the current state and parameters, and must return a Promise that resolves to an Effect.
     *
     * @returns The instance of the Action class.
     */
    public attach(exec: (currentState: S, params: P[]) => Promise<Effect<S, C>>): this {
        this._exec = async (currentState, params) => {
            return exec(currentState, params);
        };

        return this;
    }

    /**
     * Executes the action using its attached execution logic.
     * This method should be called to trigger the execution of the action.
     * It ensures that the exec function has been attached and then invokes it with the current state and predefined parameters.
     *
     * @param state The current state of the application or context in which the action is executed.
     *
     * @returns A Promise that resolves to an Effect, representing the effect of the action on the state.
     *
     * @throws An error if the exec function has not been attached to the action.
     */
    public async execute(state: S): Promise<Effect<S, C>> {
        if (!this._exec) {
            throw new Error("Exec function not implemented. Attach exec function using attach().");
        }

        return this._exec(state, this._params);
    }
}
