# API Documentation

## /chat

Endpoint for interacting with the AI chat assistant.

**Method:** POST

**URL:** `http://localhost:8000/chat`

### Request Headers

| Header | Value |
|--------|-------|
| Content-Type | application/json |

### Request Body

```json
{
  "user_query": "string",
  "session_id": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user_query | string | Yes | The user's message or question |
| session_id | string | Yes | Unique identifier for the chat session |

### Response

The endpoint returns a **server-sent events (SSE)** stream with `TextDelta` events:

```
{"type":"TextDelta","delta":"Hello"}
{"type":"TextDelta","delta":"!"}
...
```

Each chunk contains a partial text delta that accumulates to form the complete response.

### Response Events

The stream can contain two types of events:

#### TextDelta

Returns partial text chunks that form the assistant's response:

```
{"type":"TextDelta","delta":"Hello"}
{"type":"TextDelta","delta":" world"}
...
```

#### ToolCall

When the assistant needs to use a tool, a `ToolCall` event is emitted:

```
{"type":"ToolCall","tool":{"name":"show_experience","arguments":{"company_name":"ai-lens"},"tool_call_id":"call-734dce4d-f4c9-4491-abb0-8a909cb0148c"}}
```

| Field | Type | Description |
|-------|------|-------------|
| type | string | Always `"ToolCall"` |
| tool.name | string | Name of the tool being called |
| tool.arguments | object | Arguments passed to the tool |
| tool.tool_call_id | string | Unique identifier for this tool call |

### Example Usage

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"user_query": "Tell me about yourself", "session_id": "my-session"}'
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 405 | Method Not Allowed (when using GET instead of POST) |
| 422 | Validation Error (missing required fields) |
