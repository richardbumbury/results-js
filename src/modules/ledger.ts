import { Effect } from "../interfaces";
import { Action } from "./action";

/**
 * The Ledger class serves as a registry for exec functions associated with different action types.
 * It enables the management and rehydration of Action instances, particularly useful when dealing with serialization/deserialization processes where function references cannot be maintained.
 */
export class Ledger {
    /**
     * A Map serving as a registry for exec functions. It maps action types (string) to their corresponding exec functions.
     * This registry is essential for the rehydration process of Action instances, allowing the reattachment of exec functions, which cannot be serialized/deserialized.
     * The use of a Map ensures efficient retrieval and management of these functions.
     */
    private static registry = new Map<string, (currentState: any, params: any) => Promise<Effect<any, any>>>();

    /**
     * Registers an exec function for a specific action type. If the type already exists, an error is thrown.
     *
     * @param type A unique identifier for the action type.
     * @param exec The exec function to be associated with the action type.
     *
     * @returns Boolean indicating successful registration.
     *
     * @throws Error if the exec function for the given type is already registered.
     */
    public static set(type: string, exec: (currentState: any, params: any) => Promise<Effect<any, any>>): boolean {
        if (Ledger.registry.has(type)) {
            throw new Error(`Exec function for action type '${type}' is already registered.`);
        }

        Ledger.registry.set(type, exec);

        return true;
    }

    /**
     * Retrieves the exec function for a given action type.
     *
     * @param type The type of action.
     *
     * @returns The exec function associated with the action type.
     *
     * @throws Error if the exec function for the given type is not registered.
     */
    public static get(type: string): (currentState: any, params: any) => Promise<Effect<any, any>> {
        const exec = Ledger.registry.get(type);
        if (!exec) {
            throw new Error(`Exec function for action type '${type}' is not registered.`);
        }

        return exec;
    }

    /**
     * Rehydrates an Action instance with its associated exec function based on the action type.
     *
     * @param action The action instance to be rehydrated.
     * @param type The type of action.
     *
     * @returns The rehydrated action instance.
     */
    public static rehydrate<P, S, C>(action: Action<P, S, C>, type: string): Action<P, S, C> {
        const exec = Ledger.get(type);

        return action.attach(exec);
    }
}
