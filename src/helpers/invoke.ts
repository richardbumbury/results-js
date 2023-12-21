import { Action, Result, Issue } from "../modules";

/**
 * Executes an Action and returns a Result.
 *
 * @template S The type of the state on which the action operates.
 * @template P The type of parameters accepted by the action.
 * @template C The type of content produced by the action.
 *
 * @param action The Action to be executed.
 * @param currentState The current state before executing the action.
 *
 * @returns A promise that resolves to a Result, encapsulating the action's outcome and its effect on the state, or an Issue if it cannot invoke the action.
 */
export async function invoke<S, P, C>(action: Action<P, S, C>, currentState: S): Promise<Result<S, P, C> | Issue<S, P, C>> {
    try {
        const effect = await action.exec(currentState, action.params);

        const newState = effect.transform(currentState);

        return Result.success<S, P, C>(action, effect.content, currentState, newState);
    } catch (error) {
        return Issue.fromAction(action, error instanceof Error ? error : new Error(String(error)));
    }
}
