import clone from "lodash.clonedeep";

import { Action } from "./action";
import { Result } from "./result";
import { Issue } from "./issue";
import { Hooks } from "./hooks";

/**
 * Store class that acts as a central state manager for an application.
 * It manages the history of actions performed, the application"s current state, and provides mechanisms for state digests and history management.
 *
 * @template S The type of the state on which the action is performed.
 */
export class Store<S> {
    /**
     * The current state of the application. This is immutable from outside the Store.
     */
    private _state: S;

    /**
     * The current operating mode of the store.
     */
    private _mode: "development" | "production" | "test"

    /**
     * The metadata of the store. Default values include timestamp, version, and environment.
     */
    private readonly _metadata: Record<string, any>;

    /**
     * Initializes the store with a given state and configuration for history management.
     *
     * @param initialState The initial state of the application.
     * @param mode The current operating mode of the store.
     * @param metadata An optional object containing metadata related to the store.
     */
    private constructor(initialState: S, mode: "development" | "production" | "test" = "development", metadata: Record<string, any>) {
        this._state = initialState;
        this._mode = mode;
        this._metadata = metadata;
    }

    /**
     * Provides access to the current state of the application.
     *
     * @returns A deep clone of the current state as a read-only object.
     */
    get state(): S {
        return clone(this._state) as Readonly<S>;
    }

    /**
     * Provides access to the current operating mode of the store.
     *
     * @returns The current mode of the store.
     */
    get mode(): "development" | "production" | "test" {
        return this._mode;
    }

    /**
     * Provides access to the metadata associated with the store.
     *
     * @returns A record containing metadata about the store.
     */
    get metadata(): Record<string, any> {
        return this._metadata;
    }

    /**
     * Creates and initializes an instance of the Store.
     *
     * @param initialState The initial state of the application.
     * @param mode The current operating mode of the store.
     * @param metadata An optional object containing metadata related to the store.
     *
     * @returns An instance of the Store configured with the given initial state and settings.
     */
    public static create<S>(initialState: S, mode: "development" | "production" | "test" = "development", metadata?: Record<string, any>): Store<S> {
        const defaultMetadata = {
            timestamp: new Date().toISOString(),
            environment: mode
        };

        const mergedMetadata = { ...defaultMetadata, ...metadata}

        return new Store<S>(initialState, mode, mergedMetadata);
    }

    /**
     * Applies an action to the store's current state and updates the state if the action is successful.
     * This method encapsulates the outcome of the action's execution and manages state transitions, treating errors as data.
     * Freezes the state in development mode to enforce immutability.
     *
     * @param action The action to be applied to the store.
     *
     * @hook `before-state-change` Invoked before the state changes, with the current state as an argument.
     * @hook `after-state-change` Invoked after the state has successfully changed, with the new state as an argument.
     * @hook `after-action-cleanup` Invoked in a finally block after action application, regardless of outcome, with the action and outcome as arguments.
     * 
     * @returns A Promise that resolves to a Result representing the outcome of the action, or an Issue if there was a problem.
     */
    public async apply(action: Action<any, S, any>): Promise<Result<S, any, any> | Issue<S, any, any>> {
        let outcome;

        try {
            await Hooks.invoke("before-state-change", this._state);

            // Freeze the state to enforce immutability in development mode
            const state = this._mode === "development" ? this.freeze(clone(this._state)) : this._state;

            outcome = await this.invoke(action, state);

            if (outcome instanceof Result) {
                if (outcome.success && outcome.nextState !== null && outcome.nextState !== undefined) {
                    this._state = clone(outcome.nextState);

                    await Hooks.invoke("after-state-change", this._state);
                }

                return outcome;
            } else {
                console.error("Error applying action:", outcome);

                return outcome;
            }
        } catch (error) {
            const issue = error instanceof Issue ? error : Issue.fromAction(action, error as Error);

            console.error("Error applying action:", issue);

            return issue;
        } finally {
            await Hooks.invoke("after-action-cleanup", action, outcome);
        }
    }

    /**
     * Hydrates the store with a serialized state, typically fetched from an external source.
     *
     * @param state A string representing the serialized state to be hydrated.
     *
     * @hook `before-hydrate` Invoked before the hydration process begins, with the serialized state as an argument.
     * @hook `state-validation` Invoked after parsing the serialized state and before updating the store's state, allowing for validation of the parsed state.
     * @hook `after-hydrate` Invoked after the store's state has been successfully updated with the hydrated state.
     * @hook `hydrate-error` Invoked if an error occurs during the hydration process, with the error as an argument.
     * @hook `after-hydration-cleanup` Invoked in a finally block after the hydration process, regardless of outcome, with the hydrated (or attempted) state as an argument.
     * 
     * @returns A promise that resolves to a boolean indicating the success of the hydration process.
     */
    public async hydrate(state: string): Promise<boolean> {
        let nextState;

        try {
            await Hooks.invoke("before-hydrate", state);

            try {
                nextState = JSON.parse(state);
            } catch (error) {
                console.error(`Error parsing ${state}`, error);

                return false;
            }

            await Hooks.invoke("state-validation", nextState);

            this._state = nextState;

            await Hooks.invoke("after-hydrate", this._state);

            return true;
        } catch (error) {
            console.error("Hydration failed:", error);

            await Hooks.invoke("hydrate-error", error);

            return false;
        } finally {
            await Hooks.invoke("after-hydration-cleanup", nextState);
        }
    }

    /**
     * Recursively freezes an object and all of its child objects to enforce immutability.
     * This function is designed to work with complex object structures, including those with circular references, ensuring that no part of the object can be modified after freezing.
     *
     * @template T The type of the object being frozen.
     *
     * @param object The object to be frozen.
     * @param visited A set to track visited objects within the structure to handle circular references.
     *
     * @returns The same object passed as the parameter, but deeply frozen.
     *
     */
    private freeze<T>(object: T, visited: Set<any> = new Set()): T {
        if (visited.has(object)) {
            return object;
        }

        Object.freeze(object);

        visited.add(object);

        Object.getOwnPropertyNames(object).forEach(prop => {
            const p = (object as any)[prop];

            if (p !== null && (typeof p === "object" || typeof p === "function") && !Object.isFrozen(p)) {
                this.freeze(p, visited);
            }
        });

        return object;
    };

    /**
     * Executes an Action and returns a Result.
     *
     * @template S The type of the state on which the action operates.
     * @template P The type of parameters accepted by the action.
     * @template C The type of content produced by the action.
     *
     * @param action The Action to be executed.
     * @param state The current state before executing the action.
     *
     * @returns A promise that resolves to a Result, encapsulating the action's outcome and its effect on the state, or an Issue if it cannot invoke the action.
     */
    private async invoke<S, P, C>(action: Action<P, S, C>, state: S): Promise<Result<S, P, C> | Issue<S, P, C>> {
        try {
            const effect = await action.execute(state);

            // The transform function MUST return a new state object based on the current state to ensure immutability.
            // It must not mutate the original state object directly.
            const nextState = effect.transform(state);

            return Result.success<S, P, C>(action, effect.content, state, nextState);
        } catch (error) {
            return Issue.fromAction(action, error instanceof Error ? error : new Error(String(error)));
        }
    }
}
