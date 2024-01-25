import { Action } from "../__core";

/**
 * Represents a digest of the application's state at a specific point in time.
 * This includes the state itself, an identifier for the digest, a timestamp, and a history of actions leading to this state.
 *
 * @template S The type of the state being captured in the digest.
 */
export interface Digest<S> {
    /**
     * A universally unique identifier (UUID) for the digest.
     * This identifier is used to uniquely distinguish this digest from others.
     */
    id: string;

    /**
     * The state of the application at the time the digest was created.
     * This represents the complete state and can be used to restore or analyze the application's condition at this point in time.
     */
    state: S;

    /**
     * The timestamp indicating when the digest was created.
     * This timestamp can be used for ordering digests chronologically or determining the age of the digest.
     */
    timestamp: Date;

    /**
     * A list of actions that have been executed up to the point of this digest.
     * This history is helpful for understanding the sequence of events that led to the current state.
     */
    history: Action<any, S, any>[];
}
