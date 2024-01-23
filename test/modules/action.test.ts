import { expect } from "chai";
import { Effect } from "../../src/interfaces";
import { Action } from "../../src/modules";

describe("Action", () => {
    describe("create", () => {
        it("should create an Action instance with the correct properties", () => {
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

            expect(action.name).to.equal(name);
            expect(action.params).to.deep.equal(params);
            expect(action.execute).to.be.a("function");
            expect(action.timestamp).to.be.instanceOf(Date);
        });
    });

    describe("fromJSON", () => {
        it("should create an Action instance with the correct name and params from JSON", () => {
            const json = {
                name: "TEST_ACTION",
                params: [1, 2, 3]
            };

            const action = Action.fromJSON(json);

            expect(action.name).to.equal(json.name);
            expect(action.params).to.deep.equal(json.params);
            expect(action.timestamp).to.be.instanceOf(Date);
        });

        it("should create an Action instance with a default exec function", async () => {
            const json = {
                name: "TEST_ACTION",
                params: [1, 2, 3]
            };

            const action = Action.fromJSON(json);

            await expect(action.execute({})).to.eventually.be.rejected;
        });
    });

    describe("toJSON", () => {
        it("should correctly serialize an action's properties to a JSON object", () => {
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

            const json = action.toJSON();

            expect(json).to.be.an("object");
            expect(json.name).to.equal(name);
            expect(json.params).to.deep.equal(params);
            expect(json.timestamp).to.be.instanceOf(Date);
        });

        it("should not include the exec function in the serialized JSON", () => {
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
            const json = action.toJSON();

            expect(json).to.not.have.property('exec');
        });

        it("should allow the serialized JSON to be stringified", () => {
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
            const json = action.toJSON();

            expect(() => JSON.stringify(json)).to.not.throw();
        });
    });

    describe("attach", () => {
        it("should replace an existing exec function with a new one", async () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const execOne = async (currentState: any, params: number[]) => {
                return { content: "one", transform: (state: any) => state };
            };

            const execTwo = async (currentState: any, params: number[]) => {
                return { content: "two", transform: (state: any) => ({ ...state, updated: true }) };
            };

            const action = Action.create(name, params, execOne);

            action.attach(execTwo)

            const result = await action.execute({});

            expect(result.content).to.equal("two");
            expect(result.transform({})).to.deep.equal({ updated: true });
        });
    });

    describe("execute", () => {
        it("should execute the action with the attached exec function", async () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = "executed";
                    const transform = (state: any) => ({ ...state, executed: true });

                    resolve({ content, transform });
                })
            };

            const action = Action.create(name, params, exec);

            const currentState = { initial: true };
            const result = await action.execute(currentState);

            expect(result.transform(currentState)).to.deep.equal({ ...currentState, executed: true });
        });
    });
});
