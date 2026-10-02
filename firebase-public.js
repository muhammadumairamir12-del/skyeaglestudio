/**
 * Public-site Firebase forms: contact queries + reviews (Realtime Database).
 * Paths match admin panel: queries, reviews_pending, reviews_approved.
 */
import { db, ref, push, onValue } from "./firebase-rtdb.js";

const RATE_LIMIT_MS = 30000;
const RATE_KEYS = {
  contact: "ses_last_contact_submit",
  review: "ses_last_review_submit"
};

function $(id) {
  return document.getElementById(id);
}

function isRateLimited(key) {
  try {
    const last = Number(sessionStorage.getItem(key) || 0);
    return last && Date.now() - last < RATE_LIMIT_MS;
  } catch (_) {
    return false;
  }
}

function markSubmitted(key) {
  try {
    sessionStorage.setItem(key, String(Date.now()));
  } catch (_) { /* ignore */ }
}

function isHoneypotFilled(form) {
  const hp = form.querySelector('input[name="website_url"], input.hp-field');
  return !!(hp && String(hp.value || "").trim());
}

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFormStatus(el, type, text) {
  if (!el) return;
  el.textContent = text;
  el.className = "form-status-alert " + (type || "");
  el.setAttribute("role", "alert");
  el.style.display = text ? "block" : "none";
  if (type === "success") {
    el.style.color = "#15803d";
    el.style.background = "rgba(21, 128, 61, 0.12)";
    el.style.border = "1px solid rgba(21, 128, 61, 0.35)";
  } else if (type === "error") {
    el.style.color = "#ff6b6b";
    el.style.background = "rgba(255, 80, 80, 0.1)";
    el.style.border = "1px solid rgba(255, 80, 80, 0.3)";
  } else {
    el.style.color = "";
    el.style.background = "";
    el.style.border = "";
  }
  el.style.padding = text ? "12px 14px" : "";
  el.style.borderRadius = "8px";
  el.style.marginBottom = text ? "16px" : "";
  el.style.fontSize = "0.9rem";
  el.style.lineHeight = "1.5";
  if (text) {
    try { el.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (_) { /* ignore */ }
  }
}

function ensureStatusBox(form) {
  let box = form.parentElement && form.parentElement.querySelector(".form-status-alert");
  if (!box) {
    box = document.createElement("div");
    box.className = "form-status-alert";
    box.style.display = "none";
    form.parentElement.insertBefore(box, form);
  }
  return box;
}

function ensureHoneypot(form) {
  if (form.querySelector('input[name="website_url"]')) return;
  const wrap = document.createElement("div");
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.cssText = "position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;";
  const input = document.createElement("input");
  input.type = "text";
  input.name = "website_url";
  input.className = "hp-field";
  input.tabIndex = -1;
  input.autocomplete = "off";
  wrap.appendChild(input);
  form.appendChild(wrap);
}

function getSubmitButton(form) {
  return form.querySelector('button[type="submit"]');
}

function setSubmitting(btn, busy) {
  if (!btn) return;
  if (busy) {
    btn.dataset.prevLabel = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.style.pointerEvents = "none";
    const span = btn.querySelector("span");
    if (span) span.textContent = "Sending…";
    else btn.textContent = "Sending…";
  } else {
    btn.disabled = false;
    btn.style.opacity = "";
    btn.style.pointerEvents = "";
    if (btn.dataset.prevLabel) {
      btn.innerHTML = btn.dataset.prevLabel;
      delete btn.dataset.prevLabel;
    }
  }
}

function friendlyFirebaseError(err) {
  const code = (err && (err.code || err.message)) || "";
  console.error("Firebase form error:", code, err);
  if (/PERMISSION_DENIED|permission-denied/i.test(String(code))) {
    return "Inquiry could not be saved (permission denied). Please try WhatsApp or email while we fix database rules.";
  }
  if (/unavailable|network|Failed to fetch|offline/i.test(String(code))) {
    return "Network error — please check your connection and try again.";
  }
  return "Sorry, we could not send your inquiry. Please try again or use WhatsApp.";
}

/* ---------- Contact form → RTDB path "queries" ---------- */
function initContactForm() {
  const form = $("contactForm");
  if (!form || form.dataset.rtdbBound === "true") return;
  form.dataset.rtdbBound = "true";
  ensureHoneypot(form);
  const status = ensureStatusBox(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const name = ($("formName") && $("formName").value || "").trim();
    const email = ($("formEmail") && $("formEmail").value || "").trim();
    const phone = ($("formPhone") && $("formPhone").value || "").trim();
    const company = ($("formCompany") && $("formCompany").value || "").trim();
    const service = ($("formProjectType") && $("formProjectType").value || "").trim();
    const budget = ($("formBudget") && $("formBudget").value || "").trim();
    const details = ($("formDescription") && $("formDescription").value || "").trim();
    const btn = getSubmitButton(form);

    setFormStatus(status, "", "");

    if (isHoneypotFilled(form)) {
      setFormStatus(status, "success", "Inquiry sent! We will contact you soon.");
      form.reset();
      return;
    }

    // Explicit validation with UI feedback (not silent HTML5-only)
    if (!name) {
      setFormStatus(status, "error", "Please enter your full name.");
      return;
    }
    if (!email || !isValidEmail(email)) {
      setFormStatus(status, "error", "Please enter a valid email address.");
      return;
    }
    if (!phone) {
      setFormStatus(status, "error", "Please enter your WhatsApp / phone number.");
      return;
    }
    if (!service) {
      setFormStatus(status, "error", "Please select a project type.");
      return;
    }
    if (!budget) {
      setFormStatus(status, "error", "Please select a budget range.");
      return;
    }
    if (!details) {
      setFormStatus(status, "error", "Please describe your project details & scope.");
      return;
    }
    if (isRateLimited(RATE_KEYS.contact)) {
      setFormStatus(status, "error", "Please wait a few seconds before sending another inquiry.");
      return;
    }

    const messageParts = [];
    if (company) messageParts.push("Company: " + company);
    if (budget) messageParts.push("Budget: " + budget);
    messageParts.push(details);
    const message = messageParts.join("\n");

    // Shape required by database.rules.json public create on /queries/$id
    const payload = {
      name,
      email,
      phone,
      message,
      read: false,
      createdAt: Date.now(),
      service
    };

    setSubmitting(btn, true);
    try {
      const result = await push(ref(db, "queries"), payload);
      console.log("Contact inquiry saved to RTDB queries/", result && result.key);
      markSubmitted(RATE_KEYS.contact);
      setFormStatus(status, "success", "Inquiry sent! We will contact you soon.");
      form.reset();
      ensureHoneypot(form);
    } catch (err) {
      setFormStatus(status, "error", friendlyFirebaseError(err));
    } finally {
      setSubmitting(btn, false);
    }
  }, true);
}

