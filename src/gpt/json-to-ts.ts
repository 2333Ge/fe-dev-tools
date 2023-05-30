import { Configuration, OpenAIApi } from "openai";
import { JSON_TO_TS } from "./prompts";

const apiKey = "";

export const getCompletion = async (input: string) => {
  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: JSON_TO_TS,
        },
        {
          role: "user",
          content: input,
        },
      ],
    });
    return response.data.choices[0].message?.content;
  } catch (error: any) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
};
