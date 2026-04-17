# API Tester — Detailed Guide

A full-featured HTTP request builder built into Dev Utils Hub. Use it to craft, send, and inspect API calls without leaving the app.

> Screenshot placeholder: `docs/screenshots/api-tester-overview.png`

---

## Feature Overview

| Feature                | Details                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| HTTP methods           | GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS                                               |
| Authentication         | Bearer Token, Basic Auth, API Key                                                          |
| Body types             | JSON, plain text, form-data (text representation)                                          |
| Query parameters       | Key-value editor with per-row enable/disable toggle                                        |
| Custom headers         | Key-value editor with per-row enable/disable toggle                                        |
| Request cancellation   | Cancel in-flight request with Escape key or Cancel button                                  |
| Response inspection    | Status code, status text, response time (ms), size (bytes), body (pretty-printed), headers |
| History                | Last 20 requests saved to `localStorage`, restored on reload                               |
| Form validation        | URL and JSON body validated with 300ms debounce                                            |
| Keyboard shortcuts     | `Cmd/Ctrl+Enter` send, `Escape` cancel, `Cmd/Ctrl+L` clear                                 |
| Cross-tool integration | Accepts pre-filled auth config and body from JWT Decoder and Base64 Converter              |

---

## How to Use

### Sending Your First Request

1. Select an HTTP method from the dropdown (default: GET).
2. Type the full URL in the address bar, e.g. `https://api.example.com/users`.
3. Click **Send** or press `Cmd+Enter` (`Ctrl+Enter` on Windows/Linux).
4. The response panel appears below the request builder showing status, timing, body, and headers.

### Adding Query Parameters

1. Open the **Params** tab (default active tab).
2. Click **Add Parameter**.
3. Fill in the key and value fields.
4. Use the toggle on the left to enable or disable individual parameters without deleting them.
5. Parameters are appended to the URL automatically before the request is sent.

### Adding Custom Headers

1. Open the **Headers** tab.
2. Click **Add Header**.
3. Fill in the key and value, e.g. `Content-Type` / `application/json`.
4. Toggle individual headers on or off with the row checkbox.
5. Headers with empty keys or values are ignored.

### Setting the Request Body

1. Open the **Body** tab.
2. Choose a body type from the dropdown:
   - **JSON** — free-form text area with a **Format** button that pretty-prints valid JSON in place.
   - **Text** — raw plain-text body, no transformation.
   - **Form-Data** — text area for form-data key=value pairs (note: this is a text representation, not multipart encoding).
3. For JSON, pick a quick-start template from the **Template** dropdown (User Object, Array of Items, Nested Object).
4. Body is only sent for methods other than GET; it is omitted for GET requests.

---

## Authentication

Open the **Auth** tab to configure authentication. The auth config is added to the request headers (or query string for API Key) automatically — no need to set it manually in the Headers tab.

### Bearer Token

1. Select the **Bearer Token** tab inside Auth.
2. Paste your token in the input field.
3. The header `Authorization: Bearer <token>` is added to every request while the token field is non-empty.

**Tip:** When navigating from the **JWT Decoder** tool, the decoded token is pre-filled here automatically.

### Basic Auth

1. Select the **Basic Auth** tab inside Auth.
2. Enter the username and password.
3. The header `Authorization: Basic <base64(username:password)>` is computed and added automatically.
4. Both fields must be non-empty for auth to take effect.

**Tip:** When navigating from the **Base64 Converter** with a `username:password` encoded string, it is decoded and pre-filled here.

### API Key

1. Select the **API Key** tab inside Auth.
2. Enter the API key value. The header name defaults to `X-API-Key` and placement defaults to **header**.
3. To add the key as a query string parameter instead, change the **Placement** selector to **query**.

---

## Inspecting the Response

After a request completes, the response panel shows four pieces of information:

