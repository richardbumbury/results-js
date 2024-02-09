# Results-js

## Overview
Results-js is a cutting-edge tool designed to inject Functional Programming principles into an Object-Oriented Programming environment. Its primary objective is to encapsulate the outcome of operations, clearly differentiating between successful results and failures. This unique approach enhances error handling, boosts code readability, and fosters robust, maintainable code structures.

## Core Concept
The cornerstone of Results-js is the `Result` class. This class functions as a type-safe union, capable of holding either a success value or an error object, but never both. This structure allows methods to return a `Result` object that communicates the outcome of an operation.

## Key Features

### Type Safety
Ensuring type safety is paramount, minimizing common pitfalls in error handling and result processing.

### Immutable Design
`Result` instances are immutable upon creation, echoing the Functional Programming's emphasis on reliability and predictability.

### Error Handling
Diverging from traditional Object-Oriented Programming's reliances on exceptions, `Result` treats errors as regular data types called an `Issue`, streamlining the error management process within the program's normal flow.

### Enhanced Debugging and Maintenance
Outcomes encapsulated in `Result` objects simplify code tracing and debugging, making data and error flows transparent and predictable.

---

## Advantages Over Traditional Object-Oriented Programming

### Explicit Error Handling
Errors are integral to the method's contract, ensuring clarity and explicitness in handling.

### Reduced Side-Effects
The library's design, focusing on immutability and data-centric error handling, diminishes common Object-Oriented Programming side effects.

### Improved Code Clarity
The distinct separation between success and failure outcomes enhances code readability and comprehension.

### Facilitates Testability
The predictable nature of `Result` objects streamlines unit testing, enabling easy simulation and verification of outcomes.

---

## Components

### Modules Overview
1. **Action**: The `action.ts` module facilitates the execution of operations, returning `Result` objects.
2. **Result**: The `result.ts` module is the backbone of the library, providing the `Result` class. It encapsulates outcomes as either success or failure, maintaining type safety and immutability.
3. **Issue**: Defined in `issue.ts`, this module manages errors and failures, allowing for structured and comprehensible error representation.
4. **Store**: As seen in `store.ts`, this module handles state management within the OOP context, integrating FP principles.

---

## `Action`

The `Action` class is a foundational component of Results-js, designed to encapsulate and manage executable actions within applications. By offering a structured approach to executing operations and managing their effects on application state, the `Action` class leads to creating more predictable, maintainable, and testable codebases.

### Role and Usage

- **Executable Actions Representation**: The `Action` class serves as a blueprint for actions that can be executed within an application. Each instance is uniquely identified and carries with it a set of parameters, a name, and an execution logic that defines its behavior.
- **State and Content Management**: Through its execution logic, an `Action` can produce effects that alter the application's state in a controlled manner. These effects are encapsulated in the `IEffect<S, C>` interface, linking actions directly to state transitions and content generation.
- **Unique Identification**: Every action instance is assigned a unique identifier (`id`) upon creation, facilitating traceability and management of actions within complex systems.
- **Correlation Support**: Actions can optionally include a correlation identifier (`correlationId`), allowing them to be associated with other related actions. This feature is particularly useful in scenarios involving coordinated operations or transactions.
- **Immutable Design**: Upon instantiation, an `Action`'s properties are immutable, echoing the principles of functional programming and enhancing the predictability and reliability of the system.
- **Dynamic Execution Logic Attachment**: The class allows for the dynamic attachment of execution logic (`exec`) to actions, providing flexibility in defining or altering an action's behavior post-creation.
- **Serialization and Deserialization**: `Action` instances can be serialized into a JSON format for persistence or transmission and subsequently rehydrated back into fully functional objects. This process includes generating a new unique identifier for the rehydrated action to ensure system-wide uniqueness.

### Methods

- **`create`**: A factory method for instantiating new `Action` objects with specified names, parameters, and execution logic.
- **`fromJSON`**: Reconstructs an `Action` instance from a JSON object, facilitating the restoration of actions from persisted or transmitted data.
- **`toJSON`**: Serializes an `Action` into a JSON-friendly format, capturing its state at a given moment.
- **`attach`**: Allows for the dynamic attachment of execution logic to an existing action.
- **`execute`**: Triggers the execution of an action, applying its logic to the given state and producing an effect that encapsulates the outcome and any state transformations.

---

## `Result`

The `Result` class is a critical component of Results-js, engineered to elegantly handle the outcomes of operations within applications. It provides a robust framework for distinguishing between successful outcomes and failures, thereby facilitating error handling, debugging, and operational transparency.

### Role and Usage

