import { expect } from "chai";
import { Result, Action } from "../../src/modules";

describe("Result", () => {
    describe("success", () => {
        it("should create a successful result with correct content", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const content = "Execution success";
            const result = Result.success(action, content, null, null);

            expect(result.success).to.be.true;
            expect(result.content).to.equal(content);
            expect(result.errors).to.be.empty;
        });
    });

    describe("failure", () => {
        it("should create a failure result with correct errors", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);

            expect(result.success).to.be.false;
            expect(result.content).to.be.null;
            expect(result.errors).to.deep.equal(errors);
        });
    });

    describe("map", () => {
        it("should correctly transform the content of a successful result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const result = Result.success(action, "success", null, null);
            const transformed = result.map(content => content ? content.toUpperCase() : content);

            expect(transformed.success).to.be.true;
            expect(transformed.content).to.equal("SUCCESS");
            expect(transformed.errors).to.be.empty;
        });

        it("should not alter the errors in a failed result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const transformed = result.map(content => "should not be seen");

            expect(transformed.success).to.be.false;
            expect(transformed.content).to.be.null;
            expect(transformed.errors).to.deep.equal(errors);
        });

        it("should handle null content in a successful result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const result = Result.success(action, null, null, null);
            const transformed = result.map(content => "default content");

            expect(transformed.success).to.be.true;
            expect(transformed.content).to.be.null;
        });
    });

    describe("bind", () => {
        it("should correctly chain another operation on a successful result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const result = Result.success(action, "success", null, null);
            const chained = result.bind(content =>
                Result.success(action, content ? content.toUpperCase() : content, null, null));

            expect(chained.success).to.be.true;
            expect(chained.content).to.equal("SUCCESS");
            expect(chained.errors).to.be.empty;
        });

        it("should retain the failure state and errors in a failed result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const chained = result.bind(content =>
                Result.success(action, "should not be seen", null, null));

            expect(chained.success).to.be.false;
            expect(chained.content).to.be.null;
            expect(chained.errors).to.deep.equal(errors);
        });

        it("should handle null content in a successful result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const result = Result.success(action, null, null, null);
            const chained = result.bind(content =>
                Result.success(action, "default content", null, null));
            expect(chained.success).to.be.true;
            expect(chained.content).to.be.null;
        });
    });

    describe('fold', () => {
        it("should apply the success function on a successful result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const result = Result.success(action, "success", null, null);
            const folded = result.fold(
                content => `Success: ${content}`,
                errors => `Failed with ${errors.length} errors`
            );

            expect(folded).to.equal("Success: success");
        });

        it("should apply the failure function on a failed result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const folded = result.fold(
                content => `Success: ${content}`,
                errors => `Failed with ${errors.length} errors`
            );

            expect(folded).to.equal("Failed with 1 errors");
        });
    });

    describe("recover", () => {
        it("should transform a failed result into a successful one", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const recovered = result.recover(errors => `Recovered from ${errors.length} errors`);

            expect(recovered.success).to.be.true;
            expect(recovered.content).to.equal("Recovered from 1 errors");
        });

        it("should have no effect on a successful result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const result = Result.success(action, "success", null, null);
            const recovered = result.recover(errors => `Recovered from ${errors.length} errors`);

            expect(recovered.success).to.be.true;
            expect(recovered.content).to.equal("success");
        });
    });

    describe("orElse", () => {
        it("should return an alternative result on a failed result", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const errors = [new Error("Execution failed")];
            const result = Result.failure(action, errors, null, null);
            const alternative = result.orElse(() => Result.success(action, "alternative", null, null));

            expect(alternative.success).to.be.true;
            expect(alternative.content).to.equal("alternative");
        });

        it("should return the original result when it is successful", () => {
            const name = "TEST_ACTION";
            const params = [1, 2, 3];
            const exec = (params: number[]) => params.length;
            const action = Action.create(name, exec, ...params);
            const result = Result.success(action, "success", null, null);
            const _result = result.orElse(() => Result.success(action, "alternative", null, null));

            expect(_result.success).to.be.true;
            expect(_result.content).to.equal("success");
        });
    });
});
