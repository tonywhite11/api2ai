import { Configuration, OpenAIApi } from "openai";

const SYSTEM_PROMPT =
  "Parse user input into arguments. Leave missing parameters blank. Do not make up any information not in user input.";

interface ParseArgumentsInput {
  userPrompt: string;
  openaiApiKey: string;
  model: string;
  functionSpec: any;
}

export const parseArguments = async ({
  userPrompt,
  model,
  openaiApiKey,
  functionSpec,
}: ParseArgumentsInput) => {
  // Skip parsing args if there's none.
  if (Object.keys(functionSpec.parameters).length === 0) {
    return {};
  }

  try {
    const aiConfig = new Configuration({ apiKey: openaiApiKey });
    const openai = new OpenAIApi(aiConfig);

    const chatCompletion: any = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      functions: [functionSpec],
    });

    const args =
      chatCompletion.data?.choices[0]?.message?.function_call?.arguments;
    return args ? JSON.parse(args) : null;
  } catch (error: any) {
    let errorMessage: string;

    if (error.response) {
      errorMessage = `Response status ${
        error.response.status
      }, data: ${JSON.stringify(error.response.data)}`;
    } else {
      errorMessage = error.message;
    }

    throw new Error(`There's an error parsing arguments: ${errorMessage}`);
  }
};
