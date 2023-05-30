import { JSON_TO_TS, TS_TO_JSON } from "./prompts";
import { gptManager } from "./GptManager";

export const getTS = async (input: string) => {
  return gptManager.getSingleCompletion(JSON_TO_TS, input);
};

export const getJSON = async (input: string) => {
  return gptManager.getSingleCompletion(TS_TO_JSON, input);
};
