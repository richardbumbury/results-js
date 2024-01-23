import { expect } from "chai";
import { Ledger, Action } from "../../src/modules";
import { Effect } from "../../src/interfaces";

describe("Ledger", () => {
    afterEach(() => {
        Ledger["registry"].clear();
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


            const result = Ledger.set("TEST_ACTION", exec);

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

            Ledger.set("TEST_ACTION", exec);

            expect(() => Ledger.set("TEST_ACTION", exec)).to.throw(Error);
        });

        it("should return true upon successful registration", () => {
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };

            const result = Ledger.set("TEST_ACTION", exec);

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

            Ledger.set("TEST_ACTION", exec);
        });

        it("should retrieve an exec function for a registered action type", () => {
            const exec = Ledger.get("TEST_ACTION");

            expect(exec).to.be.a("function");
        });

        it("should throw an error if the exec function for a given type is not registered", () => {
            expect(() => Ledger.get("UNREGISTERED_ACTION")).to.throw(Error);
        });
    });

    describe('has', () => {
        it('should return false when the action type is not registered', () => {
            const result = Ledger.has('UNREGISTERED_ACTION');

            expect(result).to.be.false;
        });

        it('should return true when the action type is registered', () => {
            const exec = (currentState: any, params: number[]): Promise<Effect<any, any>> => {
                return new Promise(resolve => {
                    const content = params.length;
                    const transform = (state: any) => ({ ...state, count: content });

                    resolve({ content, transform });
                })
            };

            Ledger.set("TEST_ACTION", exec);

            const result = Ledger.has('TEST_ACTION');

            expect(result).to.be.true;
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

            Ledger.set("TEST_ACTION", exec);

            action = Action.create(name, params, exec);
        });

        it("should correctly rehydrate an action with its associated exec function", async () => {
            const _action = Ledger.rehydrate(action, "TEST_ACTION");
            const currentState = { initial: true };
            const result = await _action.execute(currentState);

            const nextState = { ...currentState, effect: true };

            expect(result.transform(currentState)).to.deep.equal(nextState);
        });

        it("should throw an error when trying to rehydrate with a non-registered type", () => {
            expect(() => Ledger.rehydrate(action, "MISSING_ACTION")).to.throw(Error);
        });
    });
});
