import { expect } from "chai";
import { Roster, Action } from "../../src/modules";
import { Effect } from "../../src/interfaces";

describe("Roster", () => {
    afterEach(() => {
        Roster["registry"].clear();
    });

    describe("set", () => {
        it("should successfully register an exec function", () => {
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };


            const result = Roster.set("TEST_ACTION", exec);

            expect(result).to.be.true;
        });

        it("should throw an error when registering a duplicate exec function", () => {
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };

            Roster.set("TEST_ACTION", exec);

            expect(() => Roster.set("TEST_ACTION", exec)).to.throw(Error);
        });

        it("should return true upon successful registration", () => {
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };

            const result = Roster.set("TEST_ACTION", exec);

            expect(result).to.be.true;
        });
    });

    describe("get", () => {
        beforeEach(() => {
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };

            Roster.set("TEST_ACTION", exec);
        });

        it("should retrieve an exec function for a registered action type", () => {
            const exec = Roster.get("TEST_ACTION");

            expect(exec).to.be.a("function");
        });

        it("should throw an error if the exec function for a given type is not registered", () => {
            expect(() => Roster.get("MISSING_ACTION")).to.throw(Error);
        });
    });

    describe("rehydrate", () => {
        let action: Action<any, any, any>;

        beforeEach(() => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, effect: true });

                    resolve({ content, transform });
                })
            };

            Roster.set("TEST_ACTION", exec);

            action = Action.create(name, params, exec);
        });

        it("should correctly rehydrate an action with its associated exec function", async () => {
            const _action = Roster.rehydrate(action, "TEST_ACTION");
            const currentState = { initial: true };
            const result = await _action.execute(currentState);

            const nextState = { ...currentState, effect: true };

            expect(result.transform(currentState)).to.deep.equal(nextState);
        });

        it("should throw an error when trying to rehydrate with a non-registered type", () => {
            expect(() => Roster.rehydrate(action, "MISSING_ACTION")).to.throw(Error);
        });
    });
});