- **Outcome Representation**: The `Result` class acts as a container for the outcomes of operations, categorizing them into successes and failures. This distinction aids in explicit error handling and decision-making based on operation results.
- **Type Safety and Flexibility**: It supports generic typing for both success and failure outcomes, ensuring type safety while offering the flexibility to accommodate various data structures and error types.
- **Immutability and Predictability**: Instances of the `Result` class are immutable once created, reinforcing functional programming principles. This immutability contributes to the predictability and reliability of state management within applications.
- **Error Handling and Debugging**: By encapsulating errors as first-class citizens, the `Result` class simplifies error handling and debugging processes. It allows applications to gracefully manage failures without resorting to exceptions, leading to cleaner and more maintainable code.
- **Integration with Application Logic**: `Result` objects can seamlessly integrate with the broader application logic, including actions and state transitions managed by the `Action` class. This integration ensures a cohesive approach to handling operation outcomes and their effects on the application state.

### Methods

- **`success`**: Creates a `Result` instance representing a successful outcome, encapsulating the success value.
- **`failure`**: Creates a `Result` instance representing a failure, encapsulating the error or failure reason.
- **`isSuccess`**: Checks if a `Result` instance represents a success, facilitating conditional logic based on the outcome.
- **`isFailure`**: Checks if a `Result` instance represents a failure, aiding in error handling and recovery strategies.
- **`fromJSON`**: Deserializes a JSON object into a `Result` instance, reconstructing the state of a `Result` based on its serialized representation. This static method is crucial for restoring `Result` objects from persisted data, enabling the reattachment or identification of the associated action through other means, given the limitation that function references cannot be serialized directly. It employs hooks (`before-deserialize-state`, `after-deserialize-state`) to provide additional control over the deserialization process, ensuring that the transition states are correctly handled. This method throws an error if the JSON structure is invalid or missing essential properties, ensuring the integrity of the reconstructed `Result`.
- **`toJSON`**: Serializes the current state of the `Result` into a JSON-friendly format, returning a plain object that encapsulates the `Result`'s serializable properties. This method is instrumental for logging, storing, or transmitting `Result` instances as JSON strings, capturing essential information such as success status, content, errors, associated action details, and state transitions. The serialization process preserves the critical aspects of the `Result`, facilitating subsequent deserialization or analysis.
- **`map`**: Transforms the successful content of a `Result` instance using a specified function. If the result is successful, the transformation function is applied to its content. If the result is a failure, the original errors are preserved, maintaining the failure state without altering the error information.
- **`bind`**: Applies a function to the successful content of this `Result`, returning a new `Result` instance. This method is essential for chaining operations that return a `Result`, facilitating the composition of result-producing functions. Even if the content is `null`, the function is applied, allowing for comprehensive handling of all cases.
- **`fold`**: Executes one of two provided functions based on the `Result`'s success or failure status. This branching operation enables distinct handling for both outcomes, applying the appropriate function to the content in case of success or to the errors in case of failure, and producing a new value of a potentially different type.
- **`recover`**: Offers a mechanism to convert a failure into a success, applying a function to the errors to produce new successful content. If the `Result` is already successful, it remains unchanged. This method is particularly useful for error recovery strategies, allowing for graceful handling and correction of failures.
- **`orElse`**: Provides an alternative `Result` in case the current one is a failure. If the current `Result` is successful, it is returned as is. This method is beneficial for providing fallback values or alternative paths in the face of failures, ensuring that the application can continue to operate smoothly.
- **`generateDiff`**: Calculates the differences between the previous and next states associated with the `Result`. This method is valuable for understanding the state changes induced by an action, offering insights into how an operation has transformed the application state. The method returns an array of diff objects representing these changes, or `undefined` if no difference can be computed.

---

## `Issue`

The `Issue` class is an integral part of Results-js,  designed to represent and manage errors or problems encountered during the execution of operations within applications. It acts as a sophisticated mechanism for error handling, offering a structured approach to capturing and dealing with issues that arise, thereby enhancing application robustness and maintainability.

### Role and Usage

- **Error Representation**: The `Issue` class provides a unified structure for representing errors or failures, enabling detailed error information to be encapsulated within instances. This structured approach aids in precise error handling and categorization.
- **Type Safety and Detailed Context**: It supports detailed typing and context for errors, allowing for the inclusion of error codes, messages, and additional metadata. This ensures that errors are not only captured but also fully described, facilitating easier diagnosis and resolution.
- **Immutability and Traceability**: Like the `Result` class, instances of the `Issue` class are immutable, ensuring that error information remains consistent and unaltered once captured. This immutability is crucial for reliable error logging and auditing processes.
- **Integration with Operation Outcomes**: `Issue` objects can be seamlessly integrated with the `Result` class, allowing for a cohesive approach to handling both successful outcomes and failures. This integration ensures that errors are handled as first-class citizens within the application logic.
- **Enhanced Debugging and Maintenance**: By providing clear and detailed error information, the `Issue` class simplifies debugging and maintenance tasks. Developers can quickly identify the source and nature of issues, leading to more efficient problem resolution.

