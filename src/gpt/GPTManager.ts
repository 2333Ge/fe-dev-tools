import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { OPENAI_API_KEY } from "../config";
import * as vscode from "vscode";

class GPTManager {
  private _openAIApi?: OpenAIApi;

  public init() {
    const configAPIKey = vscode.workspace
      .getConfiguration("fe-dev-tools")
      .get("openaiApiKey", "");
    const configuration = new Configuration({
      apiKey: configAPIKey || OPENAI_API_KEY,
    });
    this._openAIApi = new OpenAIApi(configuration);
  }

  async getSingleCompletion(prompt: string, input: string): Promise<string> {
    return this.getCompletion(
      [
        {
          role: "user",
          content: input,
        },
      ],
      prompt
    );
  }

  async getCompletion(
    history: ChatCompletionRequestMessage[],
    prompt?: string
  ): Promise<string> {
    const _history: ChatCompletionRequestMessage[] = history.map(
      ({ role, content, name }) => ({
        role,
        content,
        name,
      })
    );
    if (prompt) {
      _history.unshift({ role: "user", content: prompt });
    }
    try {
      const response = await this._openAIApi!.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: _history,
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
            error.message ||
            "未知错误"
        );
      }
    }
  }
}

const gptManager = new GPTManager();

export { gptManager };
