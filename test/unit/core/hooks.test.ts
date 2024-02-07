import * as sinon from "sinon";
import { expect } from "chai";
import { Hooks } from "../../../src/core/hooks";

describe("Hooks", () => {
    describe("register", () => {
        beforeEach(() => {
            Hooks.clearAll();
        });

        it("should register a hook function for an event and return true", () => {
            const event = "test";
            const hook = sinon.fake();

            const result = Hooks.register(event, hook);

            Hooks.invoke(event);

            expect(result).to.be.true;
            expect(hook.called).to.be.true;
        });

        it("should not register a duplicate hook for the same event and return false", () => {
            const event = "test";
            const hook = sinon.fake();

            const success = Hooks.register(event, hook);
            const failure = Hooks.register(event, hook);

            Hooks.invoke(event);

            expect(success).to.be.true;
            expect(failure).to.be.false;
            expect(hook.callCount).to.equal(1);
        });

        it("should allow multiple unique hooks for the same event and return true for each", () => {
            const event = "test";
            const hookFunction1 = sinon.fake();
            const hookFunction2 = sinon.fake();

            const result1 = Hooks.register(event, hookFunction1);
            const result2 = Hooks.register(event, hookFunction2);

            Hooks.invoke(event);

            expect(result1).to.be.true;
            expect(result2).to.be.true;
            expect(hookFunction1.called).to.be.true;
            expect(hookFunction2.called).to.be.true;
        });
    });

    describe("unregister", () => {
        beforeEach(() => {
            Hooks.clearAll();
        });

        it("should unregister a hook function for an event and return true", () => {
            const event = "test";
            const hook = sinon.fake();

            Hooks.register(event, hook);

            const result = Hooks.unregister(event, hook);

            Hooks.invoke(event);

            expect(result).to.be.true;
            expect(hook.called).to.be.false;
        });

        it("should return false when trying to unregister a hook that does not exist", () => {
            const event = "test";
            const hook = sinon.fake();

            const result = Hooks.unregister(event, hook);

            expect(result).to.be.false;
        });

        it('should clean up the event entry if there are no more hooks after unregistering', () => {
            const event = 'test';
            const hook = sinon.fake();

            Hooks.register(event, hook);

            expect(Hooks.has(event)).to.be.true;

            const result = Hooks.unregister(event, hook);

            expect(result).to.be.true;
            expect(Hooks.has(event)).to.be.false;
        });
    });

    describe("has", () => {
        beforeEach(() => {
            Hooks.clearAll();
        });

        it("should return true if an event has hooks registered", () => {
            const event = "test";

            Hooks.register(event, () => {});
            expect(Hooks.has(event)).to.be.true;
        });

        it("should return false if an event does not have hooks registered", () => {
            const eventName = "test";

            expect(Hooks.has(eventName)).to.be.false;
        });
    });

    describe("invoke", () => {
        beforeEach(() => {
            Hooks.clearAll();
        });

        it("should invoke all hooks registered for an event with provided arguments", async () => {
            const event = "test";
            const hook1 = sinon.fake();
            const hook2 = sinon.fake();

            Hooks.register(event, hook1);
            Hooks.register(event, hook2);

            await Hooks.invoke(event, "arg1", 2);

            expect(hook1.calledOnceWithExactly("arg1", 2)).to.be.true;
            expect(hook2.calledOnceWithExactly("arg1", 2)).to.be.true;
        });

        it("should not invoke hooks not registered for an event", async () => {
            const event = "test";
            const hook = sinon.fake();

            Hooks.register(event, hook);

            await Hooks.invoke("unregistered", "arg1", 2);

            expect(hook.called).to.be.false;
        });

        it("should handle and log errors thrown by hook functions without stopping the invocation of subsequent hooks", async () => {
            const event = "test";
            const hook1 = sinon.fake();
            const error = sinon.fake.throws(new Error("Test error"));
            const hook2 = sinon.fake();

            Hooks.register(event, hook1);
            Hooks.register(event, error);
            Hooks.register(event, hook2);

            const consoleErrorStub = sinon.stub(console, "error");

            try {
                await Hooks.invoke(event, "arg1", 2);

                expect(hook1.calledOnce).to.be.true;
                expect(error.calledOnce).to.be.true;
                expect(hook2.calledOnce).to.be.true;
                expect(consoleErrorStub.called).to.be.true;
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
                expect((error as Error).message).to.equal("Test error");
            } finally {
                consoleErrorStub.restore();
            }
        });
    });

    describe("clear", () => {
        beforeEach(() => {
            Hooks.clearAll();
        });

        it("should remove all hooks for a given event", () => {
            const event = "test";

            Hooks.register(event, () => {});
            Hooks.register(event, () => {});

            Hooks.clear(event);

            expect(Hooks.has(event)).to.be.false;
        });

        it("should not affect other events when clearing hooks for a specific event", () => {
            const event1 = "test";
            const event2 = "otherEvent";

            Hooks.register(event1, () => {});
            Hooks.register(event2, () => {});

            Hooks.clear(event1);

            expect(Hooks.has(event2)).to.be.true;
        });
    });

    describe("clearAll", () => {
        it("should remove all registered hooks across all events", () => {
            const event1 = "event1";
            const event2 = "event2";

            Hooks.register(event1, () => {});
            Hooks.register(event2, () => {});

            Hooks.clearAll();

            expect(Hooks.has(event1)).to.be.false;
            expect(Hooks.has(event2)).to.be.false;
        });
    });
});
