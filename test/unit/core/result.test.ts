import * as sinon from "sinon";
import { expect } from "chai";
import { IEffect } from "../../../src/interfaces";
import { Action, Hooks, Result } from "../../../src/core";

describe("Result", () => {
    describe("success", () => {
        it("should create a successful result with correct content", () => {
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

            const content = "Execution success";
            const result = Result.success(action, content, null, null);

            expect(result.success).to.be.true;
            expect(result.content).to.equal(content);
            expect(result.errors).to.be.empty;
        });
    });

    describe("failure", () => {
        it("should create a failure result with correct errors", () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);

            expect(result.success).to.be.false;
            expect(result.content).to.be.null;
            expect(result.errors).to.deep.equal(errors);
        });
    });

    describe("fromJSON", () => {
        let warn: sinon.SinonStub;

        beforeEach(() => {
            warn = sinon.stub(console, "warn");
        });

        afterEach(() => {
            sinon.restore();
        });

        it("should correctly reconstruct a successful Result object from JSON", async () => {
            const json = {
                id: "12345",
                correlationId: "12345",
                success: true,
                content: { some: "data" },
                errors: [],
                action: {
                    id: "12345",
                    correlationId: "12345",
                    name: "TEST_ACTION",
                    params: [1, 2, 3],
                },
                prevState: { count: 0 },
                nextState: { count: 3 },
                timestamp: new Date().toISOString(),
                executionTime: null,
            };

            const result = await Result.fromJSON(json);

            expect(result).to.be.an.instanceof(Result);
            expect(result.success).to.equal(true);
            expect(result.content).to.deep.equal({ some: "data" });
            expect(result.errors).to.be.empty;
            expect(result.action.name).to.equal("TEST_ACTION");
            expect(result.prevState).to.deep.equal({ count: 0 });
            expect(result.nextState).to.deep.equal({ count: 3 });
        });

        it("should correctly reconstruct a failed Result object from JSON", async () => {
            const json = {
                id: "67890",
                correlationId: "67890",
                success: false,
                content: null,
                errors: [{ message: "Error occurred" }],
                action: {
                    id: "67890",
                    correlationId: "67890",
                        name: "FAIL_ACTION",
                    params: [4, 5, 6],
                },
                prevState: { count: 3 },
                nextState: null,
                timestamp: new Date().toISOString(),
                executionTime: null,
            };

            const result = await Result.fromJSON(json);

            expect(result).to.be.an.instanceof(Result);
            expect(result.success).to.equal(false);
            expect(result.content).to.be.null;
            expect(result.errors).to.have.lengthOf(1);
            expect(result.errors[0].message).to.equal("Error occurred");
            expect(result.action.name).to.equal("FAIL_ACTION");
            expect(result.prevState).to.deep.equal({ count: 3 });
            expect(result.nextState).to.be.null;
        });

        it("should call hooks during state deserialization", async () => {
            const beforeDeserializeStateStub = sinon.stub();
            const afterDeserializeStateStub = sinon.stub();

            try {
                Hooks.register("before-deserialize-state", beforeDeserializeStateStub);
                Hooks.register("after-deserialize-state", afterDeserializeStateStub);

                const json = {
                    id: "12345",
                    correlationId: "12345",
                    success: true,
                    content: { some: "data" },
                    errors: [],
                    action: {
                        id: "12345",
                        correlationId: "12345",
                        name: "TEST_ACTION_WITH_HOOKS",
                        params: [7, 8, 9],
                    },
                    prevState: '{"count": 0 }',
                    nextState: '{"count": 3 }',
                    timestamp: new Date().toISOString(),
                    executionTime: null,
                };

                await Result.fromJSON(json);

                sinon.assert.calledWith(beforeDeserializeStateStub, '{"count": 0 }', '{"count": 3 }');
                sinon.assert.calledWith(afterDeserializeStateStub, '{"count": 0 }', '{"count": 3 }');
            } finally {
                Hooks.unregister("before-deserialize-state", beforeDeserializeStateStub);
                Hooks.unregister("after-deserialize-state", afterDeserializeStateStub);
            }
        });
    });

    describe("toJSON", () => {
        it("should serialize a successful result correctly", async () => {
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

            const success = { data: "test" };
            const prevState = { count: 1 };
            const nextState = { count: 2 };
            const result = Result.success(action, success, prevState, nextState);

            const json = result.toJSON();

            expect(json).to.be.an("object");
            expect(json).to.include.keys("id", "correlationId", "success", "content", "errors", "action", "prevState", "nextState", "timestamp", "executionTime");
            expect(json).to.have.property("id").that.is.a("string");
            expect(json.success).to.equal(true);
            expect(json.content).to.deep.equal(success);
            expect(json.errors).to.be.an("array").that.is.empty;
            expect(json.action).to.deep.include({ name: "TEST_ACTION" });
            expect(json.prevState).to.deep.equal(prevState);
            expect(json.nextState).to.deep.equal(nextState);
            expect(json).to.have.property("timestamp").that.is.a("string");
            expect(json).to.have.property("executionTime").that.is.a("number");
        });

        it("should serialize a failure result correctly", async () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const error = new Error("Test error");
            const prevState = { count: 1 };
            const result = Result.failure(action, [error], prevState, null);

            const json = result.toJSON();

            expect(json).to.be.an("object");
            expect(json).to.include.keys("id", "correlationId", "success", "content", "errors", "action", "prevState", "nextState", "timestamp", "executionTime");
            expect(json).to.have.property("id").that.is.a("string");
            expect(json.success).to.equal(false);
            expect(json.content).to.equal(null);
            expect(json.errors).to.have.lengthOf(1);
            expect(json.errors[0]).to.deep.include({ message: "Test error" });
            expect(json.action).to.deep.include({ name: "FAIL_ACTION" });
            expect(json.prevState).to.deep.equal(prevState);
            expect(json.nextState).to.equal(null);
            expect(json).to.have.property("timestamp").that.is.a("string");
            expect(json).to.have.property("executionTime").that.is.a("number");
        });

        it("should allow the serialized JSON to be stringified", () => {
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

            const success = { data: "test" };
            const prevState = { count: 1 };
            const nextState = { count: 2 };
            const result = Result.success(action, success, prevState, nextState);

            const json = result.toJSON();

            expect(() => JSON.stringify(json)).to.not.throw();
        });
    });

    describe("isSuccess", () => {
        it("should return true for a successful result", () => {
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

            const result = Result.success(action, "Success content", null, null);
            expect(result.isSuccess()).to.be.true;
        });

        it("should return false for a failed result", () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const result = Result.failure(action, [new Error("Test error")], null, null);
            expect(result.isSuccess()).to.be.false;
        });
    });

    describe("isFailure", () => {
        it("should return true for a failed result", () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const result = Result.failure(action, [new Error("Test error")], null, null);
            expect(result.isFailure()).to.be.true;
        });

        it("should return false for a successful result", () => {
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

            const result = Result.success(action, "Success content", null, null);
            expect(result.isFailure()).to.be.false;
        });
    });

    describe("map", () => {
        it("should correctly transform the content of a successful result", () => {
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

            const result = Result.success(action, "success", null, null);
            const transformed = result.map((content: string) => content ? content.toUpperCase() : content);

            expect(transformed.success).to.be.true;
            expect(transformed.content).to.equal("SUCCESS");
            expect(transformed.errors).to.be.empty;
        });

        it("should not alter the errors in a failed result", () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const transformed = result.map((content: string) => "should not be seen");

            expect(transformed.success).to.be.false;
            expect(transformed.content).to.be.null;
            expect(transformed.errors).to.deep.equal(errors);
        });

        it("should handle null content in a successful result", () => {
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

            const result = Result.success(action, null, null, null);
            const transformed = result.map((content: string) => "default content");

            expect(transformed.success).to.be.true;
            expect(transformed.content).to.be.null;
        });
    });

    describe("bind", () => {
        it("should correctly chain another operation on a successful result", () => {
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

            const result = Result.success(action, "success", null, null);
            const chained = result.bind((content: string) => Result.success(action, content ? content.toUpperCase() : content, null, null));

            expect(chained.success).to.be.true;
            expect(chained.content).to.equal("SUCCESS");
            expect(chained.errors).to.be.empty;
        });

        it("should retain the failure state and errors in a failed result", () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const chained = result.bind((content: string) => Result.success(action, "should not be seen", null, null));

            expect(chained.success).to.be.false;
            expect(chained.content).to.be.null;
            expect(chained.errors).to.deep.equal(errors);
        });

        it("should handle null content in a successful result", () => {
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

            const result = Result.success(action, null, null, null);
            const chained = result.bind((content: string) => Result.success(action, "default content", null, null));

            expect(chained.success).to.be.true;
            expect(chained.content).to.equal("default content");
        });
    });

    describe("fold", () => {
        it("should apply the success function on a successful result", () => {
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

            const result = Result.success(action, "success", null, null);
            const folded = result.fold((content: string) => `Success: ${content}`, (errors: Error[]) => `Failed with ${errors.length} errors`);

            expect(folded).to.equal("Success: success");
        });

        it("should apply the failure function on a failed result", () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const folded = result.fold((content: string) => `Success: ${content}`, (errors: Error[]) => `Failed with ${errors.length} errors`);

            expect(folded).to.equal("Failed with 1 errors");
        });
    });

    describe("recover", () => {
        it("should transform a failed result into a successful one", () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const recovered = result.recover((errors: Error[]) => `Recovered from ${errors.length} errors`);

            expect(recovered.success).to.be.true;
            expect(recovered.content).to.equal("Recovered from 1 errors");
        });

        it("should have no effect on a successful result", () => {
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

            const result = Result.success(action, "success", null, null);
            const recovered = result.recover((errors: Error[]) => `Recovered from ${errors.length} errors`);

            expect(recovered.success).to.be.true;
            expect(recovered.content).to.equal("success");
        });
    });

    describe("orElse", () => {
        it("should return an alternative result on a failed result", () => {
            const action = Action.create("FAIL_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const alternative = result.orElse(() => Result.success(action, "alternative", null, null));

            expect(alternative.success).to.be.true;
            expect(alternative.content).to.equal("alternative");
        });

        it("should return the original result when it is successful", () => {
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

            const result = Result.success(action, "success", null, null);
            const _result = result.orElse(() => Result.success(action, "alternative", null, null));

            expect(_result.success).to.be.true;
            expect(_result.content).to.equal("success");
        });
    });

    describe("generateDiff", () => {
        it("should correctly identify changes between prevState and nextState", async () => {
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

            const prevState = { a: 1, b: 2 };
            const nextState = { a: 1, b: 3 };
            const result = Result.success(action, {}, prevState, nextState);
            const diffs = result.generateDiff();

            expect(diffs).to.not.be.undefined;
            expect(diffs).to.be.an("array").and.to.have.length.greaterThan(0);

            if (diffs){
                expect(diffs[0]).to.deep.include({ kind: "E", path: ["b"], lhs: 2, rhs: 3 });
            }
        });

        it("should return undefined if prevState is null", () => {
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

            const result = Result.success(action, {}, null, { a: 2 });

            expect(result.generateDiff()).to.be.undefined;
        });

        it("should return undefined if nextState is null", () => {
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

            const result = Result.success(action, {}, { a: 1 }, null);

            expect(result.generateDiff()).to.be.undefined;
        });

        it("should return undefined if prevState and nextState are identical", () => {
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

            const state = { a: 1 };
            const resultWithIdenticalStates = Result.success(action, {}, state, state);
            const diffs = resultWithIdenticalStates.generateDiff();

            expect(diffs).to.be.undefined;
        });
    });
});
