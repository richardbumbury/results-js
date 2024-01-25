import { randomUUID as uuid } from "crypto";
import { invoke } from "../__utils";
import { Digest } from "../__interfaces";
import { Action } from "./action";
import { Ledger } from "./ledger";
import { Result } from "./result";
import { Issue } from "./issue";

/**
 * Store class that acts as a central state manager for an application.
 * It manages the history of actions performed, the application"s current state, and provides mechanisms for state digests and history management.
 *
 * @template S The type of the state on which the action is performed.
 */
export class Store<S> {
    /**
     * The current state of the application. It is immutable from outside the Store.
     */
    private _state: S;

    /**
     * The index of the current action in the history.
     */
    private _currentActionIndex: number = -1;

    /**
     * The the number of actions during the current digest interval.
     */
    private _actionCounter: number = 0;

    /**
     * The history of actions performed on the state.
     */
    private _history: Action<any, S, any>[] = [];

    /**
     * The maximum number of actions to retain in the history.
     */
    private readonly _maxHistorySize: number;

    /**
     * The maximum duration (in milliseconds) to retain actions in the history.
     */
    private readonly _maxHistoryTime: number;

    /**
     * The list of subscribers to state changes.
     */
    private _subscribers: ((action: Action<any, S, any>, newState: S) => void)[] = [];

    /**
     * The list of middlewares that act on state changes.
     */
    private _middlewares: ((action: Action<any, S, any>) => void)[] = [];

    /**
     * The external datastore used for saving and retrieving state digests.
     */
    private readonly _datastore: any;

    /**
     * The list of digests of the state taken at various points in time.
     */
    private _digests: Digest<S>[] = [];

    /**
     * The number of actions until a new digest is created.
     */
    private readonly _digestInterval: number;

    /**
     * The metadata of the store. Default values include timestamp, version, and environment.
     */
    private readonly _metadata: Record<string, any>;

    /**
     * Private constructor for the Store class to enforce the use of the static create method.
     * Initializes the store with a given state and configuration for history management.
     *
     * @param initialState The initial state of the application.
     * @param [maxHistorySize=50] The maximum number of actions to keep in the history. Defaults to 50.
     * @param [maxHistoryTime=86400000] The maximum duration (in milliseconds) to keep actions in the history. Defaults to 24 hours.
     * @param datastore An optional external datastore for saving and retrieving state digests.
     * @param [digestInterval=10] The number of actions until a new digest is created.
     * @param metadata An optional object containing metadata related to the store.
     */
    private constructor(initialState: S, maxHistorySize: number = 50, maxHistoryTime: number = 86400000 /* 24 hours */, datastore: any, digestInterval: number = 10, metadata: Record<string, any>) {
        this._state = initialState;
        this._maxHistorySize = maxHistorySize;
        this._maxHistoryTime = maxHistoryTime;
        this._datastore = datastore;
        this._digestInterval = digestInterval;
        this._metadata = metadata;
    }

    /**
     * Provides access to the current state of the application.
     */
    public get state(): S {
        return this._state;
    }

    /**
     * Provides access to a shallow copy of the list of actions in the history.
     */
    public get history(): Action<any, S, any>[] {
        return this._history.slice();
    }

    /**
     * Provides access to the maximum size of the history.
     */
    public get maxHistorySize(): number {
        return this._maxHistorySize;
    }

   /**
     * Provides access to the maximum time to keep actions in history.
     */
    public get maxHistoryTime(): number {
        return this._maxHistoryTime;
    }

    /**
     * Provides access to the datastore used for external storage.
     */
    public get datastore(): any {
        return this._datastore;
    }

    /**
     * Provides access to the list of digests.
     */
    public get digests(): Digest<S>[] {
        return this._digests;
    }

    /**
     * Provides access to the number of actions until a new digest is created.
     */
    public get digestInterval(): number {
        return this._digestInterval;
    }

    /**
     * Provides access to the metadata associated with the store.
     */
    public get metadata(): Record<string, any> {
        return this._metadata;
    }

