import { expect } from "chai";
import { Effect } from "../../src/interfaces";
import { Action, Result, Issue } from "../../src/modules";

describe("Issue", () => {
    describe("fromAction", () => {
        it("should create an Issue with the correct error message", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };

            const action = Action.create(name, params, exec);
            const error = new Error("Execution failed");
            const issue = Issue.fromAction(action, error);

            expect(issue.message).to.equal("Execution failed");
        });

        it("should create an Issue with the correct action", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };

            const action = Action.create(name, params, exec);
            const error = new Error("Execution failed");
            const issue = Issue.fromAction(action, error);

            expect(issue.action).to.equal(action);
        });

        it("should create an Issue with a failure Result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };

            const action = Action.create(name, params, exec);
            const error = new Error("Execution failed");
            const issue = Issue.fromAction(action, error);

            expect(issue.result).to.be.instanceOf(Result);
            expect(issue.result.success).to.be.false;
            expect(issue.result.errors).to.include(error);
        });
    });
});
