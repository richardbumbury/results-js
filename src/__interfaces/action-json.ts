/**
 * Represents the JSON structure of an Action object.
 * This interface is used to define the shape of the data returned by the toJSON() method of the Action class.
 * It includes all the serializable properties of an Action instance.
 *
 * @template P The type of parameters the action accepts, reflected in the serialized data.
 */
export interface ActionJSON<P> {
    /**
     * The unique identifier for the action instance.
     */
    id: string;

    /**
     * The optional identifier used to correlate the action with other related actions.
     */
    correlationId?: string;

    /**
     * The name of the action, serving as a unique identifier.
     */
    name: string;

    /**
     * The parameters passed to the action, used in its execution.
     */
    params: P[];

    /**
     * The timestamp when the action was created, in ISO string format.
     */
    timestamp: string;
}
