export type IWebViewMessage = {
  command: "chat";
  data: {
    content: string;
  };
};

export type IChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
  status: "pending" | "success" | "error";
};

export type IConfig = {
  prompt: string;
  placeholder: string;
};

