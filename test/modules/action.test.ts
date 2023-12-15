import { expect } from "chai";
import { Effect } from "../../src/interfaces";
import { Action } from "../../src/modules";

describe("Action", () => {
    describe("create", () => {
        it("should create an Action instance with the correct properties", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Effect<any, any> => {
                const content = params.length;
                const transform = (state: any) => ({ ...state, count: content });

                return { content, transform };
            };

            const action = Action.create(name, params, exec);

            expect(action.name).to.equal(name);
            expect(action.params).to.deep.equal(params);
            expect(action.exec).to.be.a("function");
            expect(action.timestamp).to.be.instanceOf(Date);
        });
    });
});
