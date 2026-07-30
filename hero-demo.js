(() => {
  const input = document.querySelector("[data-hero-input]");
  const preview = document.querySelector("[data-hero-preview]");
  const items = document.querySelector("[data-hero-items]");
  const replacementsPanel = document.querySelector('[data-hero-panel="replacements"]');
  const count = document.querySelector("[data-hero-count]");
  const tabs = [...document.querySelectorAll("[data-hero-tab]")];
  const example = document.querySelector("[data-hero-example]");
  const continueButton = document.querySelector("[data-hero-continue]");
  if (!input || !preview || !items || !replacementsPanel || !count || !example || !continueButton || tabs.length !== 3) return;

  let detections = [];
  let enabled = new Set();
  let previewTimer;
  let renderingPreview = false;
  const samples = {
    legal: "Draft a follow-up for plaintiff Jordan Ellis at 1824 Harbor View Road. Email jordan.ellis@example.com and reference case number CV-2026-10482.",
    tax: "Prepare a document request for client Marina Lopez. Her email is marina.lopez@example.com, SSN is 123-45-6789, and the business EIN is 12-3456789.",
    healthcare: "Summarize the follow-up plan for patient Avery Chen. Call (619) 555-0147 or email avery.chen@example.com regarding patient ID PT-20488.",
    financial: "Draft a review note for client Morgan Lee. Reference account number ADV-20488 and call (858) 555-0163 with the next steps.",
    blank: ""
  };

  const patterns = [
    { type: "EMAIL", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
    { type: "SSN", regex: /\b(?!000|666|9\d\d)\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g },
    { type: "EIN", regex: /\b\d{2}-\d{7}\b/g },
    { type: "PHONE", regex: /(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?!\d)/g },
    { type: "ADDRESS", regex: /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?(?:[A-Z0-9][A-Z0-9.'-]*\s+){1,5}(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Way|Parkway|Pkwy\.?|Highway|Hwy\.?)(?:\s+(?:Apt|Suite|Ste|Unit|#)\s*[A-Z0-9-]+)?(?:,?\s+[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)*,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)?/gi },
  ];

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  function addContextual(found, text, type, regex, valueIndex = 1) {
    for (const match of text.matchAll(regex)) {
      const value = match[valueIndex];
      if (!value) continue;
      const relative = match[0].indexOf(value);
      found.push({ type, value, start: match.index + relative, end: match.index + relative + value.length });
    }
  }

  function detect(text) {
    const found = [];
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern.regex)) {
        found.push({ type: pattern.type, value: match[0], start: match.index, end: match.index + match[0].length });
      }
    }
    addContextual(
      found,
      text,
      "PERSON",
      /\b(?:client|patient|plaintiff|defendant|claimant|employee|customer|spouse|wife|husband|partner|child|son|daughter|mother|father|parent|guardian|beneficiary|witness|attorney|counsel|doctor|physician|name(?:\s+is)?|on behalf of)\s*[:,-]?\s+([a-z][a-z'-]+(?:\s+(?:[a-z]\.|[a-z][a-z'-]+)){1,2}?)(?=\s+(?:lives?|resides?|works?|has|had|is|was|with|whose|email|phone|ssn|ein|dob|at|needs?|wants?|requests?|requested|reports?|reported|says?|said|saw|witnessed|called|contacted|signed|filed|owns?|received)\b|[,.;:\n]|$)/gi
    );
    addContextual(
      found,
      text,
      "ID",
      /\b(?:account|patient|claim|policy|case|matter|file)\s*(?:number|no\.?|ID|#)\s*(?:is|:)?\s*([A-Z0-9][A-Z0-9-]{4,})\b/gi
    );
    for (const match of text.matchAll(/\b(?!(?:Client|Patient|Plaintiff|Defendant|Claimant|Employee|Customer|Spouse|Wife|Husband|Partner|Child|Son|Daughter|Mother|Father|Parent|Guardian|Beneficiary|Witness|Attorney|Counsel|Doctor|Physician)\b)[A-Z][a-z]+(?:['-][A-Z]?[a-z]+)?(?:\s+(?:[A-Z]\.|[A-Z][a-z]+(?:['-][A-Z]?[a-z]+)?)){1,2}\b/g)) {
      if (/\b(?:PrivacyAI|ChatGPT|Claude|OpenAI)\b/.test(match[0])) continue;
      found.push({
        type:"ENTITY",
        value:match[0],
        start:match.index,
        end:match.index+match[0].length,
        suggested:true
      });
    }
    found.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const selected = [];
    for (const item of found) {
      if (!selected.some(existing => item.start < existing.end && item.end > existing.start)) selected.push(item);
    }
    return selected.map((item, index) => ({ ...item, id: `hero-${index}-${item.start}` }));
  }

  function redactedText() {
    const active = detections.filter(item => enabled.has(item.id));
    const counters = {};
    const stable = new Map();
    const map = {};
    let cursor = 0;
    let output = "";
    for (const item of active) {
      output += input.value.slice(cursor, item.start);
      const key = `${item.type}:${item.value.toLowerCase()}`;
      let token = stable.get(key);
      if (!token) {
        counters[item.type] = (counters[item.type] || 0) + 1;
        token = `[[${item.type}_${counters[item.type]}]]`;
        stable.set(key, token);
        map[token] = item.value;
      }
      output += token;
      cursor = item.end;
    }
    return { text: output + input.value.slice(cursor), map };
  }

  function renderPreview() {
    const result = redactedText();
    const counters = {};
    const stable = new Map();
    let cursor = 0;
    let html = "";
    for (const item of detections) {
      html += escapeHtml(input.value.slice(cursor,item.start));
      if (enabled.has(item.id)) {
        const key = `${item.type}:${item.value.toLowerCase()}`;
        let token = stable.get(key);
        if (!token) {
          counters[item.type] = (counters[item.type] || 0) + 1;
          token = `[[${item.type}_${counters[item.type]}]]`;
          stable.set(key,token);
        }
        html += `<mark contenteditable="false" tabindex="0" data-original="${escapeHtml(item.value)}">${token}</mark>`;
      } else if (item.suggested) {
        html += `<span class="hero-demo-suggestion" contenteditable="false" role="button" tabindex="0" data-hero-suggestion="${item.id}" title="Possible sensitive detail — click to protect">${escapeHtml(item.value)}</span>`;
      } else {
        html += escapeHtml(item.value);
      }
      cursor = item.end;
    }
    html += escapeHtml(input.value.slice(cursor));
    renderingPreview = true;
    preview.innerHTML = html;
    renderingPreview = false;
  }

  function renderItems() {
    items.innerHTML = detections.length
      ? detections.map(item => `
          <label class="hero-demo-item ${item.suggested ? "suggested" : ""}">
            <input type="checkbox" data-hero-id="${item.id}" ${enabled.has(item.id) ? "checked" : ""}>
            <span class="hero-demo-value">${escapeHtml(item.value)}</span>
            <span class="hero-demo-type">${item.suggested ? "POSSIBLE DETAIL" : item.type}</span>
          </label>`).join("")
      : '<span class="hero-demo-empty">No supported patterns detected yet.</span>';
  }

  function updateDetections() {
    const previous = new Map(detections.map(item => [
      `${item.type}:${item.value}:${item.start}`,
      enabled.has(item.id)
    ]));
    detections = detect(input.value);
    enabled = new Set(detections
      .filter(item => {
        const prior = previous.get(`${item.type}:${item.value}:${item.start}`);
        return prior === true || (!item.suggested && prior !== false);
      })
      .map(item => item.id));
    count.textContent = `${enabled.size} detail${enabled.size === 1 ? "" : "s"} protected`;
    renderItems();
  }

  function render() {
    updateDetections();
    renderPreview();
  }

  function readProtectedEditor() {
    const selection = window.getSelection();
    let text = "";
    let caret = 0;
    let foundCaret = false;

    function visit(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!foundCaret && selection && node === selection.anchorNode) {
          caret = text.length + selection.anchorOffset;
          foundCaret = true;
        }
        text += node.nodeValue || "";
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches && node.matches("mark[data-original]")) {
        const original = node.dataset.original || "";
        if (!foundCaret && selection && (node === selection.anchorNode || node.contains(selection.anchorNode))) {
          caret = text.length + original.length;
          foundCaret = true;
        }
        text += original;
        return;
      }
      if (node.tagName === "BR") {
        text += "\n";
        return;
      }
      [...node.childNodes].forEach(visit);
    }

    [...preview.childNodes].forEach(visit);
    if (!foundCaret) caret = text.length;
    return { text, caret };
  }

  function restoreProtectedCaret(rawOffset) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    let consumed = 0;
    let placed = false;

    function visit(node) {
      if (placed) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const length = (node.nodeValue || "").length;
        if (rawOffset <= consumed + length) {
          range.setStart(node, Math.max(0, rawOffset - consumed));
          placed = true;
          return;
        }
        consumed += length;
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches && node.matches("mark[data-original]")) {
        const length = (node.dataset.original || "").length;
        if (rawOffset <= consumed + length) {
          range.setStartAfter(node);
          placed = true;
        }
        consumed += length;
        return;
      }
      if (node.tagName === "BR") {
        consumed += 1;
        return;
      }
      [...node.childNodes].forEach(visit);
    }

    [...preview.childNodes].forEach(visit);
    if (!placed) range.selectNodeContents(preview), range.collapse(false);
    else range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  input.addEventListener("input", render);
  preview.addEventListener("input", () => {
    if (renderingPreview) return;
    const editor = readProtectedEditor();
    input.value = editor.text;
    updateDetections();
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      renderPreview();
      preview.focus();
      restoreProtectedCaret(editor.caret);
    }, 220);
  });
  function protectHeroSuggestion(target) {
    const id = target.dataset.heroSuggestion;
    if (!id) return;
    enabled.add(id);
    count.textContent = `${enabled.size} detail${enabled.size === 1 ? "" : "s"} protected`;
    renderItems();
    renderPreview();
  }
  preview.addEventListener("click", event => {
    const target = event.target.closest("[data-hero-suggestion]");
    if (target) protectHeroSuggestion(target);
  });
  preview.addEventListener("keydown", event => {
    const target = event.target.closest("[data-hero-suggestion]");
    if (target && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      protectHeroSuggestion(target);
    }
  });
  items.addEventListener("change", event => {
    if (!event.target.matches("[data-hero-id]")) return;
    event.target.checked
      ? enabled.add(event.target.dataset.heroId)
      : enabled.delete(event.target.dataset.heroId);
    count.textContent = `${enabled.size} detail${enabled.size === 1 ? "" : "s"} protected`;
    renderPreview();
  });
  tabs.forEach(tab => tab.addEventListener("click", () => {
    const selected = tab.dataset.heroTab;
    input.hidden = selected !== "original";
    preview.hidden = selected !== "protected";
    replacementsPanel.hidden = selected !== "replacements";
    tabs.forEach(item => item.setAttribute("aria-selected", String(item === tab)));
  }));
  example.addEventListener("change", () => {
    input.value = samples[example.value] || "";
    render();
    const targetTab = example.value === "blank" ? "original" : "protected";
    document.querySelector(`[data-hero-tab="${targetTab}"]`).click();
    if (targetTab === "original") input.focus();
  });
  continueButton.addEventListener("click", () => {
    try {
      sessionStorage.setItem("privacyai.demo.draft", input.value);
    } catch {
      // The full demo still opens safely if browser storage is unavailable.
    }
    window.location.href = "demo.html";
  });
  render();
})();