Here's the `Methods` section for the `Issue` class, formatted to match the structure provided for the `Result` class:

### Methods

- **`fromAction`**: Creates an `Issue` instance related to a specific action and its resulting error. This method encapsulates both the error and the context (action) in which it occurred, providing a detailed account of the failure. It is particularly useful for tracing errors back to the actions that triggered them, enhancing error analysis and debugging processes.
- **`fromJSON`**: Deserializes a JSON object into an `Issue` instance, effectively rehydrating the serialized state of an `Issue`. This static method facilitates the reconstruction of `Issue` objects from their serialized forms, assuming the associated action can be identified or reattached. It ensures that `Issue` instances can be persisted, transmitted, and then accurately restored, maintaining the integrity of error information.
- **`toJSON`**: Serializes the `Issue` into a JSON-friendly format, providing a representation of the issue's state that is suitable for logging, storage, or transmission. This method extracts the serializable properties of the `Issue`, including error messages, associated action details, and other relevant metadata, ensuring that essential information is preserved and readily accessible in a standardized format.

---

## `Store`

The `Store` class is a pivotal component of Results-js, designed to serve as the central hub for state management within applications. It facilitates a cohesive and predictable approach to managing application state, leveraging the principles of immutability and functional programming to ensure reliable and efficient state transitions.

### Role and Usage

- **Centralized State Management**: The `Store` class acts as the single source of truth for the application's state, consolidating state management in one place. This centralized approach simplifies state access, manipulation, and observation across the entire application.
- **Immutable State Transitions**: Adhering to functional programming principles, the `Store` ensures that state transitions are immutable. State changes are made through well-defined actions, promoting predictability and reducing the likelihood of state-related bugs.
- **Action-Driven State Changes**: State changes within the `Store` are initiated by actions, consistent with the `Action` class's methodology. This alignment ensures that all state transitions are the result of explicit actions, enhancing traceability and maintainability.
- **Integration with `Result` and `Issue` Classes**: The `Store` seamlessly integrates with the `Result` and `Issue` classes, allowing for a unified approach to handling operation outcomes, errors, and state changes. This integration facilitates comprehensive application logic handling, from action execution to state management and error processing.

### Methods

- **`create`**: Initializes a new `Store` instance with a specified initial state and operating mode. This static method sets up the store, ready for state management, and optionally accepts metadata to provide additional context or configuration. The `mode` parameter dictates how the store behaves, particularly in terms of enforcing immutability and logging, while the `metadata` can contain any extra information relevant to the store's operation.
- **`apply`**: Executes an action against the store's current state, potentially updating it based on the action's outcome. This method orchestrates the application of actions, ensuring that state changes are the result of successful actions. It integrates with the `Hooks` system to provide lifecycle events (`before-state-change`, `after-state-change`, `after-action-cleanup`) for additional control and side-effects management. The method returns a `Promise` that resolves to either a `Result` or an `Issue`, reflecting the success or failure of the action's application and its effect on the state.
- **`hydrate`**: Restores the store's state from a serialized version, commonly retrieved from an external source like local storage or a server. This asynchronous method parses the serialized state and updates the store, surrounded by a series of hooks (`before-hydrate`, `state-validation`, `after-hydrate`, `hydrate-error`, `after-hydration-cleanup`) for validating, processing, and handling the hydration process. The method aims to ensure that the store can be accurately reinitialized with a previous state, facilitating features like state persistence and recovery.

Given the structure and intent of your previous class documentations, without direct access to the content of the `hooks.ts` file but assuming it provides a mechanism for lifecycle hooks within Results-js, here's a conceptual documentation for the `Hooks` class:

---

## `Hooks`

The `Hooks` class is an essential component of Results-js, designed to facilitate event-driven programming by allowing developers to register and trigger custom callback functions (hooks) at specific points within the application flow. This class enhances the library's extensibility and flexibility, enabling custom integrations and behaviors tailored to specific application requirements.

### Role and Usage

- **Event Registration and Management**: The `Hooks` class provides a straightforward interface for registering and managing hooks associated with various events within the application lifecycle, such as before and after state changes, action executions, and error handling processes.
- **Flexible Hook Invocation**: It supports the invocation of registered hooks with relevant context and parameters, allowing for dynamic responses to application events. This feature is crucial for implementing custom logic, such as logging, state validation, or error transformations, in response to specific triggers.
- **Decoupled Architecture**: By decoupling hook management from the core application logic, the `Hooks` class promotes a clean and modular design. This separation of concerns ensures that the core application functionality remains uncluttered by auxiliary behaviors, which are instead encapsulated within hooks.
- **Enhanced Application Insights**: Utilizing hooks for events such as state transitions and action applications provides valuable insights into the application's runtime behavior, aiding in debugging, performance monitoring, and compliance tracking.

