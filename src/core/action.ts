import { randomUUID as uuid } from "crypto";
import { IActionJSON, IEffect } from "../interfaces";
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
     * A unique identifier for each action instance.
     */
    private readonly _id: string;

    /**
     * An optional identifier used to correlate this action with other related actions.
     */
    private readonly _correlationId?: string;

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
    private _exec: (currentState: S, params: P[]) => Promise<IEffect<S, C>>;

    /**
     * The timestamp when the action was created or initialized.
     */
    private readonly _timestamp: Date;

    /**
     * Constructs a new Action.
     *
     * @param name The name of the action, ideally providing a unique identifier.
     * @param params Parameters required for executing the action.
     * @param exec The function that defines the execution logic of the action.
     * @param correlationId An optional identifier used to correlate this action with related actions.
     */
    private constructor(name: string, params: P[], exec: (currentState: S, params: P[]) => Promise<IEffect<S, C>>, correlationId?: string) {
        this._id = uuid();
        this._correlationId = correlationId
        this._name = name;
        this._params = params;
        this._exec = exec;
        this._timestamp = new Date();
    }

    /**
     * Provides access to the unique identifier of the action instance.
     *
     * @returns The unique identifier of the action.
     */
    get id(): string {
        return this._id;
    }

    /**
     * Provides access to an optional identifier used to correlate multiple actions.
     *
     * @returns The correlation identifier of the action.
     */
    get correlationId(): string | undefined {
        return this._correlationId;
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
     * Provides access to the parameters for the action.
     *
     * @returns An array of parameters.
     */
    get params(): P[] {
        return this._params;
    }

    /**
     * Provides access to the timestamp marking the creation of the action.
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
     * @param correlationId An optional identifier used to correlate this action with related actions.
     *
     * @returns A new instance of the Action class.
     */
    public static create<P, S, C>(name: string, params: P[], exec: (currentState: S, params: P[]) => Promise<IEffect<S, C>>, correlationId?: string): Action<P, S, C> {
        if (!Ledger.has(name)){
            Ledger.set(name, exec)
        }

        return new Action<P, S, C>(name, params, exec, correlationId);
    }

    /**
     * Reconstructs an Action instance from a JSON object.
     * Creates a new Action instance based on previously serialized data.
     * A new unique identifier is generated for the rehydrated action to ensure uniqueness.
     *
     * @param json The JSON object to reconstruct the Action from. It should contain the name, params, and optionally the correlationId.
     *
     * @returns A new instance of the Action class with a new ID, the provided correlation ID (if any), name, params, and a new timestamp.
     */
    public static fromJSON<P, S, C>(json: { id: string; name: string; params: P[]; correlationId?: string }): Action<P, S, C> {
        const action = new Action<P, S, C>(
            json.name,
            json.params,
            async () => { throw new Error("Exec function not implemented. Attach exec function using attach().") },
            json.correlationId
        );

        if (Ledger.has(json.id)) {
            try {
                Ledger.rehydrate(action, json.id)
            } catch (error) {
                console.error(`Error reattaching exec function: ${error}`);
            }
        } else {
            console.warn(`Exec function for action '${json.id}' not found in the Ledger. A default exec function has been attached.`);
        }

        return action
    }

    /**
     * Serializes the action into a JSON-friendly format.
     *
     * @returns An object containing the action's serializable data: name, parameters, and timestamp.
     */
    public toJSON(): IActionJSON<P> {
        Ledger.set(this._id, this._exec);

        return {
            id: this._id,
            correlationId: this._correlationId,
            name: this._name,
            params: this._params,
            timestamp: this._timestamp.toISOString()
        };
    }

    /**
     * Attaches an execution function to the action.
     *
     * @param exec Defines the action's logic. It takes the current state and parameters, and must return a Promise that resolves to an Effect.
     *
     * @returns The instance of the Action class.
     */
    public attach(exec: (currentState: S, params: P[]) => Promise<IEffect<S, C>>): this {
        this._exec = async (currentState, params) => exec(currentState, params);

        return this;
    }

    /**
     * Executes the action using its attached execution logic.
     * Called to trigger the execution of the action.
     * Ensures that the exec function has been attached and then invokes it with the current state and predefined parameters.
     *
     * @param state The current state of the application or context in which the action is executed.
     *
     * @returns A promise that resolves to an Effect, representing the effect of the action on the state.
     *
     * @throws An error if the exec function has not been attached to the action.
     */
    public async execute(state: S): Promise<IEffect<S, C>> {
        if (!this._exec) {
            throw new Error("Exec function not implemented. Attach exec function using attach().");
        }

        return this._exec(state, this._params);
    }
}
