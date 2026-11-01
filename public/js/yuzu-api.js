/*
 * Yuzu API client for the live site (yuzutalent.com).
 * Trimmed from yuzu-concepts/shared/yuzu-api.js: the live site only submits
 * enquiries, to the Cloudflare Pages Function at /api/enquiries. Unlike the
 * concept version it never pretends a failed send worked; the visitor is told
 * to email us instead.
 */
(function (root) {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const FALLBACK = "We couldn't send that just now. Please email lanson@yuzutalent.com and we'll get back to you.";

  function validateEnquiry(p) {
    const errors = {};
    if (!p.name || p.name.trim().length < 2) errors.name = "Tell us your name.";
    if (!p.email || !EMAIL_RE.test(p.email)) errors.email = "That email doesn't look right.";
    if (!["brand", "creator", "press"].includes(p.type)) errors.type = "Pick who you are.";
    if (!p.message || p.message.trim().length < 10) errors.message = "A little more detail, please (10+ characters).";
    return errors;
  }

  root.YuzuAPI = {
    /** Resolves {ok, id?, message?, errors?}. Never throws. */
    async submitEnquiry(payload) {
      const errors = validateEnquiry(payload);
      if (Object.keys(errors).length) return { ok: false, errors };
      try {
        const res = await fetch("/api/enquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const body = await res.json().catch(() => null);
        if (body && typeof body.ok === "boolean") return body;
      } catch (_) { /* network error: fall through */ }
      return { ok: false, errors: { form: FALLBACK } };
    }
  };
})(typeof self !== "undefined" ? self : this);
