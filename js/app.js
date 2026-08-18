(() => {
  "use strict";

  const STORAGE_KEY = "ar_audit_responses";
  const MIN_RESPONSES = 5;
  const SCALE_MIN = 1;
  const SCALE_MAX = 5;
  const SCALE_LABELS = {
    1: "Pas du tout d'accord",
    2: "Plutôt pas d'accord",
    3: "Neutre",
    4: "Plutôt d'accord",
    5: "Tout à fait d'accord",
  };

  const THEMES = [
    {
      id: "respect",
      title: "Respect et courtoisie",
      desc: "Je suis traité·e avec respect et courtoisie par mes collègues et ma hiérarchie.",
    },
    {
      id: "communication",
      title: "Communication",
      desc: "Les décisions et informations importantes me sont communiquées clairement.",
    },
    {
      id: "charge",
      title: "Charge de travail",
      desc: "Ma charge de travail est raisonnable et compatible avec mon équilibre de vie.",
    },
    {
      id: "reconnaissance",
      title: "Reconnaissance",
      desc: "Mon travail est reconnu à sa juste valeur.",
    },
    {
      id: "securite",
      title: "Sécurité psychologique",
      desc: "Je me sens libre d'exprimer mon avis ou mes préoccupations sans crainte de représailles.",
    },
  ];

  // ---------- Anonymous session token ----------
  // Generated client-side only, held in memory for this tab. Nothing that
  // could identify the respondent (name, e-mail, IP) is ever collected.
  function generateToken() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  let sessionToken = generateToken();

  // ---------- Storage ----------
  function loadResponses() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveResponse(entry) {
    const responses = loadResponses();
    responses.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  }

  function clearResponses() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---------- Employee view ----------
  const tokenEl = document.getElementById("session-token");
  const introCard = document.getElementById("employee-intro");
  const formCard = document.getElementById("employee-form");
  const confirmCard = document.getElementById("employee-confirm");
  const questionList = document.getElementById("question-list");

  tokenEl.textContent = sessionToken;

  THEMES.forEach((theme, index) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "question";

    const legend = document.createElement("legend");
    legend.className = "question__legend";
    legend.textContent = `${index + 1}. ${theme.title}`;
    fieldset.appendChild(legend);

    const desc = document.createElement("p");
    desc.className = "question__desc";
    desc.textContent = theme.desc;
    fieldset.appendChild(desc);

    const scale = document.createElement("div");
    scale.className = "scale";
    for (let value = SCALE_MIN; value <= SCALE_MAX; value++) {
      const wrap = document.createElement("div");
      wrap.className = "scale__option";

      const id = `${theme.id}-${value}`;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = theme.id;
      input.value = String(value);
      input.id = id;
      input.required = true;

      const label = document.createElement("label");
      label.setAttribute("for", id);
      label.innerHTML = `<strong>${value}</strong><span>${SCALE_LABELS[value]}</span>`;

      wrap.appendChild(input);
      wrap.appendChild(label);
      scale.appendChild(wrap);
    }
    fieldset.appendChild(scale);
    questionList.appendChild(fieldset);
  });

  document.getElementById("start-questionnaire").addEventListener("click", () => {
    introCard.hidden = true;
    formCard.hidden = false;
  });

  document.getElementById("employee-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const ratings = {};
    for (const theme of THEMES) {
      const checked = document.querySelector(`input[name="${theme.id}"]:checked`);
      if (!checked) {
        checked?.focus();
        return;
      }
      ratings[theme.id] = Number(checked.value);
    }
    const comment = document.getElementById("comment").value.trim();

    saveResponse({
      token: sessionToken,
      ratings,
      comment: comment || null,
      date: new Date().toISOString().slice(0, 10), // day-level precision only
    });

    formCard.hidden = true;
    confirmCard.hidden = false;
    renderAuditorView();
  });

  document.getElementById("restart-questionnaire").addEventListener("click", () => {
    sessionToken = generateToken();
    tokenEl.textContent = sessionToken;
    document.getElementById("employee-form").reset();
    confirmCard.hidden = true;
    introCard.hidden = false;
  });

  // ---------- View switching ----------
  const tabEmployee = document.getElementById("tab-employee");
  const tabAuditor = document.getElementById("tab-auditor");
  const viewEmployee = document.getElementById("view-employee");
  const viewAuditor = document.getElementById("view-auditor");

  function switchView(target) {
    const showAuditor = target === "auditor";
    viewEmployee.hidden = showAuditor;
    viewAuditor.hidden = !showAuditor;
    tabEmployee.classList.toggle("is-active", !showAuditor);
    tabAuditor.classList.toggle("is-active", showAuditor);
    tabEmployee.setAttribute("aria-selected", String(!showAuditor));
    tabAuditor.setAttribute("aria-selected", String(showAuditor));
    if (showAuditor) renderAuditorView();
  }

  tabEmployee.addEventListener("click", () => switchView("employee"));
  tabAuditor.addEventListener("click", () => switchView("auditor"));

  // ---------- Auditor view ----------
  const lockedCard = document.getElementById("auditor-locked");
  const dashboard = document.getElementById("auditor-dashboard");
  const lockedCount = document.getElementById("locked-count");
  const progressFill = document.getElementById("progress-fill");

  function aggregate(responses) {
    return THEMES.map((theme) => {
      const values = responses.map((r) => r.ratings[theme.id]).filter((v) => typeof v === "number");
      const n = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = n ? sum / n : 0;
      const distribution = [1, 2, 3, 4, 5].map((v) => values.filter((x) => x === v).length);
      return { theme, avg, n, distribution };
    });
  }

  function renderChart(stats) {
    const svg = document.getElementById("chart-svg");
    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 640 260");

    const marginLeft = 150;
    const marginRight = 50;
    const marginTop = 10;
    const rowHeight = 44;
    const barThickness = 20;
    const chartWidth = 640 - marginLeft - marginRight;
    const scaleMax = 5;

    const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
    titleEl.id = "chart-title";
    titleEl.textContent = "Score moyen par thématique, sur une échelle de 1 à 5";
    svg.appendChild(titleEl);

    const svgNS = "http://www.w3.org/2000/svg";

    // Gridlines at 1..5
    for (let v = 1; v <= scaleMax; v++) {
      const x = marginLeft + (v / scaleMax) * chartWidth;
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", x);
      line.setAttribute("x2", x);
      line.setAttribute("y1", marginTop);
      line.setAttribute("y2", marginTop + stats.length * rowHeight);
      line.setAttribute("class", "grid-line");
      svg.appendChild(line);

      const tick = document.createElementNS(svgNS, "text");
      tick.setAttribute("x", x);
      tick.setAttribute("y", marginTop + stats.length * rowHeight + 16);
      tick.setAttribute("text-anchor", "middle");
      tick.setAttribute("class", "tick-label");
      tick.textContent = String(v);
      svg.appendChild(tick);
    }

    // Baseline axis at 0
    const axis = document.createElementNS(svgNS, "line");
    axis.setAttribute("x1", marginLeft);
    axis.setAttribute("x2", marginLeft);
    axis.setAttribute("y1", marginTop);
    axis.setAttribute("y2", marginTop + stats.length * rowHeight);
    axis.setAttribute("class", "axis-line");
    svg.appendChild(axis);

    const tooltip = document.getElementById("chart-tooltip") || createTooltip();

    stats.forEach((s, i) => {
      const y = marginTop + i * rowHeight;
      const barY = y + rowHeight / 2 - barThickness / 2;
      const barWidth = Math.max((s.avg / scaleMax) * chartWidth, 0);

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", marginLeft - 12);
      label.setAttribute("y", y + rowHeight / 2 + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("class", "bar-label");
      label.textContent = s.theme.title;
      svg.appendChild(label);

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", marginLeft);
      rect.setAttribute("y", barY);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", barThickness);
      rect.setAttribute("rx", 4);
      rect.setAttribute("class", "bar-fill");
      rect.setAttribute("tabindex", "0");
      rect.setAttribute("role", "img");
      rect.setAttribute(
        "aria-label",
        `${s.theme.title} : moyenne ${s.avg.toFixed(1)} sur 5, ${s.n} réponses`
      );

      const showTip = (evt) => {
        tooltip.querySelector(".tt-value").textContent = `${s.avg.toFixed(1)} / 5`;
        tooltip.querySelector(".tt-label").textContent = s.theme.title;
        tooltip.classList.add("is-visible");
        const rootRect = document.getElementById("chart-root").getBoundingClientRect();
        const px = evt.clientX !== undefined
          ? evt.clientX - rootRect.left
          : (marginLeft + barWidth) * (rootRect.width / 640);
        const py = (barY) * (rootRect.height / 260);
        tooltip.style.left = `${px}px`;
        tooltip.style.top = `${py}px`;
      };
      const hideTip = () => tooltip.classList.remove("is-visible");

      rect.addEventListener("pointermove", showTip);
      rect.addEventListener("pointerenter", showTip);
      rect.addEventListener("pointerleave", hideTip);
      rect.addEventListener("focus", showTip);
      rect.addEventListener("blur", hideTip);

      svg.appendChild(rect);

      const value = document.createElementNS(svgNS, "text");
      value.setAttribute("x", marginLeft + barWidth + 8);
      value.setAttribute("y", y + rowHeight / 2 + 4);
      value.setAttribute("class", "bar-value");
      value.textContent = s.n ? s.avg.toFixed(1) : "–";
      svg.appendChild(value);
    });

    svg.setAttribute("height", marginTop + stats.length * rowHeight + 28);
  }

  function createTooltip() {
    const tooltip = document.createElement("div");
    tooltip.id = "chart-tooltip";
    tooltip.className = "bar-tooltip";
    tooltip.innerHTML = `<span class="tt-label"></span>: <strong class="tt-value"></strong>`;
    document.getElementById("chart-root").appendChild(tooltip);
    return tooltip;
  }

  function renderTable(stats) {
    const tbody = document.getElementById("results-table-body");
    tbody.innerHTML = "";
    stats.forEach((s) => {
      const tr = document.createElement("tr");

      const tdTheme = document.createElement("td");
      tdTheme.textContent = s.theme.title;

      const tdAvg = document.createElement("td");
      tdAvg.className = "num";
      tdAvg.textContent = s.n ? s.avg.toFixed(2) : "–";

      const tdN = document.createElement("td");
      tdN.className = "num";
      tdN.textContent = String(s.n);

      const tdDist = document.createElement("td");
      tdDist.className = "num";
      tdDist.textContent = s.distribution.join(" / ");

      tr.append(tdTheme, tdAvg, tdN, tdDist);
      tbody.appendChild(tr);
    });
  }

  function exportCsv(stats, totalResponses, globalScore) {
    const rows = [
      ["Thématique", "Moyenne", "Réponses", "Répartition 1", "Répartition 2", "Répartition 3", "Répartition 4", "Répartition 5"],
    ];
    stats.forEach((s) => {
      rows.push([
        s.theme.title,
        s.n ? s.avg.toFixed(2) : "",
        String(s.n),
        ...s.distribution.map(String),
      ]);
    });
    rows.push([]);
    rows.push(["Score global", globalScore.toFixed(2)]);
    rows.push(["Réponses collectées", String(totalResponses)]);

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-respect-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function renderAuditorView() {
    const responses = loadResponses();
    const count = responses.length;

    lockedCount.textContent = `${Math.min(count, MIN_RESPONSES)} / ${MIN_RESPONSES} réponses collectées`;
    progressFill.style.width = `${Math.min(count / MIN_RESPONSES, 1) * 100}%`;

    const unlocked = count >= MIN_RESPONSES;
    lockedCard.hidden = unlocked;
    dashboard.hidden = !unlocked;
    if (!unlocked) return;

    const stats = aggregate(responses);
    const allAverages = stats.filter((s) => s.n > 0).map((s) => s.avg);
    const globalScore = allAverages.length
      ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length
      : 0;

    document.getElementById("stat-global-score").textContent = `${globalScore.toFixed(1)} / 5`;
    document.getElementById("stat-response-count").textContent = String(count);

    renderChart(stats);
    renderTable(stats);

    document.getElementById("export-csv").onclick = () => exportCsv(stats, count, globalScore);
  }

  document.getElementById("reset-demo").addEventListener("click", () => {
    if (confirm("Effacer toutes les réponses de démonstration enregistrées dans ce navigateur ?")) {
      clearResponses();
      renderAuditorView();
    }
  });

  // Keep the auditor dashboard live when responses arrive from other tabs.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && !viewAuditor.hidden) {
      renderAuditorView();
    }
  });

  renderAuditorView();

  // ---------- Scroll-reveal for marketing sections ----------
  const revealEls = document.querySelectorAll(".reveal");
  const revealAll = () => revealEls.forEach((el) => el.classList.add("is-visible"));

  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // Safety net: content must never stay invisible if the observer never
    // fires (e.g. full-page screenshot/print tools that render without a
    // real scroll). Force it in after a short delay regardless.
    window.addEventListener("load", () => setTimeout(revealAll, 2000));
    window.addEventListener("beforeprint", revealAll);
  } else {
    revealAll();
  }
})();
