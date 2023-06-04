import { IChatMessage } from "./data";

export const getMessageViewContent = (messages?: IChatMessage[]) => {
  if (!messages?.length) {
    return "";
  }
  return messages
    .map((message) => {
      if (message.status === "pending") {
        return '<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="30" />';
      }
      return `<div class="message ${message.role === "user" ? "sent" : ""}">${
        message.content
      }</div>`;
    })
    .join("");
};

export const getWebViewContent = (messages?: IChatMessage[]) => {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Chat Interface</title>
      <style>
        /* Set up basic layout */
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        #chat-container {
          position: absolute;
          top: 0;
          bottom: 100px;
          left: 0;
          right: 0;
          overflow-y: scroll;
          padding: 10px;
        }
        #input-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50px;
          background-color: #f2f2f2;
          display: flex;
          align-items: center;
          padding: 0 10px;
        }
        #input-box {
          flex-grow: 1;
          height: 30px;
          border: none;
          border-radius: 5px;
          padding: 5px;
          margin-right: 10px;
        }
        #send-button {
          height: 30px;
          border: none;
          border-radius: 5px;
          background-color: #4caf50;
          color: white;
          padding: 5px 10px;
          cursor: pointer;
        }
        #function-button {
          height: 30px;
          border: none;
          border-radius: 5px;
          background-color: #f2f2f2;
          color: black;
          padding: 5px 10px;
          cursor: pointer;
        }
        #function-panel {
          display: none;
          position: absolute;
          bottom: 50px;
          left: 0;
          right: 0;
          height: 100px;
          background-color: #f2f2f2;
          padding: 10px;
        }
        /* Style chat messages */
        .message {
          margin-bottom: 10px;
          padding: 10px;
          border-radius: 5px;
          background-color: #f2f2f2;
        white-space:break-spaces;
      }
        .message.sent {
          background-color: #4caf50;
          color: white;
        }
      </style>
    </head>
    <body>
      <div id="chat-container">
        <!-- Example chat messages -->
        ${getMessageViewContent(messages)}
      </div>
      <div id="input-container">
        <input type="text" id="input-box" placeholder="Type a message..." />
        <button id="send-button">Send</button>
        <!-- <button id="function-button">Function</button> -->
      </div>
      <div id="function-panel">
        <!-- Functionality options -->
      </div>
      <script>
      const vscode = acquireVsCodeApi();
        document
          .getElementById("send-button")
          .addEventListener("click", function () {
            const inputBox = document.getElementById("input-box");
            const content = inputBox.value;
            inputBox.value = "";
            vscode.postMessage({
              command: "chat",
              data:{
                content,
              }
            });
          });
      </script>
    </body>
  </html>
  `;
};
