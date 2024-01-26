/**
 * Represents the JSON structure of an Action object.
 * This interface is used to define the shape of the data returned by the toJSON() method of the Action class.
 * It includes all the serializable properties of an Action instance.
 *
 * @template P The type of parameters the action accepts, reflected in the serialized data.
 */
export interface ActionJSON<P> {
    /**
     * The name of the action, serving as a unique identifier.
     * This property is used to identify the action and is typically set during action creation.
     */
    name: string;

    /**
     * The parameters passed to the action, used in its execution.
     * These parameters are part of the action's definition and are serialized for reference.
     */
    params: P[];

    /**
     * The timestamp indicating when the action was created or initialized.
     * This property helps in tracking the creation time of the action and is useful for logging or auditing purposes.
     */
    timestamp: Date;
}
