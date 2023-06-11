# 功能说明

1. 点击编辑器左下角 DEVTools 打开对话面板，现在仅支持 chatgpt  gpt-3.5-turbo model 单次对话（不保存上下文）
2. setting.json 中可预定义prompts， 格式如下

```json
{
  "fe-dev-tools.prompts": {
    "1": "接下来请用中文回答我的问题",
    "3": "将CSS样式转换成RN style"
  },
  "fe-dev-tools.curPromptKey": "3"
}
```

