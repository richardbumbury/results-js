import sinon from "sinon";
import { expect } from "chai";
import { Effect } from "../../src/interfaces";
import { Store, Action, Result, Issue } from "../../src/modules";

describe("Store", () => {
    describe("create", () => {
        it("should create a Store instance with valid parameters", () => {
            const store = Store.create({ value: 0 }, 50, 86400000, {}, 10, { customData: "test" });
            expect(store).to.be.an.instanceof(Store);
        });

        it("should create a Store instance with default parameters", () => {
            const store = Store.create({ value: 0 });
            expect(store).to.be.an.instanceof(Store);
        });

        it("should throw an error for invalid params", () => {
            const state = { value: 0 };

            expect(() => Store.create(state, 0)).to.throw(Error);
            expect(() => Store.create(state, -1)).to.throw(Error);
            expect(() => Store.create(state, 100001)).to.throw(Error);
            expect(() => Store.create(state, 50, 3599999)).to.throw(Error);
            expect(() => Store.create(state, 50, 604800001)).to.throw(Error);
        });
    });

    describe("add", () => {
        it("should add and apply an action successfully", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);

            const result = await store.add(action, state, callback);
            expect(result).to.be.instanceOf(Result);

            if (result instanceof Result) {
                expect(result.success).to.be.true;
            } else {
                throw new Error("Result is not an instance of Result");
            }
        });


        it("should create a new digest after reaching the digest interval", async () => {
            const state = { value: 0 };
            const store = Store.create(state, 50, 86400000, undefined, 1);
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = sinon.spy();

            await store.add(action, state, callback);
            expect(callback).to.have.been.called;
        });

        it("should handle action application failure", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);
            const original = console.error;

            console.error = () => {};

            const result = await store.add(action, state, callback);

            console.error = original;

            expect(result).to.be.instanceOf(Issue);
        });

        it("should update the store state with the outcome of the action", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const params = [1, 2, 3];
            const action = Action.create("TEST_ACTION", params, async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);
            const nextState = { ...state, count: params.length };

            await store.add(action, state, callback);

            expect(store.state).to.deep.equal(nextState);
        });
    });

    describe("rerun", () => {
        it("should successfully rerun an action", async () => {
            const index = 0;
            const state = { value: 0 };
            const store = Store.create(state);
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);

            await store.add(action, state, callback);

            const result = await store.rerun(index, state, callback);

            expect(result).to.be.instanceOf(Result);
        });

        it("should create a new digest after reaching the digest interval", async () => {
            const index = 1;
            const state = { value: 0 };
            const store = Store.create(state, 50, 86400000, undefined, 1);
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = sinon.spy();

            await store.add(action, state, callback);
            await store.rerun(index, state, callback);

            expect(callback).to.have.been.calledOnce;
        });

        it("should handle action rerun failure", async () => {
            const index = 1;
            const state = { value: 0 };
            const store = Store.create(state);
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            const callback = () => Promise.resolve(undefined);

            await store.add(action, state);

            const result = await store.rerun(index, state, callback);

            expect(result).to.be.instanceOf(Issue);
        });

        it("should maintain state consistency after rerun", async () => {
            const index = 1;
            const state = { value: 0 };
            const store = Store.create(state);
            const params = [1, 2, 3];
            const action = Action.create("TEST_ACTION", params, async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);

            await store.add(action, state, callback);
            await store.rerun(index, state, callback);

            const nextState = { ...state, count: params.length };

            expect(store.state).to.deep.equal(nextState);
        });
    });

    describe("reset", () => {
        it("should successfully reset to previous state", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);

            await store.add(action, state, callback);

            const result = await store.reset(state, callback);

            expect(result).to.be.instanceOf(Result);
        });

        it("should create a new digest after reaching the digest interval", async () => {
            const state = { value: 0 };
            const store = Store.create(state, 50, 86400000, undefined, 1);
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = sinon.spy();

            await store.add(action, state, callback);
            await store.reset(state, callback);

            expect(callback).to.have.been.calledTwice;
        });

        it("should return an Issue if there are no actions to reset", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const callback = () => Promise.resolve(undefined);
            const result = await store.reset(state, callback);

            expect(result).to.be.instanceOf(Issue);
        });

        it("should handle action rerun failure", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);
            const original = console.error;

            console.error = () => {};

            await store.add(action, state, callback);

            console.error = original;

            const result = await store.reset(state, callback);

            expect(result).to.be.instanceOf(Issue);
        });
    });

    describe("retry", () => {
        it("should successfully retry the next action", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const success = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const failure = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);

            await store.add(success, state, callback);

            const original = console.error;

            console.error = () => {};

            await store.add(failure, state, callback);

            console.error = original;

            const result = await store.retry(state, callback);

            expect(result).to.be.instanceOf(Issue);
        });

        it("should create a new digest after reaching the digest interval", async () => {
            const state = { value: 0 };
            const store = Store.create(state, 50, 86400000, undefined, 1);
            const success = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const failure = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = sinon.spy();

            await store.add(success, state, callback);

            const original = console.error;

            console.error = () => {};

            await store.add(failure, state, callback);

            console.error = original;

            await store.retry(state, callback);

            expect(callback).to.have.been.calledOnce;
        });

        it("should return an Issue if there are no actions to retry", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const callback = () => Promise.resolve(undefined);
            const result = await store.retry(state, callback);

            expect(result).to.be.instanceOf(Issue);
        });

        it("should handle action retry failure", async () => {
            const state = { value: 0 };
            const store = Store.create(state);
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = () => Promise.resolve(undefined);

            const original = console.error;

            console.error = () => {};

            await store.add(action, state, callback);

            console.error = original;

            const result = await store.retry(state, callback);

            expect(result).to.be.instanceOf(Issue);
        });
    });

    describe("hydrate", () => {
        it("should successfully hydrate the state with the given digest", async () => {
            const store = Store.create({ value: 0 });
            const digestId = "a14a4a6d-7f7c-405c-aada-22aac93d902b";
            const callback = sinon.stub().resolves(JSON.stringify({ state: { value: 10 }, history: [] }));

            const result = await store.hydrate(digestId, callback);

            expect(callback).to.have.been.calledWith(digestId);
            expect(result).to.be.instanceOf(Result);
            expect(store.state).to.deep.equal({ value: 10 });
            expect(store.history).to.deep.equal([]);
        });

        it("should return an Issue if the digest is not found", async () => {
            const store = Store.create({ value: 0 });
            const digestId = "022b0141-4fa8-489a-845a-e5e90e821bbc";
            const callback = sinon.stub().resolves(null);

            const original = console.error;

            console.error = () => {};

            const result = await store.hydrate(digestId, callback);

            console.error = original;

            expect(result).to.be.instanceOf(Issue);
        });

        it("should handle store hydration errors", async () => {
            const store = Store.create({ value: 0 });
            const digestId = "996fc8db-9b0c-4e51-bc54-4dbb5bf906d5";
            const callback = sinon.stub().rejects(new Error("Error fetching digest"));

            const original = console.error;

            console.error = () => {};

            const result = await store.hydrate(digestId, callback);

            console.error = original;

            expect(result).to.be.instanceOf(Issue);
        });
    });

    describe("subscriber.add", () => {
        it("should successfully add a subscriber", () => {
            const store = Store.create({ value: 0 });
            const callback = () => {};
            const result = store.subscriber.add(callback);

            expect(result).to.be.true;
        });
    });

    describe("subscriber.alert", () => {
        it("should notify all subscribers on state update", () => {
            const store = Store.create({ value: 0 });
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const callback = sinon.spy();

            store.subscriber.add(callback);

            const nextState = { value: 1 }
            const result = store.subscriber.alert(action, nextState);

            expect(callback).to.have.been.calledWith(action, nextState);
            expect(result).to.be.true;
        });

        it("should handle failure when notifying subscribers", () => {
            const store = Store.create({ value: 0 });
            const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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


            store.subscriber.add(() => { throw new Error("Error in callback"); });

            const original = console.error;

            console.error = () => {};

            const result = store.subscriber.alert(action, { value: 1 });

            console.error = original;

            expect(result).to.be.false;
        });
    });

    describe('Store.subscriber.watch', () => {
        it('should successfully add a watch subscriber and notify it on matching action', () => {
            const store = Store.create({ value: 0 });
            const callbank = sinon.spy();
            const filter = (action: any, newState: any) => action.name === "TEST_ACTION";

            const result = store.subscriber.watch(filter, callbank);
            expect(result).to.be.true;

            const success = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            const failure = Action.create("FAIL_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

            store.subscriber.alert(success, { value: 1 });
            store.subscriber.alert(failure, { value: 2 });

            expect(callbank).to.have.been.calledOnceWith(success, { value: 1 });
            expect(callbank).not.to.have.been.calledWith(failure, { value: 2 });
        });
    });

    describe('Store.middleware.add', () => {
        it('should successfully add a middleware', () => {
            const store = Store.create({ value: 0 });
            const middleware = sinon.spy();
            const result = store.middleware.add(middleware);

            expect(result).to.be.true;
        });

        it('should successfully add a middleware with a filter', () => {
            const store = Store.create({ value: 0 });
            const middleware = sinon.spy();
            const filter = (action: any) => action.name === 'TEST_ACTION';
            const result = store.middleware.add(middleware, filter);

            expect(result).to.be.true;
        });

        describe('Store.middleware.apply', () => {
            it('should apply all registered middlewares to an action', () => {
                const store = Store.create({ value: 0 });
                const middlewareFunction = sinon.spy();
                store.middleware.add(middlewareFunction);

                const action = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

                const result = store.middleware.apply(action);

                expect(middlewareFunction).to.have.been.calledWith(action);
                expect(result).to.be.true;
            });

            it('should only apply middlewares that match the filter', () => {
                const store = Store.create({ value: 0 });
                const middlewareFunction = sinon.spy();
                const filterFunction = (action: any) => action.name === 'TEST_ACTION';
                store.middleware.add(middlewareFunction, filterFunction);

                const success = Action.create("TEST_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

                const failure = Action.create("FAIL_ACTION", [1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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

                store.middleware.apply(success);
                store.middleware.apply(failure);

                expect(middlewareFunction).to.have.been.calledOnceWith(success);
                expect(middlewareFunction).not.to.have.been.calledWith(failure);
            });
        });
    });
});