    /**
     * Creates and initializes an instance of the Store.
     * This static method provides a controlled way to create a new store, ensuring proper initialization of its state and configuration.
     *
     * @param initialState The initial state of the application.
     * @param [maxHistorySize=50] The maximum number of actions to keep in the history. Defaults to 50.
     * @param [maxHistoryTime=86400000] The maximum duration (in milliseconds) to keep actions in the history. Defaults to 24 hours.
     * @param datastore An optional external datastore for saving and retrieving state digests.
     * @param [digestInterval=10] The number of actions until a new digest is created.
     * @param metadata An optional object containing metadata related to the store.
     *
     * @returns An instance of the Store configured with the given initial state and settings.
     */
    public static create<S>(initialState: S, maxHistorySize: number = 50, maxHistoryTime: number = 86400000 /* 24 hours */, datastore?: any, digestInterval: number = 10, metadata?: Record<string, any>): Store<S> {
        if (maxHistorySize <= 0 || maxHistorySize > 100000) {
            throw new Error("maxHistorySize must be between 1 and 100000.");
        }

        if (maxHistoryTime < 3600000 /* 1 hour */ || maxHistoryTime > 604800000 /* 7 days */) {
            throw new Error("maxHistoryTime must be between 1 hour and 7 days.");
        }
        const defaultMetadata = {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development"
        };

        const mergedMetadata = { ...defaultMetadata, ...metadata}

        return new Store<S>(initialState, maxHistorySize, maxHistoryTime, datastore, digestInterval, mergedMetadata);
    }

    /**
     * Adds an action to the store and applies it to the current state.
     *
     * @param action The action to add and apply to the store.
     * @param currentState The current state to which the action will be applied.
     * @param callback An optional callback for handling the history digest externally.
     *
     * @returns A Result if the execution was successful or an Issue if there was a problem.
     */
    public async add(action: Action<any, S, any>, currentState: S, callback?: (digest: string) => Promise<string | undefined>): Promise<Result<S, any, any> | Issue<S, any, any>> {
        try {
            this._history.push(action);
            this.manageHistoryBySize();
            this.manageHistoryByTime();

            const outcome = await this.apply(action, currentState);

            if (outcome && outcome instanceof Result && outcome.success) {
                if (outcome.nextState !== null && outcome.nextState !== undefined) {
                    this._state = { ...this._state, ...outcome.nextState };
                }

                this._actionCounter++;

                if (this._actionCounter >= this._digestInterval) {
                    await this.makeDigest(callback);
                    this._actionCounter = 0;
                }

                this._currentActionIndex = this._history.length - 1;
                if(this.subscriber) {
                    this.subscriber.alert(action, this._state);
                }
            }

            return outcome;
        } catch (error) {
            console.error("Error adding and applying action:", error);

            return error instanceof Issue ? error : Issue.fromAction(action, error as Error);
        }
    };

    /**
     * Reapplies actions up to a specified index in the history.
     *
     * @param index The index in the history up to which actions should be reapplied.
     * @param currentState The current state before rerunning actions.
     * @param callback An optional callback for handling the history digest externally.
     *
     * @returns A Result if the execution was successful or an Issue if there was a problem.
     */
    public async rerun(index: number, currentState: S, callback?: (digest: string) => Promise<string | undefined>): Promise<Result<S, any, any> | Issue<S, any, any>> {
        const __action__ = Action.create<any, S, any>("GENERIC_ERROR_ACTION", [], async (state: S, params: any[]) => {
            throw new Error("Generic error");
        });

        if (index < 0 || index >= this._history.length) {
            return Issue.fromAction(__action__, new Error("Invalid index for rerun."));
        }

        let nextState = currentState;

        try {
            for (let i = 0; i <= index; i++) {
                const action = this._history[i];
                const outcome = await this.apply(action, nextState);

                if (outcome instanceof Result && outcome.nextState !== null) {
                    nextState = outcome.nextState;
                } else if (outcome instanceof Issue) {
                    return outcome;
                }
            }

            this._state = { ...this._state, ...nextState };
            this._currentActionIndex = index;

            this._actionCounter++;

            if (this._actionCounter >= this._digestInterval) {
                await this.makeDigest(callback);
                this._actionCounter = 0;
            }

            return Result.success<S, any, any>(this._history[index], null, currentState, nextState);
        } catch (error) {
            if (error instanceof Issue) {
                return error;
            }

            return Issue.fromAction(__action__, error as Error);
        }
    }

