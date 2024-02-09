import { IEffect } from "../interfaces";
import { Action } from "./action";

/**
 * The Ledger class serves as a registry for exec functions associated with different action.
 * It enables the management and rehydration of Action instances, particularly useful when dealing with serialization/deserialization processes where function references cannot be maintained.
 */
export class Ledger {
    /**
     * A Map serving as a registry for exec functions. It maps action IDs (string) to their corresponding exec functions.
     */
    private static registry = new Map<string, (currentState: any, params: any) => Promise<IEffect<any, any>>>();

    /**
     * Registers an exec function for a specific action.
     *
     * @param id The unique identifier of the action.
     * @param exec The exec function to be associated with the action.
     *
     * @returns Boolean indicating successful registration.
     *
     * @throws Error if the exec function for the given action is already registered.
     */
    public static set(id: string, exec: (currentState: any, params: any) => Promise<IEffect<any, any>>): boolean {
        if (Ledger.registry.has(id)) {
            throw new Error(`Exec function for action '${id}' is already registered.`);
        }

        Ledger.registry.set(id, exec);

        return true;
    }

    /**
     * Retrieves the exec function for a given action.
     *
     * @param id The unique identifier of the action.
     *
     * @returns The exec function associated with the action.
     *
     * @throws Error if the exec function for the given action is not registered.
     */
    public static get(id: string): (currentState: any, params: any) => Promise<IEffect<any, any>> {
        const exec = Ledger.registry.get(id);

        if (!exec) {
            throw new Error(`Exec function for action '${id}' is not registered.`);
        }

        return exec;
    }

    /**
     * Checks whether an exec function for a specified action is registered in the Ledger.
     *
     * @param id The unique identifier of the action.
     *
     * @returns A Boolean indicating whether the exec function for the given action is registered.
     */
    public static has(id: string): boolean {
        return this.registry.has(id);
    }

    /**
     * Rehydrates an Action instance with its associated exec function.
     *
     * @param action The action instance to be rehydrated.
     * @param id The unique identifier of the action.
     *
     * @returns The rehydrated action instance.
     */
    public static rehydrate<P, S, C>(action: Action<P, S, C>, id: string): Action<P, S, C> {
        const exec = Ledger.get(id);

        return action.attach(exec);
    }
}