| Field   | Description                                                                    |
| ------- | ------------------------------------------------------------------------------ |
| Status  | HTTP status code and text, e.g. `200 OK`                                       |
| Time    | Round-trip time from request start to full body read, in milliseconds          |
| Size    | Response body size in bytes                                                    |
| Body    | Raw body text; if the content is valid JSON it can be copied as formatted JSON |
| Headers | All response headers as key-value pairs                                        |

Switch between **Body**, **Headers**, and **Metadata** tabs in the response panel.

---

## Request History

Every request — successful or failed — is saved to history automatically.

| Property        | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Storage backend | `localStorage` (key: `api-tester-history`)                                         |
| Maximum entries | 20 (oldest entries are dropped when the limit is reached)                          |
| Persistence     | Survives page reloads and app restarts; tied to the browser/webview profile        |
| Restore         | Click a history entry to reload the method, URL, and body into the request builder |
| Delete one      | Click the delete icon on an individual history row                                 |
| Clear all       | Click **Clear history** in the history panel header                                |

The history panel is collapsed by default. Click its header to expand it.

---

## Keyboard Shortcuts

| Shortcut                   | Action                                                |
| -------------------------- | ----------------------------------------------------- |
| `Cmd+Enter` / `Ctrl+Enter` | Send the current request                              |
| `Escape`                   | Cancel an in-flight request                           |
| `Cmd+L` / `Ctrl+L`         | Clear the form (URL, headers, body, params, response) |

---

## Common Issues

### CORS Errors

Dev Utils Hub runs inside a **Tauri** native window backed by WKWebView (macOS) or WebView2 (Windows). The OS webview enforces standard CORS policies, so requests to APIs that do not return `Access-Control-Allow-Origin` headers will fail with a CORS error.

**Workarounds:**

- Use a CORS proxy in front of the target API during development.
- Run a local server that adds the required headers.
- Test against APIs that explicitly allow cross-origin requests.

The app does not bypass or suppress CORS — there is no `webSecurity: false` equivalent configured in `tauri.conf.json`.

### SSL / Self-Signed Certificates

Tauri's webview uses the OS trust store. Self-signed certificates that are not installed in the system keychain will be rejected. Install the certificate in your system keychain (macOS: Keychain Access) and trust it for SSL.

### Request Timeout

The default request timeout is **30 seconds** (30,000ms). If the server does not respond within this window, the request is aborted and a timeout error is shown with a suggestion to check the endpoint or increase the timeout.

The timeout value is part of the `RequestConfig` type (`timeout: number` in ms). It is not currently exposed in the UI — you cannot change it without modifying the source.

### Request Cancellation

Click the **Cancel** button (appears in place of Send while loading) or press `Escape`. The underlying `AbortController` is signaled and the request is dropped. Cancelled requests are not saved to history.

### Validation Errors

The URL is validated with a 300ms debounce. JSON bodies are validated when you click **Format**. If either field shows a red error, the **Send** button is disabled until the error is resolved.

---

## Cross-Tool Integration

Other tools in the suite can hand off data directly to API Tester via router state:

| Source tool      | Data passed                                               |
| ---------------- | --------------------------------------------------------- |
| JWT Decoder      | Bearer token pre-filled in Auth tab                       |
| Base64 Converter | Basic Auth credentials decoded and pre-filled in Auth tab |
| JSON Formatter   | Formatted JSON pre-filled in the Body tab                 |
| Any tool         | URL pre-filled if provided in router state                |

Navigate back to the source tool and use its "Send to API Tester" action to trigger this handoff.

---

## Planned Improvements

The following capabilities are not yet implemented:

- **Environment variables** — template placeholders like `{{BASE_URL}}` with per-environment overrides
- **Collections / workspaces** — save named request sets and switch between them
- **GraphQL support** — dedicated body editor with introspection and variable support
- **Configurable timeout** — expose the timeout value as a UI input
- **Multipart form-data** — true `multipart/form-data` encoding with file attachment support
