import { Result, Issue } from "../modules";

/**
 * Represents an action that can be performed on a given state.
 *
 * @template T The type of the state on which the action is performed.
 * @template A The type of the action itself, extending the IAction interface.
 * @template R The type of the result of the action, which can be either a Result or an Issue.
 * @template P The type of parameters the action accepts, defaulting to any type.
 */
export interface IAction<T, A extends IAction<any, any, any>, R extends Result<T, A> | Issue<T>, P = any> {
    /**
     * The name or identifier of the action.
     */
    method: string;

    /**
     * The parameters passed to the action. These are used to influence the action's behavior.
     */
    parameters: P;

    /**
     * The timestamp when the action was created or initialized.
     */
    timestamp: Date;

    /**
     * Executes the action on a given state. This method should encapsulate the primary logic of the action.
     * 
     * @param currentState The current state before the action is applied.
     * 
     * @returns The result of the action, which is either a successful result encapsulated in a `Result` object or an error scenario represented by an `Issue`.
     */
    invoke(currentState: T): R;

    /**
     * Reverts the effects of the action on a given state. This is used for undoing the action.
     * 
     * @param currentState The current state to which the action's effects should be reverted.
     * 
     * @returns The state after undoing the action.
     */
    revert(currentState: T): T;
}
