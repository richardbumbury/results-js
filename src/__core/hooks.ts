/**
 * Manages hooks for event-driven interactions within the application.
 * Allows components to register and respond to events with callback functions, supporting a decoupled architecture.
 */
export class Hooks {
    /**
     * Stores registered hooks and their callbacks.
     * Keys are hook names, and values are arrays of callbacks that execute in response to the respective hook's activation.
     */
    private static hooks: Map<string, Function[]> = new Map();

    /**
     * Registers a hook for a specific event name, ensuring no duplicate hooks for the same event.
     *
     * @param e The name of the event for which to register the hook.
     * @param f The hook function to be called when the event is triggered.
     *
     * @returns True if the hook was successfully registered; false if the hook was already registered for the event.
     *
     * @throws An error if the event is not a string or the function is not a function.
     */
    public static register(e: string, f: Function): boolean {
        if (typeof e !== 'string' || typeof f !== 'function') {
            throw new Error("Invalid input types for register method.");
        }

        if (!this.hooks.has(e)) {
            this.hooks.set(e, [f]);

            return true;
        }

        const hooks = this.hooks.get(e)!;
        if (hooks.some(hook => hook === f)) {

            return false;
        }

        hooks.push(f);

        return true;
    }

    /**
     * Removes a specific hook for a specific event name.
     *
     * @param e The name of the event.
     * @param f The specific hook function to remove.
     *
     * @returns True if the hook was found and removed; false if the hook was not found for the given event.
     *
     * @throws An error if the event is not a string or the function is not a function.
     */
    public static unregister(e: string, f: Function): boolean {
        if (typeof e !== 'string' || typeof f !== 'function') {
            throw new Error("Invalid input types for unregister method.");
        }

        const registered = this.hooks.get(e);

        if (registered) {
            const index = registered.findIndex(hook => hook === f);

            if (index > -1) {
                registered.splice(index, 1);

                if (registered.length === 0) {
                    this.hooks.delete(e);
                }

                return true;
            }
        }

        return false;
    }

    /**
     * Checks whether a hook is registered for a specific event.
     *
     * @param e The name of the event to check.
     *
     * @returns True if there is at least one hook registered for the event; false otherwise.
     *
     * @throws An error if the event is not a string.
     */
    public static has(e: string): boolean {
        if (typeof e !== 'string') {
            throw new Error("Invalid input type for has method.");
        }

        return this.hooks.has(e);
    }

    /**
     * Invokes all registered hooks for a specific event name, in the order they were registered.
     * This method is now asynchronous and waits for all asynchronous hooks to complete.
     *
     * @param e The name of the event to trigger hooks for.
     * @param args Arguments to pass to each hook function.
     */
    public static async invoke(e: string, ...args: any[]): Promise<void> {
        const registered = Hooks.hooks.get(e);

        if (registered) {
            // Map each hook function to a promise and resolve it immediately if it's not asynchronous
            const promises = registered.map(f => {
                try {
                    return Promise.resolve(f(...args));
                } catch (error) {
                    console.error(`Error executing hook for event '${e}':`, error);

                    return Promise.reject(error);
                }
            });

            // Wait for all hooks to complete
            await Promise.all(promises);
        }
    }

    /**
     * Removes all hooks for a specific event name.
     * This can be useful for cleanup or when dynamically changing the hooks that are registered.
     *
     * @param e The name of the event to clear hooks for.
     */
    public static clear(e: string): void {
        Hooks.hooks.delete(e);
    }

    /**
     * Clears all registered hooks.
     */
    public static clearAll(): void {
        Hooks.hooks.clear();
    }
}
