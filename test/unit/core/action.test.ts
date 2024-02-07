import * as sinon from "sinon";
import { expect } from "chai";
import { Effect } from "../../../src/interfaces";
import { Action, Ledger } from "../../../src/core";

describe("Action", () => {
    describe("create", () => {
        it("should create an Action instance with the correct properties", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            };

            const action = Action.create(name, params, exec);

            expect(typeof action.id).to.equal("string")
            expect(action.correlationId).to.be.undefined; // because we don't set a correlation ID
            expect(action.name).to.equal(name);
            expect(action.params).to.deep.equal(params);
            expect(action.execute).to.be.a("function");
            expect(action.timestamp).to.be.instanceOf(Date);
        });
    });

    describe("fromJSON", () => {
        let warn: sinon.SinonStub;

        beforeEach(() => {
            Ledger["registry"].clear();
            warn = sinon.stub(console, "warn");
        });

        afterEach(() => {
            warn.restore();
        });

        it("should reattach an exec function from the Ledger if available", async () => {
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise((resolve, reject) => {
                    if (typeof currentState !== 'object' || currentState === null) {
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
            };

            const json = {
                id: "12345",
                correlationId: "12345",
                name: "TEST_ACTION",
                params: [1, 2, 3]
            };

            Ledger.set(json.id, exec);

            const action = Action.fromJSON(json);
            const result = await action.execute({});

            expect(result.content).to.equal(3);
            expect(result.transform({})).to.deep.equal({ count: 3 });
        });

        it("should warn and use a default exec function if the exec is not found in the Ledger", async () => {
            const json = {
                id: "67890",
                correlationId: "67890",
                name: "UNREGISTERED_ACTION",
                params: [4, 5, 6]
            };

            const action = Action.fromJSON(json);
            await expect(action.execute({ value: 0 })).to.eventually.be.rejected;

            expect(warn.called).to.be.true;
        });

        it("should handle errors during exec function reattachment", () => {
            const json = {
                id: "12345",
                correlationId: "12345",
                name: "ERROR_ACTION",
                params: []
            };

            const error = sinon.spy(console, "error");

            try {
                Action.fromJSON(json);
            } catch (e) {
                expect(error.called).to.be.true;
            }

            error.restore();
        });

        it("should create an Action instance with the correct name and params from JSON", () => {
            const json = {
                id: "12345",
                correlationId: "12345",
                name: "TEST_ACTION",
                params: [1, 2, 3]
            };

            const action = Action.fromJSON(json);

            expect(typeof action.id).to.equal("string")
            expect(action.name).to.equal(json.name);
            expect(action.params).to.deep.equal(json.params);
            expect(action.timestamp).to.be.instanceOf(Date);
        });

        it("should create an Action instance with a default exec function", async () => {
            const json = {
                id: "12345",
                correlationId: "12345",
                name: "TEST_ACTION",
                params: [1, 2, 3]
            };

            const action = Action.fromJSON(json);

            await expect(action.execute({ value: 0 })).to.eventually.be.rejected;
        });
    });

    describe("toJSON", () => {
        let set: sinon.SinonStub;

        beforeEach(() => {
            set = sinon.stub(Ledger, "set");
        });

        afterEach(() => {
            sinon.restore();
        });

        it("should correctly serialize an action's properties to a JSON object", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            };

            const action = Action.create(name, params, exec);

            const json = action.toJSON();

            expect(json).to.be.an("object");
            expect(json).to.include.keys("id", "correlationId", "name", "params", "timestamp");
            expect(json.id).to.equal(action.id);
            expect(json.correlationId).to.equal(action.correlationId);
            expect(json.name).to.equal(action.name);
            expect(json.params).to.deep.equal(action.params);
            expect(json).to.have.property("timestamp").that.is.a("string");
        });

        it("should not include the exec function in the serialized JSON", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            };

            const action = Action.create(name, params, exec);
            const json = action.toJSON();

            expect(json).to.be.an("object");
            expect(json).to.include.keys("id", "correlationId", "name", "params", "timestamp");
            expect(json.id).to.equal(action.id);
            expect(json.correlationId).to.equal(action.correlationId);
            expect(json.name).to.equal(action.name);
            expect(json.params).to.deep.equal(action.params);
            expect(json).to.have.property("timestamp").that.is.a("string");
            expect(json).to.not.have.property("exec");
        });

        it("should register exec function in Ledger during action creation", async () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            };

            const action = Action.create(name, params, exec);

            expect(set.calledOnce).to.be.true;
            expect(set.calledWith(sinon.match.string, sinon.match.func)).to.be.true;
        });

        it("should allow the serialized JSON to be stringified", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            };

            const action = Action.create(name, params, exec);
            const json = action.toJSON();

            expect(() => JSON.stringify(json)).to.not.throw();
        });
    });

    describe("toString", function () {
        it("should return the correct string representation for an action", function () {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            };

            const action = Action.create(name, params, exec);

            expect(action.toString()).to.include(action.name);
        });
    });

    describe("attach", () => {
        it("should replace an existing exec function with a new one", async () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec_1 = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            };

            const exec_2 = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise((resolve, reject) => {
                    if (typeof currentState !== "object" || currentState === null) {
                        reject(new Error("Invalid state: State must be a non-null object"));

                        return;
                    }

                    if (params.some(param => param < 0)) {
                        reject(new Error("Invalid parameters: Negative values are not allowed"));

                        return;
                    }

                    const content = params.length + 1;
                    const transform = (state: any) => ({ ...state, updated: true });

                    resolve({ content, transform });
                })
            };

            const action = Action.create(name, params, exec_1);

            action.attach(exec_2)

            const result = await action.execute({});

            expect(result.content).to.equal(params.length + 1);
            expect(result.transform({})).to.deep.equal({ updated: true });
        });
    });

    describe("execute", () => {
        it("should execute the action with the attached exec function", async () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
                    const transform = (state: any) => ({ ...state, executed: true });

                    resolve({ content, transform });
                })
            };

            const action = Action.create(name, params, exec);

            const state = { initial: true };
            const result = await action.execute({ initial: true });

            expect(result.transform(state)).to.deep.equal({ ...state, executed: true });
        });
    });
});
