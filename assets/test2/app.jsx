/* Kidelo — router aplikacji, tweak osi czasu, montaż */
(function () {
  "use strict";
  const { createElement: h, useState, useEffect } = React;
  const {
    Login, Onboarding, Trasa, Szkoly, Pieniadze, Lista, Profil,
    BenefitDetail, SchoolDetail, TaskDetail, Compare, BottomNav,
    Sklep,
    ToolsHub, WeekScreen, DueDateCalc, KickCounter, ContractionTimer,
    TestJournal, FeedingTracker, VaccineTracker, PhotoAlbum, Notes,
    MedsAssistant, ExamChecklist, PregnancyDiary,
    useTweaks, TweaksPanel, TweakSection,
  } = window;
  const K = window.KIDELO;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{ "stage": 4 }/*EDITMODE-END*/;

  function parseQuery() {
    const p = new URLSearchParams(location.search);
    return { screen: p.get("screen"), step: parseInt(p.get("step") || "0", 10) };
  }

  function initialState() {
    const { screen, step } = parseQuery();
    if (!screen || screen === "login") return { view: "login", tab: "trasa", stack: [], obStep: 0 };
    if (screen === "onboarding") return { view: "onboarding", tab: "trasa", stack: [], obStep: step || 0 };
    const tabs = ["trasa", "szkoly", "sklep", "pieniadze", "lista", "profil"];
    if (tabs.includes(screen)) return { view: "app", tab: screen, stack: [], obStep: 0 };
    // detale: benefit-XXX, school-XXX, task-usc, compare
    if (screen.startsWith("benefit-")) return { view: "app", tab: "pieniadze", stack: [{ type: "benefit", id: screen.slice(8) }], obStep: 0 };
    if (screen.startsWith("school-")) return { view: "app", tab: "szkoly", stack: [{ type: "school", id: screen.slice(7) }], obStep: 0 };
    if (screen === "task") return { view: "app", tab: "trasa", stack: [{ type: "task" }], obStep: 0 };
    if (screen === "compare") return { view: "app", tab: "szkoly", stack: [{ type: "compare", ids: ["bocian", "mamaville", "wellonline"] }], obStep: 0 };
    if (screen === "tools") return { view: "app", tab: "trasa", stack: [{ type: "toolshub" }], obStep: 0 };
    if (screen.startsWith("tool-")) return { view: "app", tab: "trasa", stack: [{ type: "toolshub" }, { type: "tool", id: screen.slice(5) }], obStep: 0 };
    return { view: "login", tab: "trasa", stack: [], obStep: 0 };
  }

  function App() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    const [st, setSt] = useState(initialState);
    const stageIdx = Math.max(0, Math.min(K.stages.length - 1, t.stage));

    const openRoute = (str) => {
      const [type, arg] = str.split(":");
      if (type === "benefit") setSt((s) => ({ ...s, stack: [...s.stack, { type: "benefit", id: arg }] }));
      else if (type === "school") setSt((s) => ({ ...s, stack: [...s.stack, { type: "school", id: arg }] }));
      else if (type === "task") setSt((s) => ({ ...s, stack: [...s.stack, { type: "task" }] }));
      else if (type === "toolshub") setSt((s) => ({ ...s, stack: [...s.stack, { type: "toolshub" }] }));
      else if (type === "tool") setSt((s) => ({ ...s, stack: [...s.stack, { type: "tool", id: arg }] }));
    };
    const openCompare = (ids) => setSt((s) => ({ ...s, stack: [...s.stack, { type: "compare", ids }] }));
    const back = () => setSt((s) => ({ ...s, stack: s.stack.slice(0, -1) }));
    const setTab = (tab) => setSt((s) => ({ ...s, tab, stack: [] }));

    let body;
    if (st.view === "login") {
      body = h(Login, { onLogin: () => setSt((s) => ({ ...s, view: "onboarding", obStep: 0 })) });
    } else if (st.view === "onboarding") {
      body = h(Onboarding, { startStep: st.obStep, onDone: () => setSt((s) => ({ ...s, view: "app", tab: "trasa", stack: [] })) });
    } else {
      const top = st.stack[st.stack.length - 1];
      if (top) {
        if (top.type === "benefit") body = h(BenefitDetail, { id: top.id, onBack: back });
        else if (top.type === "school") body = h(SchoolDetail, { id: top.id, onBack: back });
        else if (top.type === "task") body = h(TaskDetail, { onBack: back });
        else if (top.type === "compare") body = h(Compare, { ids: top.ids, onBack: back });
        else if (top.type === "toolshub") body = h(ToolsHub, { onOpen: openRoute, onBack: back });
        else if (top.type === "tool") {
          const TOOL = { week: WeekScreen, duedate: DueDateCalc, kick: KickCounter, contraction: ContractionTimer, tests: TestJournal, feeding: FeedingTracker, vaccine: VaccineTracker, album: PhotoAlbum, notes: Notes, meds: MedsAssistant, examcheck: ExamChecklist, diary: PregnancyDiary };
          const Comp = TOOL[top.id] || WeekScreen;
          body = h(Comp, { onBack: back });
        }
      } else {
        const tab = st.tab;
        if (tab === "trasa") body = h(Trasa, { idx: stageIdx, onOpen: openRoute, onTab: setTab, onTools: () => openRoute("toolshub:") });
        else if (tab === "szkoly") body = h(Szkoly, { onOpen: openRoute, onCompare: openCompare });
        else if (tab === "sklep") body = h(Sklep, null);
        else if (tab === "pieniadze") body = h(Pieniadze, { onOpen: openRoute });
        else if (tab === "lista") body = h(Lista, null);
        else if (tab === "profil") body = h(Profil, { onLogout: () => setSt((s) => ({ ...s, view: "login", stack: [] })) });
      }
    }

    const showNav = st.view === "app" && st.stack.length === 0;

    return h(
      "div", { className: "k-app" },
      h("div", { className: "k-app__body" + (showNav ? " k-app__body--nav" : "") }, body),
      showNav && h(BottomNav, { tab: st.tab, onTab: setTab }),
      h(TweaksPanel, null,
        h(TweakSection, { label: "Oś czasu" }),
        h(StageTweak, { idx: stageIdx, onChange: (v) => setTweak("stage", v) })
      )
    );
  }

  // Custom control — slider po etapach osi czasu z czytelną etykietą
  function StageTweak({ idx, onChange }) {
    const s = K.stages[idx];
    return h(
      "div", { style: { padding: "4px 2px 8px" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 } },
        h("span", { style: { fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink)" } }, s.band),
        h("span", { style: { fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-faint)" } }, (idx + 1) + "/" + K.stages.length)
      ),
      h("input", {
        type: "range", min: 0, max: K.stages.length - 1, step: 1, value: idx,
        onChange: (e) => onChange(parseInt(e.target.value, 10)),
        style: { width: "100%", accentColor: "var(--evergreen)" },
      }),
      h("div", { style: { fontSize: 12, color: "var(--ink-soft)", marginTop: 6 } }, s.kicker + " · " + s.sub)
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