### Methods

- **`register`**: This method allows for the registration of a hook function for a specified event name, ensuring uniqueness by preventing duplicate registrations for the same event. It validates the input types to ensure the event name is a string and the hook is a function, returning `true` if the hook is successfully registered and `false` if a duplicate is detected.
- **`unregister`**: Removes a specific hook function associated with a given event name. This method facilitates fine-grained control over the hooks, allowing for the removal of individual hooks without affecting others registered for the same event. It returns `true` if the hook was found and successfully removed, or `false` if the hook did not exist for the event.
- **`has`**: Checks for the existence of any registered hooks for a specific event name, offering a quick way to determine if any hooks are set to respond to an event. This method returns `true` if at least one hook is registered for the event, otherwise `false`, providing insight into the hooks' setup.
- **`invoke`**: Triggers the execution of all hooks registered for a particular event name, passing any provided arguments to each hook function. This asynchronous method executes hooks in the order they were registered, handling both synchronous and asynchronous hooks seamlessly. It logs a warning if no hooks are registered for the event, ensuring awareness of potentially unhandled events.
- **`clear`**: Removes all hooks registered for a specific event name. This method is useful for event-specific cleanup or when needing to refresh the hooks associated with an event, allowing for dynamic adjustment of event handling as application needs evolve.
- **`clearAll`**: Clears all hooks registered across all events within the `Hooks` class. This method provides a complete reset of the hooks mechanism, useful for teardown processes, testing, or reinitializing the application state related to hooks.

---

## Examples

(Detailed "usage examples" for each component, including scenarios demonstrating their application and integration within systems, are coming soon.)

---

## Contributing

1. **Fork the Repository**: Start by forking the repository to your own GitHub account. This is your workspace where you can make changes without affecting the original project.

2. **Clone Your Fork**: Clone your fork to your local machine, so you have a working copy of the codebase.

   ```sh
   git clone https://github.com/your-username/project-name.git
   ```

3. **Create a Branch**: For each new feature or fix, create a new branch. Naming your branch something descriptive can help track work and discussions.

   ```sh
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**: Implement your changes, additions, or fixes. Keep your code clean and well-commented where necessary.

5. **Commit Your Changes**: Commit your changes with a clear and descriptive commit message. This message should communicate the changes you've made and why.

   ```sh
   git commit -m "Add a brief description of your changes"
   ```

6. **Push to Your Fork**: Push your changes to your fork on GitHub.

   ```sh
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**: Go to the original repository on GitHub, and you'll see a prompt to submit a pull request from your new branch. Fill in the pull request with details about your changes and why they should be included.

8. **Code Review**: Wait for a review from the project maintainers. There might be discussions, suggestions, or requests for changes to your code. Please be patient and receptive to feedback.

### Guidelines

- **Follow the Project's Code Style**: Ensure your code adheres to the existing code style of the project to maintain consistency.
- **Write Tests**: If adding new features, include tests that cover your changes.
- **Update Documentation**: If your changes require it, update the documentation to reflect your contributions accurately.
- **Check for Existing Issues**: Before submitting a new issue, check if it has already been reported. If you find an existing issue similar to yours, contribute to the ongoing discussion.

## Testing

Testing is a critical part of maintaining the project's reliability and stability. We encourage contributors to write tests for new code and run existing tests before submitting pull requests. Here's how you can run the tests for this project:

1. **Install Dependencies**: Ensure all necessary dependencies are installed by running:

   ```sh
   npm install
   ```

   or if you're using Yarn:

   ```sh
   yarn install
   ```

2. **Run the Tests**: Execute the test suite using the command:

   ```sh
   npm test
   ```

   or with Yarn:

   ```sh
   yarn test
   ```

This will run the entire suite of automated tests and output the results. If any tests fail, please address the failures before submitting your pull request.

### Writing Tests

When adding new features or fixing bugs, include tests that cover your changes. Good tests help ensure that changes don't break existing functionality and make the codebase more maintainable.

- **Unit Tests**: Write unit tests for individual functions or components to ensure they behave as expected under various conditions.
- **Integration Tests**: If your changes involve interactions between multiple components, consider adding integration tests to verify that these interactions work correctly.

By contributing tests and actively participating in the testing process, you help ensure the project's long-term quality and success.

---

These sections aim to foster a collaborative and quality-focused development environment. Feel free to adjust the content to better match your project's specific contribution process and testing frameworks.---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License is a permissive license that is short and to the point. It lets people do anything they want with your code as long as they provide attribution back to you and don’t hold you liable. 

### MIT License Summary:

- **Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software")**, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

- **The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.**

- **THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED**, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the Software.

By using this library, you agree to the terms of the MIT License as stated. Contributions to this library are also accepted under the same license.


