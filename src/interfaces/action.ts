/**
 * This interface represents an executable action within an application.
 * It encapsulates the logic and necessary data to perform a specific operation.
 *
 * @template P The parameters used for the action's execution.
 * @template R The response produced by executing the action.
 */
export interface IAction<P = any, R = any> {
    /**
     * The name of the action.
     */
    name: string;

    /**
     * The parameters passed to the action.
     */
    params: P[];

    /**
     * The function encapsulating the operation the action will execute.
     *
     * @param params The parameters necessary for executing the action.
     *
     * @returns Returns a result of type R, as defined by the action's logic
     */
    exec: (params: P[]) => R;

    /**
     * The timestamp when the action was created or initialized.
     */
    timestamp: Date;
}
