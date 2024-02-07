/**
 * Represents the JSON structure of a Result object for serialization and deserialization purposes.
 * This interface defines the shape of the data returned by the toJSON() method of the Result class and expected by the fromJSON() static method, ensuring type safety and consistency in serialization processes.
 *
 * @template S The type of the state affected by the action, reflected in the serialized data.
 * @template P The type of parameters the action accepts, reflected in the serialized data.
 * @template C The type of content produced by the action, reflected in the serialized data.
 */
export interface IResultJSON<S, P, C> {
    /**
     * The unique identifier for the result instance, automatically generated during result creation.
     */
    id: string;

    /**
     * The optional identifier used to correlate the result with other related results and actions.
     */
    correlationId?: string;

    /**
     * Indicates whether the action associated with this result was successful.
     */
    success: boolean;

    /**
     * The content or value produced by the action if it was successful, null otherwise.
     */
    content: C | null;

    /**
     * An array of error objects encountered during the action's execution, if any.
     * Each error object includes a message and optionally a name property.
     */
    errors: { message: string; name?: string }[];

    /**
     * A simplified representation of the action associated with this issue, including its name, parameters, and an optional correlation identifier.
     */
    action: {
        id: string;
        name: string;
        params: P[];
        correlationId?: string;
    };

    /**
     * The state before the action was applied. This is included to provide context for the action's impact.
     */
    prevState: S | null;

    /**
     * The state after the action was applied, representing the new state resulting from the action.
     */
    nextState: S | null;

    /**
     * The timestamp when the result was created, in ISO string format.
     */
    timestamp: string;

    /**
     * The execution time of the action in milliseconds, calculated from the action's start to the result's creation.
     */
    executionTime: number | null;
}
