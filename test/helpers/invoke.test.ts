import { expect } from "chai";
import { invoke } from "../../src/helpers";
import { Effect } from "../../src/interfaces";
import { Action, Result, Issue } from "../../src/modules";

describe("invoke", () => {
    it("should return a Result object when an Action is executed successfully", async () => {
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
        const state = { x: true };
        const result = await invoke(action, state);

        expect(result).to.be.an.instanceOf(Result)
    });

    it("should return an Issue object when an error occurs", async () => {
        const name = "ERROR_ACTION";
        const params = [1, 2, 3];
        const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
            throw new Error("Test error");
        };

        const action = Action.create(name, params, exec);
        const state = { x: true };
        const result = await invoke(action, state);

        expect(result).to.be.an.instanceOf(Issue);
    });

    it("should handle state transitions correctly", async () => {
        const name = "TRANSITION_ACTION";
        const params = [1, 2, 3];
        const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
            return new Promise(resolve => {
                const content = params.length;
                const transform = (state: any) => ({ ...state, count: content });

                resolve({ content, transform });
            })
        };

        const action = Action.create(name, params, exec);
        const initialState = { x: true };
        const result = await invoke(action, initialState);

        if (result instanceof Result) {
            expect(result.content).to.equal(params.length);
            expect(result.nextState).to.deep.equal({ ...initialState, count: params.length });
        } else {
            expect.fail("Expected result to be an instance of Result");
        }
    });

    it("should handle invalid parameters correctly", async () => {
        const name = "INVALID_PARAMS_ACTION";
        const invalidParams = ["invalid"];
        const exec = (currentState: any, params: any): Promise<Effect<any, any>> => {
            return new Promise(resolve => {
                const isValidParams = (paramArray: any[]): paramArray is number[] => paramArray.every(param => typeof param === "number");

                if (!isValidParams(params)) {
                    throw new Error("Invalid parameters");
                }

                const content = params.length;
                const transform = (state: any) => ({ ...state, count: content });

                resolve({ content, transform });
            })
        };

        const action = Action.create(name, invalidParams, exec);
        const state = { x: true };

        const result = await invoke(action, state);

        expect(result).to.be.an.instanceOf(Issue);
    });
});
