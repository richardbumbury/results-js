import { expect } from "chai";
import { Ledger, Action } from "../../../src/core";
import { IEffect } from "../../../src/interfaces";

describe("Ledger", () => {
    beforeEach(() => {
        Ledger["registry"].clear();
    });

    describe("set", () => {
        it("should successfully register an exec function", () => {
            const exec = (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            const result = Ledger.set("TEST_ACTION", exec);

            expect(result).to.be.true;
        });

        it("should throw an error when registering a duplicate exec function", () => {
            const exec = (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            Ledger.set("TEST_ACTION", exec);

            expect(() => Ledger.set("TEST_ACTION", exec)).to.throw(Error);
        });
    });

    describe("get", () => {
        it("should retrieve an exec function for a registered action", () => {
            const exec = (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            Ledger.set("TEST_ACTION", exec);

            const _exec = Ledger.get("TEST_ACTION");

            expect(_exec).to.be.a("function");
        });

        it("should throw an error if the exec function for a given action is not registered", () => {
            const exec = (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            Ledger.set("TEST_ACTION", exec);

            expect(() => Ledger.get("UNREGISTERED_ACTION")).to.throw(Error);
        });
    });

    describe("has", () => {
        it("should return false when the action is not registered", () => {
            const result = Ledger.has("UNREGISTERED_ACTION");

            expect(result).to.be.false;
        });

        it("should return true when the action is registered", () => {
            const exec = (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            Ledger.set("TEST_ACTION", exec);

            const result = Ledger.has("TEST_ACTION");

            expect(result).to.be.true;
        });
    });

    describe("rehydrate", () => {
        let action: Action<any, any, any>;

        it("should correctly rehydrate an action with its associated exec function", async () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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
                    const transform = (state: any) => ({ ...state, effect: true });

                    resolve({ content, transform });
                })
            };

            Ledger.set("TEST_ACTION", exec);

            action = Action.create(name, params, exec);

            const _action = Ledger.rehydrate(action, "TEST_ACTION");
            const state = { initial: true };
            const result = await _action.execute(state);

            const nextState = { ...state, effect: true };

            expect(result.transform(state)).to.deep.equal(nextState);
        });

        it("should throw an error when trying to rehydrate with a non-registered action", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (currentState: any, params: number[]): Promise<IEffect<any, any>> => {
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

            Ledger.set("TEST_ACTION", exec);

            action = Action.create(name, params, exec);

            expect(() => Ledger.rehydrate(action, "MISSING_ACTION")).to.throw(Error);
        });
    });
});