    /**
     * Resets the state to a previous point in the history.
     *
     * @param currentState The current state before resetting.
     * @param callback An optional callback for handling the history digest externally.
     *
     * @returns A Result if the execution was successful or an Issue if there was a problem.
     */
    public async reset(currentState: S, callback?: (digest: string) => Promise<string | undefined>): Promise<Result<S, any, any> | Issue<S, any, any>> {
        const __action__ = Action.create<any, S, any>("GENERIC_ERROR_ACTION", [], async (state: S, params: any[]) => {
            throw new Error("Generic error");
        });

        if (this._currentActionIndex >= 0) {
            try {
                const action = this._history[this._currentActionIndex];
                const outcome = await this.apply(action, currentState);

                if (outcome instanceof Result && outcome.nextState !== null) {
                    this._state = { ...this._state, ...outcome.nextState };
                    this._actionCounter++;

                    if (this._actionCounter >= this._digestInterval) {
                        await this.makeDigest(callback);
                        this._actionCounter = 0;
                    }

                    this._currentActionIndex--;

                    if(this.subscriber) {
                        this.subscriber.alert(action, this._state);
                    }

                    return Result.success<S, any, any>(action, null, currentState, this._state);
                } else if (outcome instanceof Issue) {
                    return outcome;
                }

                return Issue.fromAction(action, new Error("Reset failed: unexpected result type"));
            } catch (error) {
                if (error instanceof Issue) {
                    return error;
                }

                return Issue.fromAction(__action__, error as Error);
            }
        } else {
            return Issue.fromAction(__action__, new Error("No actions to reset."));
        }
    }

    /**
     * Retries or reapplies the next action in the history, if available.
     *
     * @param currentState The current state before retrying the action.
     * @param callback An optional callback for handling the history digest externally.
     *
     * @returns A Result if the execution was successful or an Issue if there was a problem.
     */
    public async retry(currentState: S, callback?: (digest: string) => Promise<string | undefined>): Promise<Result<S, any, any> | Issue<S, any, any>> {
        const __action__ = Action.create<any, S, any>("GENERIC_ERROR_ACTION", [], async (state: S, params: any[]) => {
            throw new Error("Generic error");
        });

        const nextIndex = this._currentActionIndex + 1;

        if (nextIndex < this._history.length) {
            const action = this._history[nextIndex];

            try {
                const outcome = await this.apply(action, currentState);

                if (outcome instanceof Result && outcome.nextState !== null) {
                    this._state = { ...this._state, ...outcome.nextState };
                    this._actionCounter++;

                    if (this._actionCounter >= this._digestInterval) {
                        await this.makeDigest(callback);
                        this._actionCounter = 0;
                    }

                    this._currentActionIndex = nextIndex;

                    return Result.success<S, any, any>(action, null, currentState, this._state);
                } else if (outcome instanceof Issue) {
                    return outcome;
                }

                return Issue.fromAction(action, new Error("Retry failed at action index " + nextIndex));
            } catch (error) {
                if (error instanceof Issue) {
                    return error;
                }

                return Issue.fromAction(__action__, error as Error);
            }
        } else {
            return Issue.fromAction(__action__, new Error("No action available to retry."));
        }
    }

    /**
     * Restores the state of the application from a specified digest.
     * This method allows for reverting the application state to a previously saved point, aiding in scenarios like state recovery or undoing actions.
     *
     * @param digestId The unique identifier of the digest to hydrate from.
     * @param callback An optional callback function to fetch the digest from an external datastore.
     *
     * @returns A Result if the execution was successful or an Issue if there was a problem.
     */
    public async hydrate(digestId: string, callback?: (id: string) => Promise<string | undefined>): Promise<Result<S, any, any> | Issue<S, any, any>> {
        const __action__ = Action.create<any, S, any>("GENERIC_ERROR_ACTION", [], async (state: S, params: any[]) => {
            throw new Error("Generic error");
        });

        try {
            const digest = await this.findDigest(digestId, callback);

            if (!digest) {
                return Issue.fromAction(__action__, new Error("Digest with ID " + digestId + " not found."));
            }

            this._state = { ...this._state, ...digest.state };
            this._history = digest.history;
            this._currentActionIndex = this._history.length - 1;

            this._actionCounter = 0;

            return Result.success<S, any, any>(__action__, null, this._state, this._state);
        } catch (error) {
            console.error(`Hydration failed: ${(error as Error).message}`);

            return Issue.fromAction(__action__, error as Error);
        }
    }