/* ---------- Review form → reviews_pending ---------- */
function initReviewForm() {
  const form = $("clientReviewForm");
  if (!form || form.dataset.rtdbBound === "true") return;
  form.dataset.rtdbBound = "true";
  ensureHoneypot(form);
  const status = $("formAlertBox") || ensureStatusBox(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const name = ($("reviewName") && $("reviewName").value || "").trim();
    const rating = parseInt(($("reviewRatingInput") && $("reviewRatingInput").value) || "0", 10);
    const message = ($("reviewText") && $("reviewText").value || "").trim();
    const btn = getSubmitButton(form);

    setFormStatus(status, "", "");

    if (isHoneypotFilled(form)) {
      setFormStatus(status, "success", "Thank you! Your review has been submitted and will appear on the website after approval.");
      form.reset();
      return;
    }

    if (!name || !message) {
      setFormStatus(status, "error", "Please enter your name and review message.");
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setFormStatus(status, "error", "Please select a star rating from 1 to 5.");
      return;
    }
    if (isRateLimited(RATE_KEYS.review)) {
      setFormStatus(status, "error", "Please wait a few seconds before submitting another review.");
      return;
    }

    setSubmitting(btn, true);
    try {
      await push(ref(db, "reviews_pending"), {
        name,
        rating,
        message,
        createdAt: Date.now()
      });
      markSubmitted(RATE_KEYS.review);
      setFormStatus(status, "success", "Thank you! Your review has been submitted and will appear on the website after approval.");
      form.reset();
      ensureHoneypot(form);
      const ratingInput = $("reviewRatingInput");
      if (ratingInput) ratingInput.value = "5";
      document.querySelectorAll("#starsSelector .fa-star").forEach((s) => s.classList.add("active"));
      const section = $("submitReviewFormSection");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      setFormStatus(status, "error", friendlyFirebaseError(err));
    } finally {
      setSubmitting(btn, false);
    }
  }, true);
}

