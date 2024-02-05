import * as sinon from "sinon";
import { expect } from "chai";
import { Effect } from "../../../src/__interfaces";
import { Action, Result, Issue } from "../../../src/__core";

describe("Issue", () => {
    describe("fromAction", () => {
        it("should create an Issue with the correct error message", () => {
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

            const error = new Error("Execution failed");
            const issue = Issue.fromAction(action, error);

            expect(issue.message).to.equal(error.message);
        });

        it("should create an Issue with the correct action", () => {
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

            const error = new Error("Execution failed");
            const issue = Issue.fromAction(action, error);

            expect(issue.action).to.equal(action);
        });

        it("should create an Issue with a failure Result", () => {
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

            const error = new Error("Execution failed");
            const issue = Issue.fromAction(action, error);

            expect(issue.result).to.be.instanceOf(Result);
            expect(issue.result.success).to.be.false;
            expect(issue.result.errors).to.include(error);
        });
    });

    describe("fromJSON", () => {
        let warn: sinon.SinonStub;

        beforeEach(() => {
            warn = sinon.stub(console, "warn");
        });

        afterEach(() => {
            warn.restore();
        });

        it("should create an Issue instance from valid JSON", () => {
            const actionJSON = {
                id: "12345",
                correlationId: "12345",
                name: "TEST_ACTION",
                params: [1, 2, 3]
            };

            const resultJSON = {
                id: "12345",
                correlationId: "12345",
                success: false,
                content: null,
                errors: [{ message: "Test error", name: "Error" }],
                action: actionJSON,
                prevState: null,
                nextState: null,
                timestamp: new Date().toISOString(),
                executionTime: null
            };

            const issueJSON = {
                id: "12345",
                correlationId: "12345",
                name: "IssueName",
                message: "Test issue",
                action: actionJSON,
                result: resultJSON,
                timestamp: new Date().toISOString(),
                executionTime: null,
            };

            const issue = Issue.fromJSON(issueJSON);

            expect(issue).to.be.an.instanceof(Issue);
            expect(issue.action.name).to.equal(actionJSON.name);
            expect(issue.result.errors[0].message).to.equal(resultJSON.errors[0].message);
        });
    });
    describe("Issue.toJSON", () => {
        it("serializes an Issue instance to JSON", () => {
            const action = Action.create("TEST_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            const issue = Issue.fromAction(action, error);

            const json = issue.toJSON();

            expect(json).to.be.an("object");
            expect(json).to.include.keys("id", "correlationId", "name", "message", "action", "result");
            expect(json.action.name).to.equal("TEST_ACTION");
            if (json.result) {
                expect(json.result).to.not.be.null;
                expect(json.result.errors.length).to.be.greaterThan(0);
                expect(json.result.errors[0].message).to.equal("Test error");
            }
        });

        it("should allow the serialized JSON to be stringified", () => {
            const action = Action.create("TEST_ACTION", [-1, 2, 3], async (currentState: any, params: number[]): Promise<Effect<any, any>> => {
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
            const issue = Issue.fromAction(action, error);

            const json = issue.toJSON();

            expect(() => JSON.stringify(json)).to.not.throw();
        });
    });});
