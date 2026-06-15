# Interactive Mock REST API Playground 🌐

A serverless sandbox built entirely on the client-side using JavaScript state to help aspiring backend developers understand and test REST API concepts.

## 🌟 Features

1. **Route Builder**: Define custom endpoint paths (e.g., `/api/v1/data`), select standard request methods (GET, POST, PUT, DELETE), and customize the mock JSON response body you wish to return.
2. **Interactive Client Console**: A built-in "Postman-lite" interface allowing you to send requests to your configured routes. Input specific paths, toggle methods, pass in custom headers, and write JSON payload bodies.
3. **Response Viewer**: A dynamic rendering panel that displays the simulated output. It parses the returned JSON, shows headers, and generates colored status badges (e.g. Green for `200 OK`, Yellow for `400 Bad Request`, Red for `401 Unauthorized` or `500 Internal Server Error`).
4. **Token Authentication Simulation**: Routes marked as secure will automatically enforce a bearer token authorization check.

## 🚀 Usage

1. **Build a Route**: Open the playground and use the **Route Builder** on the left to add a new route. Example: `GET` to `/api/users`. Define the JSON response it should yield.
2. **Make a Request**: Use the **Client Console** to target `/api/users` with a `GET` request.
3. **Analyze the Response**: Hit **Send Request** and observe the HTTP Status code, response headers, latency, and returned JSON body rendered in the **Response Viewer**.
4. **Test Validation**: Try sending malformed JSON to a `POST` route to trigger a simulated `400 Bad Request`!
