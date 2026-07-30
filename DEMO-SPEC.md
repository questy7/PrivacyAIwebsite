# PrivacyAI Public Demo Specification

## Purpose

The public demo proves the core flow without exposing original identifying content:

1. Detect and tokenize sensitive information in the browser.
2. Let the visitor review or uncheck proposed replacements.
3. Send only the tokenized prompt through the company-controlled API account.
4. Restore approved values locally in the returned answer.

The homepage hero provides a compact, no-send demonstration in one fixed-size workspace:

- **Protected** is the default live view and updates as the visitor types.
- Hovering a protected token reveals its original fictional value.
- **Type your own** exposes the editable request and replaces the need for a separate Original tab.
- **Replacements** provides optional checkboxes without adding a separate visible section.
- A persistent example selector loads Legal, Tax & Accounting, Healthcare, Financial Advisory, or a blank request.
- **Continue** transfers the current draft to `/demo` through browser-only session storage; it is not placed in a URL or sent to the backend.

The full `/demo` page provides the AI response workflow and expanded review experience.

If automatic detection misses something, the visitor can highlight up to 200 characters in the request and protect it manually:

- **Protect every exact match** is enabled by default.
- The visitor can instead protect only the selected instance.
- **Remember locally for future requests** stores the exact phrase in browser storage and applies it case-insensitively to later requests.
- Manually added and remembered rules appear in **Review replacements** and can be removed there.
- The demo does not generate or accept arbitrary regular expressions. Broader user-authored patterns require validation and a match preview before they can be added safely.

## Usage controls

Local detection, typing, review, and tokenization are unlimited because they do not call a paid model.

Only an explicit **Send redacted request** action may call the model. Initial public-demo controls:

- 3–5 successful AI responses per visitor per rolling 24 hours.
- Short cooldown between requests.
- Maximum input length: 6,000 characters.
- Maximum model output: 700 tokens.
- Combine IP-based and browser-based identifiers; do not rely on either alone.
- Store the durable counter server-side so limits apply across Vercel function instances.
- Apply bot protection or a challenge when traffic appears automated.
- Configure provider/project spending limits and alerts.
- Do not publish the exact abuse thresholds in customer-facing copy.

When the allowance is exhausted, show:

> You’ve reached today’s demo limit. Join early access or book a call to continue.

## Privacy and logging

- Never send the original prompt or the local replacement map to the backend.
- Do not log prompt or response content in the API function.
- Set provider requests to `store: false` where supported.
- A future local audit history may retain the original prompt, detected replacements, user decisions, exact tokenized prompt, tokenized response, locally restored response, timestamp, model, and provider.
- Local history containing identifiable content must be encrypted on the device.

## Detection layers

- Structured regex detection runs instantly as the visitor types.
- A future on-device entity model may add names, organizations, locations, and contextual identifiers after a short debounce.
- High-confidence detections are protected by default.
- Lower-confidence model suggestions remain visible and protected by default but are labeled for review.
- Routine sending should not require a separate blocking approval screen.
