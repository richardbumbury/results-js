import { Effect } from "./effect";

/**
 * Defines the structure and behavior of an executable action within an application.
 *
 * @template P The type of parameters the action accepts.
 * @template S The type of the state the action operates on.
 * @template C The type of the content produced by the action.
 */
export interface Action<P = any, S = any, C = any> {

    /**
     * A unique identifier or name for the action.
     */
    name: string;

    /**
     * The parameters required to execute the action.
     */
    params: P[];

    /**
     * The timestamp marking when the action was created or initialized.
     */
    timestamp: Date;

    /**
     * The logic to be executed by the action, producing an effect on the state.
     *
     * @param currentState The current state before the action is applied.
     * @param params The parameters necessary to execute the action.
     * @returns An Effect object containing the content and state transformation logic.
     */
    exec: (currentState: S, params: P[]) => Effect<S, C> | Promise<Effect<S, C>>;
}
