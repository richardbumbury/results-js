import { IResultJSON } from "./result-json";

/**
 * Represents the JSON structure of an Issue object for serialization and deserialization purposes.
 * This interface defines the shape of the data returned by the toJSON() method of the Issue class and expected by the fromJSON() static method, ensuring type safety and consistency in serialization processes.
 *
 * @template S The type of the state affected by the action, reflected in the serialized data.
 * @template P The type of parameters the action accepts, reflected in the serialized data.
 * @template C The type of content produced by the action, reflected in the serialized data.
 */
export interface IIssueJSON<S, P, C> {
    /**
     * The unique identifier for the issue instance, automatically generated during issue creation.
     */
    id: string;

    /**
     * The optional identifier used to correlate this issue with other related issues and actions.
     */
    correlationId?: string;

    /**
     * The name of the issue, typically reflecting the type of error encountered.
     */
    name: string;

    /**
     * The error message providing details about the issue.
     */
    message: string;

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
     * A serialized representation of the result associated with this issue, if applicable.
     */
    result: IResultJSON<S, P, C> | null;

    /**
     * The timestamp when the result was created, in ISO string format.
     */
    timestamp: string;

    /**
     * The execution time of the action in milliseconds, calculated from the action's start to the issue's creation.
     */
    executionTime: number | null;
}