    public subscriber = {
        /**
         * Adds a new subscriber callback that will be notified whenever an action updates the state.
         * Returns true if the subscriber is successfully added. Returns false otherwise.
         *
         * @param callback The callback function to be invoked on state updates.
         *
         * @returns A Boolean indicating whether the subscriber was successfully added.
         */
        add: (callback: (action: Action<any, S, any>, newState: S) => void): boolean => {
            try {
                this._subscribers.push(callback);

                return true;
            } catch (error) {
                console.error("Error adding subscriber:", error);

                return false;
            }
        },

        /**
         * Notifies all subscribed callbacks about a state change.
         * Returns true if notifications are sent successfully. Returns false otherwise.
         *
         * @param action The action that triggered the state change.
         * @param newState The new state resulting from the action.
         *
         * @returns A Boolean indicating whether notifications were successfully sent.
         */
        alert: (action: Action<any, S, any>, newState: S): boolean => {
            try {
                this._subscribers.forEach(callback => callback(action, newState));

                return true;
            } catch (error) {
                console.error("Error notifying subscribers:", error);

                return false;
            }
        },

        /**
         * Adds a new watch subscriber callback that will be notified only when specific actions update the state.
         * This allows for more targeted subscription based on the action type or specific state changes.
         * Returns true if the watch subscriber is successfully added. Returns false otherwise.
         *
         * @param filter A function to determine if the subscriber should be notified for a given action.
         * @param callback The callback function to be invoked for the filtered state changes.
         *
         * @returns A Boolean indicating whether the watch subscriber was successfully added.
         */
        watch: (filter: (action: Action<any, S, any>, newState: S) => boolean, callback: (action: Action<any, S, any>, newState: S) => void): boolean => {
            try {
                const filtered = (action: Action<any, S, any>, newState: S) => {
                    if (filter(action, newState)) {
                        callback(action, newState);
                    }
                };

                this._subscribers.push(filtered);

                return true;
            } catch (error) {
                console.error("Error adding watch subscriber:", error);

                return false;
            }
        },
    }

    public middleware = {
        /**
         * Adds a new middleware function to the store.
         * Middleware functions are invoked before an action is applied, allowing interception or modification of the action.
         * The middleware can include a filter to determine its applicability.
         *
         * @param middleware The middleware function to be added.
         * @param filter Optional filter function to determine when the middleware should be applied.
         *
         * @returns A Boolean indicating whether the middleware was successfully added.
         */
        add: (middleware: (action: Action<any, S, any>) => void, filter?: (action: Action<any, S, any>) => boolean): boolean => {
            try {
                const filtered = filter ? (action: Action<any, S, any>) => { if (filter(action)) middleware(action); } : middleware;

                this._middlewares.push(filtered);

                return true;
            } catch (error) {
                console.error("Error adding middleware:", error);

                return false;
            }
        },

        /**
         * Applies all registered middleware functions to an action.
         * Returns true if the middlewares are successfully applied. Returns false otherwise.
         *
         * @param action The action to be processed by the middleware.
         *
         * @returns A Boolean indicating whether the middlewares were successfully applied.
         */
        apply: (action: Action<any, S, any>): boolean => {
            try {
                this._middlewares.forEach(middleware => middleware(action));

                return true;
            } catch (error) {
                console.error("Error applying middleware:", error);

                return false;
            }
        },
    };

    /**
     * Applies an action to a given state, returning a Result.
     * This method uses the action's exec function to perform the operation and manage state transitions, encapsulating the action's outcome.
     *
     * @param action The action to be applied.
     * @param state The state to which the action will be applied.
     *
     * @returns A promise that resolves to a Result representing the outcome of the action.
     *
     * @throws An Issue if there is a failure in the execution of the action.
     */
    private async apply (action: Action<any, S, any>, state: S): Promise<Result<S, any, any>> {
        try {
            const outcome = await invoke(action, state);

            if (outcome instanceof Issue) {
                throw outcome;
            }

            if (outcome instanceof Result) {
                return outcome;
            }

            throw Issue.fromAction(action, new Error("Unexpected outcome type"));
        } catch (error) {
            if (error instanceof Issue) {
                throw error;
            }

            throw Issue.fromAction(action, error as Error);
        }
    };

    /**
     * Manages the action history by removing actions that are older than the specified time threshold.
     * Returns true if the action history is successfully managed. Returns false otherwise.
     *
     * @returns A Boolean indicating whether the action history was successfully managed.
     *
     * @throws An error when there is a problem managing the history by time.
     */
    private manageHistoryByTime(): boolean {
        try {
            const currentTime = Date.now();

            this._history = this._history.filter(action => {
                const actionAge = currentTime - action.timestamp.getTime();
                return actionAge <= this._maxHistoryTime;
            });

            return true;
        } catch (error) {
            console.error("Error managing history by time:", error);

            throw error;
        }
    }

