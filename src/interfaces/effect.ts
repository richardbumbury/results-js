/**
 * Represents the effect of an action's execution, including its direct outcome and impact on the state.
 *
 * @template S The type of the state affected by the action.
 * @template C The type of the content produced by the action.
 */
export interface Effect<S, C> {

    /**
     * The direct outcome or result produced by the action's execution.
     */
    content: C;

    /**
     * A function describing how the action transforms the state.
     *
     * @param state The current state to be transformed.
     * @returns The new state after applying the transformation.
     */
    transform: (state: S) => S;
}
