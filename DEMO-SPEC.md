# PrivacyAI Public Demo Specification

## Purpose

The public demo proves the core flow without exposing original identifying content:

1. Detect and tokenize sensitive information in the browser.
2. Let the visitor review or uncheck proposed replacements.
3. Send only the tokenized prompt through the company-controlled API account.
4. Restore approved values locally in the returned answer.

The homepage hero provides a compact, no-send demonstration in one fixed-size workspace:

- **Protected** is the default live view, is directly editable, and re-runs protection shortly after the visitor types.
- Hovering or focusing a protected token immediately reveals its fictional value, without an extra label, in a high-contrast custom tooltip.
- **Type your own** exposes the editable request and replaces the need for a separate Original tab.
- **Replacements** provides optional checkboxes without adding a separate visible section.
- A persistent example selector loads Legal, Tax & Accounting, Healthcare, Financial Advisory, or a blank request.
- On desktop, the card uses connected comparison tabs, a taller product-workspace treatment, and a clearly labeled fictional AI-response example.
- **See full interactive demo** transfers the draft to `/demo` through browser-only session storage; it is not placed in a URL, and the homepage card itself does not call the model.

The full `/demo` page provides the AI response workflow and expanded review experience.

## Secure workspace preview

`/workspace` is a fictional, interactive product preview that demonstrates the intended
post-request experience without storing real records. It includes:

- a client/matter activity view with user/seat, provider/model, timestamp, and protection status;
- expandable metadata-first activity records;
- thread and document views;
- a firmwide administrator view; and
- clear labeling that only OpenAI is connected in the live public demo while additional providers
  are planned product options.

Returned values restored in the browser are visually highlighted, but the highlighting is
presentation-only and does not alter copied response text.

If automatic detection misses something, the visitor can highlight up to 200 characters in the request and protect it manually:

- **Protect every exact match** is enabled by default.
- The visitor can instead protect only the selected instance.
- **Remember locally for future requests** stores the exact phrase in browser storage and applies it case-insensitively to later requests.
- Manually added and remembered rules appear in **Review replacements** and can be removed there.
- The demo does not generate or accept arbitrary regular expressions. Broader user-authored patterns require validation and a match preview before they can be added safely.

“Every occurrence” applies only to the current request. Remembering a phrase creates a browser-local exact-match rule that is also applied to later requests on that device.

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
- Contextual name detection includes customers and case roles as well as common family, professional, witness, guardian, and beneficiary relationships.
- Street-address detection includes an optional city, state, and ZIP portion with or without a comma between the street and city.
- A future on-device entity model may add names, organizations, locations, and contextual identifiers after a short debounce.
- High-confidence detections are protected by default.
- Lower-confidence capitalized-phrase suggestions appear with an amber dotted highlight and a neutral **Possible detail** label.
- Clicking an amber suggestion immediately protects it and turns it into the standard black token.
- Possible-detail suggestions are not treated as confirmed identifiers until the visitor clicks them or checks them in **Review replacements**. Once protected, they use a neutral `ENTITY` token rather than claiming the phrase is a person.
- Role words such as client, patient, witness, spouse, and attorney cannot begin a possible-detail suggestion; contextual high-confidence name matches take precedence.
- Routine sending should not require a separate blocking approval screen.
