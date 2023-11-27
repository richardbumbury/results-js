import { expect } from "chai";
import { Action } from "../../src/modules";

describe("Action class", () => {
    describe("create", () => {
        it("should create an Action instance with the correct name", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);

            expect(action.name).to.equal(name);
        });

        it("should create an Action instance with the correct parameters", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);

            expect(action.params).to.deep.equal(params);
        });

        it("should create an Action instance with a valid exec function", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);

            expect(action.exec).to.be.a("function");
            expect(action.exec([1, 2, 3])).to.equal(3);
        });

        it("should create an Action instance with a timestamp property", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);

            expect(action.timestamp).to.be.instanceOf(Date);
        });
    });
});
