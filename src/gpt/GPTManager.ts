import { Configuration, OpenAIApi } from "openai";
import { OPENAI_API_KEY } from "../config";

class GPTManager {
  private _apiKey = OPENAI_API_KEY;
  private _openAIApi?: OpenAIApi;

  public init() {
    const configuration = new Configuration({
      apiKey: this._apiKey,
    });
    this._openAIApi = new OpenAIApi(configuration);
  }

  async getSingleCompletion(prompt: string, input: string): Promise<string> {
    try {
      const response = await this._openAIApi!.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: input,
          },
        ],
      });
      return response.data.choices[0].message?.content || "无结果";
    } catch (error: any) {
      console.log("error====>", error);
      if (typeof error.response?.data === "string") {
        throw new Error(error.response.data);
      } else {
        throw new Error(
          error.response?.data?.error?.message ||
            error.response?.data?.error?.code ||
            "未知错误"
        );
      }
    }
  }
}

const gptManager = new GPTManager();

export { gptManager };
