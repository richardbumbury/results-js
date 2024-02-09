import * as sinon from "sinon";
import { expect } from "chai";
import { IEffect } from "../../../src/interfaces";
import { Store, Action, Result, Issue, Hooks } from "../../../src/core";

describe("Store", () => {
    let warn: any;

    beforeEach(() => {
        warn = sinon.stub(console, "warn");
    });

    afterEach(() => {
        sinon.restore();
    })

    describe("create", function() {
        it("should create a store with the given initial state", function() {
            const state = { count: 0 };
            const store = Store.create(state, "test");

            expect(store.state).to.deep.equal(state);
        });

        it("should set the mode of the store correctly", function() {
            const state = { count: 0 };
            const store = Store.create(state, "test");

            expect(store.mode).to.equal("test");
        });

        it("should merge user-defined metadata with default metadata", function() {
            const state = { count: 0 };
            const metadata = { version: "1.0.0"};
            const store = Store.create(state, "test", metadata);

            expect(store.metadata).to.include(metadata);
            expect(store.metadata).to.have.keys("timestamp", "environment", "version");
            expect(store.metadata.environment).to.equal("test");
            expect(store.metadata.version).to.equal("1.0.0");
        });

        it("should use default values for mode and metadata if not provided", function() {
            const state = { count: 0 };
            const store = Store.create(state);

            expect(store.mode).to.equal("development");
            expect(store.metadata).to.have.keys("timestamp", "environment");
            expect(store.metadata.environment).to.equal("development");
        });
    });

    describe("apply", function() {
        let invoke: any;

        beforeEach(function() {
            invoke = sinon.stub(Hooks, "invoke").resolves();
            sinon.stub(console, "error");
        });

        it("should successfully apply an action and update the state", async function() {
            const store = Store.create({ count: 0 });
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
                return new Promise((resolve, reject) => {
                    if (typeof currentState !== "object" || currentState === null) {
                        reject(new Error("Invalid state: State must be a non-null object"));

                        return;
                    }

                    if (params.some(param => param < 0)) {
                        reject(new Error("Invalid parameters: Negative values are not allowed"));

                        return;
                    }

                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            });

            const result = await store.apply(action);

            if (result instanceof Result) {
                expect(result).to.be.instanceOf(Result);
                expect(result.success).to.be.true;
            }

            expect(store.state).to.deep.equal({ count: 3 });
        });

        it("should return an issue when the exec function throws an error", async function() {
            const store = Store.create({ count: 0 });
            const action = Action.create("TEST_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
                return new Promise((resolve, reject) => {
                    if (typeof currentState !== "object" || currentState === null) {
                        reject(new Error("Invalid state: State must be a non-null object"));

                        return;
                    }

                    if (params.some(param => param < 0)) {
                        reject(new Error("Invalid parameters: Negative values are not allowed"));

                        return;
                    }

                    currentState.count += params.length; // Directly mutates the state

                    resolve({ content: null, transform: (state: any) => state });
                })
            });

            const result = await store.apply(action);

            expect(result).to.be.instanceOf(Issue);
            expect(store.state).to.deep.equal({ count: 0 }); // State should not change due to action invokation failure.
        });

        it("should return an issue when the state is directly mutated in development mode", async function() {
            const store = Store.create({ count: 0 });
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
                return new Promise((resolve, reject) => {
                    if (typeof currentState !== "object" || currentState === null) {
                        reject(new Error("Invalid state: State must be a non-null object"));

                        return;
                    }

                    if (params.some(param => param < 0)) {
                        reject(new Error("Invalid parameters: Negative values are not allowed"));

                        return;
                    }

                    currentState.count += params.length; // Directly mutates the state

                    resolve({ content: null, transform: (state: any) => state });
                })
            });

            const result = await store.apply(action);

            expect(result).to.be.instanceOf(Issue);
            expect(store.state).to.deep.equal({ count: 0 }); // State should not change due to direct mutation
        });

        it("should invoke before-state-change and after-state-change hooks", async function() {
            const store = Store.create({ count: 0 });
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
                return new Promise((resolve, reject) => {
                    if (typeof currentState !== "object" || currentState === null) {
                        reject(new Error("Invalid state: State must be a non-null object"));

                        return;
                    }

                    if (params.some(param => param < 0)) {
                        reject(new Error("Invalid parameters: Negative values are not allowed"));

                        return;
                    }

                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            });

            await store.apply(action);

            sinon.assert.calledWith(invoke, "before-state-change", sinon.match.any);
            sinon.assert.calledWith(invoke, "after-state-change", sinon.match.any);
        });

        it("should invoke after-action-cleanup hook in the finally block", async function() {
            const store = Store.create({ count: 0 });
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
                return new Promise((resolve, reject) => {
                    if (typeof currentState !== "object" || currentState === null) {
                        reject(new Error("Invalid state: State must be a non-null object"));

                        return;
                    }

                    if (params.some(param => param < 0)) {
                        reject(new Error("Invalid parameters: Negative values are not allowed"));

                        return;
                    }

                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            });

            await store.apply(action);

            sinon.assert.calledWith(invoke, "after-action-cleanup", action, sinon.match.any);
        });
    });


    describe("hydrate", function() {
        let store: Store<any>;
        let consoleError: any;

        beforeEach(function() {
            store = Store.create({});
            consoleError = sinon.stub(console, "error");
        });

        it("should successfully hydrate the state", async function() {
            const initialState = JSON.stringify({ count: 10 });
            const beforeHydrateSpy = sinon.spy();
            const afterHydrateSpy = sinon.spy();
            const stateValidationSpy = sinon.spy();

            Hooks.register("before-hydrate", beforeHydrateSpy);
            Hooks.register("after-hydrate", afterHydrateSpy);
            Hooks.register("state-validation", stateValidationSpy);

            const result = await store.hydrate(initialState);

            expect(result).to.be.true;
            expect(store.state).to.deep.equal({ count: 10 });
            expect(beforeHydrateSpy.calledOnceWithExactly(initialState)).to.be.true;
            expect(afterHydrateSpy.calledOnceWithExactly({ count: 10 })).to.be.true;
            expect(stateValidationSpy.calledOnceWithExactly({ count: 10 })).to.be.true;
        });

        it("should return false and log error if JSON parsing fails", async function() {
            const invalidState = "not a valid JSON";
            const result = await store.hydrate(invalidState);

            expect(result).to.be.false;
            sinon.assert.calledWith(consoleError, sinon.match.string, sinon.match.instanceOf(Error));
        });

        it("should handle custom validation failure during hydration", async function() {
            const initialState = JSON.stringify({ count: 10 });
            const validationSpy = sinon.spy(() => { throw new Error("Validation failed"); });

            Hooks.register("state-validation", validationSpy);

            const result = await store.hydrate(initialState);

            expect(result).to.be.false;
            sinon.assert.calledWith(consoleError, "Hydration failed:", sinon.match.instanceOf(Error));
            expect(validationSpy).to.have.been.calledOnceWith(({ count: 10 }))
        });

        it("should invoke cleanup hook regardless of hydration success or failure", async function() {
            const initialState = JSON.stringify({ count: 10 });
            const cleanupSpy = sinon.spy();

            Hooks.register("after-hydration-cleanup", cleanupSpy);

            await store.hydrate(initialState);

            expect(cleanupSpy.calledOnce).to.be.true;

            cleanupSpy.resetHistory();

            await store.hydrate("invalid JSON");

            expect(cleanupSpy.calledOnce).to.be.true;
        });
    });
});