/* ---------- Approved reviews display ---------- */
function starsText(rating) {
  const n = Math.min(5, Math.max(0, Number(rating) || 0));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function renderReviewCard(container, review, options) {
  options = options || {};
  const card = document.createElement("div");
  card.className = options.home ? "review-card tilt-3d" : "review-card";
  if (options.home) {
    card.style.cssText = "background:rgba(10,10,10,0.4); border:1px solid #1a1a1a; border-radius:10px; padding:25px; text-align:left;";
  }

  const name = String(review.name || "Client");
  const message = String(review.message || review.review || "");
  const rating = Number(review.rating) || 0;
  const initial = name.charAt(0).toUpperCase();

  const header = document.createElement("div");
  header.className = "review-card-header";
  if (options.home) {
    header.style.cssText = "display:flex; gap:12px; align-items:center; margin-bottom:15px;";
  }

  const avatar = document.createElement("div");
  avatar.className = "reviewer-avatar";
  avatar.textContent = initial;
  if (options.home) {
    avatar.style.cssText = "width:40px; height:40px; border-radius:50%; background:var(--primary); color:#000; display:flex; align-items:center; justify-content:center; font-family:var(--font-heading); font-weight:700; font-size:1rem;";
  }

  const info = document.createElement("div");
  info.className = "reviewer-info";
  const h3 = document.createElement("h3");
  h3.textContent = name;
  if (options.home) {
    h3.style.cssText = "font-family:var(--font-heading); font-size:0.95rem; color:#fff; margin:0;";
  }
  info.appendChild(h3);

  header.appendChild(avatar);
  header.appendChild(info);
  card.appendChild(header);

  const ratingRow = document.createElement("div");
  ratingRow.className = "review-rating-row";
  if (options.home) ratingRow.style.cssText = "margin-bottom:12px;";
  const stars = document.createElement("div");
  stars.className = "card-stars";
  stars.textContent = starsText(rating);
  stars.style.color = "#ffd700";
  stars.style.letterSpacing = "2px";
  ratingRow.appendChild(stars);
  card.appendChild(ratingRow);

  const body = document.createElement("div");
  body.className = "review-card-body";
  const p = document.createElement("p");
  p.textContent = message ? '"' + message + '"' : "";
  if (options.home) {
    p.style.cssText = "color:#aaa; font-size:0.85rem; line-height:1.5; margin:0; min-height:60px;";
  }
  body.appendChild(p);
  card.appendChild(body);

  container.appendChild(card);
}

function emptyState(container, text) {
  const empty = document.createElement("div");
  empty.className = "no-leads-placeholder";
  empty.style.cssText = "text-align:center; grid-column:1/-1; padding:20px 0; color:#555; font-size:0.9rem;";
  empty.textContent = text;
  container.appendChild(empty);
}

function rowsFromSnapshot(val) {
  return Object.entries(val || {})
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function initApprovedReviewsList() {
  const wrapper = $("reviewsWrapper");
  if (!wrapper || wrapper.dataset.rtdbBound === "true") return;
  wrapper.dataset.rtdbBound = "true";

  const avgEl = $("avgRatingVal");
  const totalEl = $("totalReviewsVal");
  const starsEl = $("avgRatingStars");
  let cached = [];

  function paint(list) {
    cached = list;
    wrapper.textContent = "";

    if (!list.length) {
      emptyState(wrapper, "No reviews yet. Be the first to share your experience below!");
      if (totalEl) totalEl.textContent = "0";
      if (avgEl) avgEl.textContent = "0.0";
      if (starsEl) starsEl.textContent = "☆☆☆☆☆";
      return;
    }

    if (totalEl) totalEl.textContent = String(list.length);
    if (avgEl) {
      const avg = list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / list.length;
      avgEl.textContent = avg.toFixed(1);
      if (starsEl) starsEl.textContent = starsText(Math.round(avg));
    }

    const sortSelect = $("reviewSortSelect");
    const rule = sortSelect ? sortSelect.value : "newest";
    let sorted = list.slice();
    if (rule === "highest") sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.createdAt || 0) - (a.createdAt || 0));
    else if (rule === "lowest") sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0) || (b.createdAt || 0) - (a.createdAt || 0));
    else sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    sorted.forEach((r) => renderReviewCard(wrapper, r, { home: false }));
  }

  onValue(ref(db, "reviews_approved"), (snap) => {
    paint(rowsFromSnapshot(snap.val()));
  }, (err) => {
    console.error("Approved reviews load failed:", err && err.code, err);
    wrapper.textContent = "";
    emptyState(wrapper, "Reviews could not be loaded right now.");
  });

  const sortSelect = $("reviewSortSelect");
  if (sortSelect && !sortSelect.dataset.rtdbBound) {
    sortSelect.dataset.rtdbBound = "true";
    sortSelect.addEventListener("change", () => paint(cached));
  }
}

function initHomeReviews() {
  const home = $("homeReviewsWrapper");
  if (!home || home.dataset.rtdbBound === "true") return;
  home.dataset.rtdbBound = "true";

  onValue(ref(db, "reviews_approved"), (snap) => {
    const list = rowsFromSnapshot(snap.val()).slice(0, 3);
    home.textContent = "";
    if (!list.length) {
      emptyState(home, "No approved reviews yet. Be the first to share your feedback!");
      return;
    }
    list.forEach((r) => renderReviewCard(home, r, { home: true }));
  }, (err) => {
    console.error("Home reviews load failed:", err && err.code, err);
    home.textContent = "";
    emptyState(home, "Reviews could not be loaded right now.");
  });
}

function boot() {
  initContactForm();
  initReviewForm();
  initApprovedReviewsList();
  initHomeReviews();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

// Prevent the legacy WhatsApp/Firestore contact handler in script.js from also running
window.__SKY_RTDB_FORMS__ = true;
