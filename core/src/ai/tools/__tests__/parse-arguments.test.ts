import path from "path";

import { parseArguments } from "../parse-arguments";

import Operation from "../../../api/operation";
import { parse } from "../../../api/oas-loader";

let parseArgsResponse: any;
let errorData: any;

jest.mock("openai", () => {
  return {
    OpenAIApi: jest.fn().mockImplementation(() => {
      return {
        createChatCompletion: ({ messages }: { messages: any }) => {
          if (errorData) {
            throw errorData;
          }

          if (
            messages[0].role === "system" &&
            messages[0].content.includes("Parse user input into arguments")
          ) {
            return Promise.resolve(parseArgsResponse);
          }
        },
      };
    }),
    Configuration: jest.fn().mockImplementation(() => {}),
  };
});

describe("parseArguments", () => {
  const filename: string = path.join(
    __dirname,
    "../../../../fixtures/oases/petstore.yaml"
  );
  let operations: Operation[];
  let operation: Operation;
  let functionSpec: any;

  beforeEach(async () => {
    operations = await parse({ filename });
    operation = operations[1];
    functionSpec = operation.toFunction();
    errorData = null;
  });

  test("when arguments can be parsed successfully", async () => {
    parseArgsResponse = {
      data: {
        choices: [
          { message: { function_call: { arguments: '{ "name": "Sticky" }' } } },
        ],
      },
    };

    const result = await parseArguments({
      userPrompt: "Add a new pet named Sticky",
      openaiApiKey: "secretKey",
      model: "gpt-3.5-turbo-0613",
      functionSpec,
    });

    expect(result).toEqual({ name: "Sticky" });
  });

  test("when there are no arguments", async () => {
    parseArgsResponse = {
      data: {
        choices: [{ message: { function_call: { arguments: "{}" } } }],
      },
    };

    const result = await parseArguments({
      userPrompt: "Add a new pet named Sticky",
      openaiApiKey: "secretKey",
      model: "gpt-3.5-turbo-0613",
      functionSpec,
    });

    expect(result).toEqual({});
  });

  describe("when operation does not have any parameters", () => {
    beforeEach(() => {
      operation = operations[0];
      functionSpec = operation.toFunction();
    });

    test("does not hit AI and return empty object", async () => {
      const result = await parseArguments({
        userPrompt: "Add a new pet named Sticky",
        openaiApiKey: "secretKey",
        model: "gpt-3.5-turbo-0613",
        functionSpec,
      });

      expect(result).toEqual({});
    });
  });

  test("When there is a generic error with the request", async () => {
    errorData = new Error("A network error");

    await expect(
      parseArguments({
        userPrompt: "Add a new pet named Sticky",
        openaiApiKey: "secretKey",
        model: "gpt-3.5-turbo-0613",
        functionSpec,
      })
    ).rejects.toThrow("There's an error parsing arguments: A network error");
  });

  test("When there is an openAI error", async () => {
    errorData = {
      response: {
        status: 404,
        data: {
          error: {
            message: "The model `gpt-3.5-turbo-06139` does not exist",
            type: "invalid_request_error",
            param: null,
            code: null,
          },
        },
      },
    };

    await expect(
      parseArguments({
        userPrompt: "Add a new pet named Sticky",
        openaiApiKey: "secretKey",
        model: "gpt-3.5-turbo-0613",
        functionSpec,
      })
    ).rejects.toThrow(
      `There's an error parsing arguments: Response status 404, data: ${JSON.stringify(
        errorData.response.data
      )}`
    );
  });
});