    /**
     * Manages the action history by ensuring its size does not exceed the maximum history size.
     * Returns true if the action history is successfully managed. Returns false otherwise.
     *
     * @returns A Boolean indicating whether the action history was successfully managed.
     *
     * @throws An error when there is a problem managing the history by size.
     */
    private manageHistoryBySize(): boolean {
        try {
            while (this._history.length > this._maxHistorySize) {
                this._history.shift();
            }

            return true;
        } catch (error) {
            console.error("Error managing history by size:", error);

            throw error;
        }
    }

    /**
     * Creates a digest of the current state and the action history, storing it with a unique identifier.
     * Digests can be used to revert the state to previous points, useful for features like undo/redo or for state auditing purposes.
     *
     * @param callback An optional calback for handling the digest externally.
     *
     * @returns The digest.
     *
     * @throw An Error if there is a problem creating the digest.
     */
    private async makeDigest(callback?: (digest: string) => Promise<string | undefined>): Promise<Digest<S>> {
        const digestId = uuid();
        const digest: Digest<S> = {
            id: digestId,
            timestamp: new Date(),
            state: this._state,
            history: [...this.history]
        };

        try {
            await this.saveDigest(digest, callback);
        } catch (error) {
            console.error("Error in making the digest:", error);

            throw error;
        }

        return digest;
    }

    /**
     * Saves a specific digest to an external datastore, if a callback is provided, or to the local digest history.
     * When a callback is provided, it is used to save the digest to an external datastore.
     * The digest is also saved locally if the callback operation is successful.
     * If no callback is provided, the digest is saved only in the local history.
     *
     * @param digest The digest to save.
     * @param An optional callback for external handling of the digest.
     *
     * @returns The saved digest or undefined, depending on the operation's result.
     *
     * @throws An Error is there is a problem with the callback or the deserialization fails.
     */
    private async saveDigest(digest: Digest<S>, callback?: (digest: string) => Promise<string | undefined>): Promise<Digest<S> | undefined> {
        const serializableDigest = this.makeSerializableDigest(digest);
        const serializedDigest = this.serializeDigest(serializableDigest);

        if (callback) {
            try {
                const str = await callback(serializedDigest);
                if (str) {
                    return JSON.parse(str) as Digest<S>;
                }
            } catch (error) {
                console.error(`Callback processing or deserialization failed: ${(error as Error).message}`);

                throw error;
            }
        } else {
            this._digests.push(serializableDigest);

            return this._digests.find(_digest => _digest.id === digest.id);
        }
    }

    /**
     * Transforms a digest into a serializable format by converting each Action in the history to JSON.
     *
     * @param digest The digest to be made serializable.
     *
     * @returns The serializable version of the digest.
     */
    private makeSerializableDigest(digest: Digest<S>): any {
        return { ...digest, history: digest.history.map(action => action.toJSON()) };
    }

    /**
     * Serializes a digest into a JSON string.
     *
     * @param digest The serializable digest to be serialized.
     *
     * @returns The serialized JSON string of the digest.
     */
    private serializeDigest(digest: Digest<S>): string {
        return JSON.stringify(digest);
    }

    /**
     * Retrieves a specific digest from either the local digest history or an external datastore using its unique identifier.
     * If a callback is provided, it is used to fetch the digest from an external source; otherwise, it is retrieved from the local history.
     *
     * @param id The unique identifier of the digest to retrieve.
     * @param callback An optional callback function to fetch the digest from an external datastore.
     *
     * @returns A promise that resolves to the digest corresponding to the provided identifier, if found.
     *
     * @throws An error if deserialization fails or the digest with the given ID is not found.
     */
    private async findDigest(id: string, callback?: (id: string) => Promise<string | undefined>): Promise<Digest<S> | undefined> {
        try {
            let serializedDigest: string | undefined;

            if (callback) {
                serializedDigest = await callback(id);
            }

            let digest: Digest<S>;

            if (serializedDigest) {
                try {
                    digest = JSON.parse(serializedDigest);
                } catch (error) {
                    console.error(`Deserialization of the fetched digest failed: ${(error as Error).message}`);

                    throw error;
                }
            } else {
                const local = this._digests.find(_digest => _digest.id === id);

                if (!local) {
                    throw new Error(`Digest with ID ${id} not found in local history.`);
                }

                digest = local;
            }

            digest.history = digest.history.map(actionJSON => {
                const action = Action.fromJSON(actionJSON) as Action<any, S, any>;
                const exec = Ledger.get(action.name);

                return action.attach(exec);
            });

            return digest;
        } catch (error) {
            console.error("Error in finding the history digest: ", error);

            throw error;
        }
    }
}
