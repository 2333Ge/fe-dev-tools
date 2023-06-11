export type IWebChatMsg = {
  command: "chat";
  data: {
    content: string;
  };
};
export type IWebDelPromptMsg = {
  command: "delete-prompt";
  data: {
    key: string;
  };
};

export type IWebChangeCurPromptMsg = {
  command: "change-cur-prompt";
  data: {
    key: string;
  };
};

export type IWebAddPromptMsg = {
  command: "add-prompt";
  data: {
    content: string;
  };
};

export type IWebMsg =
  | IWebChangeCurPromptMsg
  | IWebChatMsg
  | IWebDelPromptMsg
  | IWebAddPromptMsg;

export type IExtCommonMsg = {
  command: "common";
  data: {
    prompts: Record<string, string>;
    curPromptKey: string;
    messages: IChatMessage[];
  };
};

export type IExtMsg = IExtCommonMsg;

/*-----------------分割线-----------------------*/

export type IChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
  status: "pending" | "success" | "error";
};
