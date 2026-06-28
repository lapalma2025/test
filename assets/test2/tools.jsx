/* Kidelo — Narzędzia (część 1): hub, tydzień ciąży, kalkulator, kopnięcia, skurcze */
(function () {
  "use strict";
  const { createElement: h, useState, useEffect, useRef } = React;
  const { Icon, Btn, TopBar, Card, IconBadge, cx, Kicker } = window;
  const T = window.KIDELO_TOOLS;

  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (s) => pad(Math.floor(s / 60)) + ":" + pad(s % 60);

  /* ============ HUB ZDROWIE ============ */
  // Każdy kafelek ma własny delikatny kolor (bg) + dopasowany odcień ikony (fg).
  const HEALTH = [
    { group: "W ciąży", items: [
      { id: "week",        icon: "baby",      bg: "#DEE8DD", fg: "#41614C", t: "Tydzień ciąży",      n: "rozwój i objawy" },
      { id: "duedate",     icon: "calendar",  bg: "#F6E1D2", fg: "#A65A3C", t: "Kalkulator terminu", n: "termin porodu" },
      { id: "kick",        icon: "foot",      bg: "#F2E8CC", fg: "#8A6E2E", t: "Licznik kopnięć",     n: "ruchy dziecka" },
      { id: "contraction", icon: "stopwatch", bg: "#F3DDDD", fg: "#A14C4E", t: "Timer skurczów",      n: "czas i odstępy" },
      { id: "tests",       icon: "flask",     bg: "#DCE5EA", fg: "#436673", t: "Wyniki badań",        n: "ocena normy" },
      { id: "examcheck",   icon: "clipboard", bg: "#E8E1ED", fg: "#6C5A80", t: "Badania",             n: "checklista" },
      { id: "album",       icon: "camera",    bg: "#EDE6D7", fg: "#7E6B4F", t: "Album brzuszka",      n: "zdjęcia tydzień po tygodniu" },
      { id: "diary",       icon: "journal",   bg: "#D8E7E1", fg: "#3D6B5D", t: "Dziennik ciąży",      n: "nastrój, waga, notatki" },
    ]},
    { group: "Po porodzie", items: [
      { id: "feeding", icon: "bottle",  bg: "#F4E0D3", fg: "#A65A3C", t: "Karmienie",   n: "timer i historia" },
      { id: "vaccine", icon: "syringe", bg: "#DDE9E2", fg: "#3E6A5E", t: "Szczepienia", n: "kalendarz GIS" },
      { id: "notes",   icon: "note",    bg: "#F1EAD0", fg: "#8A6E2E", t: "Notatki",     n: "pytania do lekarza" },
    ]},
  ];

  function ToolsHub({ onOpen, onBack }) {
    return h(
      "div", { className: "k-screen k-health" },
      h(TopBar, { title: "Zdrowie", onBack }),
      h("div", { className: "k-tools__intro" },
        h("h1", { className: "k-tools__h1" }, "Zdrowie"),
        h("p", { className: "k-tools__lead" }, "Wszystko, co pomaga Ci śledzić ciążę, zdrowie i pierwsze miesiące Mai.")
      ),

      // Asystent leków — wyróżniony kafelek
      h("button", { className: "k-medtile", onClick: () => onOpen("tool:meds") },
        h("span", { className: "k-medtile__deco", "aria-hidden": "true" }),
        h("span", { className: "k-medtile__ic" }, h(Icon, { name: "pill", size: 26, stroke: 1.7 })),
        h("span", { className: "k-medtile__body" },
          h("span", { className: "k-medtile__t" }, "Asystent leków"),
          h("span", { className: "k-medtile__n" }, "Leki i suplementy · następna dawka 13:00")
        ),
        h("span", { className: "k-medtile__chev" }, h(Icon, { name: "chevron", size: 20 }))
      ),

      HEALTH.map((g) =>
        h("section", { key: g.group, className: "k-tools__sec" },
          h("div", { className: "k-tools__seclabel" }, g.group),
          h("div", { className: "k-htgrid" },
            g.items.map((it) =>
              h("button", { key: it.id, className: "k-htile", style: { background: it.bg }, onClick: () => onOpen("tool:" + it.id) },
                h("span", { className: "k-htile__ic", style: { color: it.fg } }, h(Icon, { name: it.icon, size: 22, stroke: 1.7 })),
                h("span", { className: "k-htile__txt" },
                  h("span", { className: "k-htile__t" }, it.t),
                  h("span", { className: "k-htile__n", style: { color: it.fg } }, it.n)
                )
              )
            )
          )
        )
      )
    );
  }

  /* ============ TYDZIEŃ CIĄŻY ============ */
  function WeekScreen({ onBack }) {
    const [i, setI] = useState(T.defaultWeek);
    const wk = T.weeks[i];
    return h(
      "div", { className: "k-screen k-detail k-week" },
      h(TopBar, { title: "Tydzień ciąży", onBack }),
      h("div", { className: "k-week__picker" },
        T.weeks.map((w, idx) =>
          h("button", { key: w.w, className: cx("k-week__pill", idx === i && "k-week__pill--on"), onClick: () => setI(idx) }, w.w)
        )
      ),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-week__hero" },
          h("div", { className: "k-week__herotxt" },
            h(Kicker, null, "tydzień " + wk.w + " z 40"),
            h("div", { className: "k-week__fruit" }, wk.fruit),
            h("div", { className: "k-week__size" }, wk.len + " · " + wk.wt)
          ),
          h("div", { className: "k-week__fruiticon" }, h(Icon, { name: "drop", size: 60, stroke: 1.2 }))
        ),
        h(WBlock, { icon: "baby", theme: "sage", title: "Co robi dziecko", body: wk.baby }),
        h(WBlock, { icon: "heart", theme: "clay", title: "Co czujesz Ty", body: wk.mom }),
        h("div", { className: "k-week__tip" },
          h(Icon, { name: "sparkle", size: 18, style: { color: "var(--evergreen)", flex: "none" } }),
          h("div", null,
            h("div", { className: "k-week__tipl" }, "Wskazówka tygodnia"),
            h("div", { className: "k-week__tipb" }, wk.tip)
          )
        )
      )
    );
  }
  const WBlock = ({ icon, theme, title, body }) =>
    h("div", { className: "k-wblock" },
      h(IconBadge, { name: icon, theme, size: 40 }),
      h("div", null,
        h("div", { className: "k-wblock__t" }, title),
        h("div", { className: "k-wblock__b" }, body)
      )
    );

  /* ============ KALKULATOR TERMINU ============ */
  const MONTHS = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];
  function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function plDate(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }

  function DueDateCalc({ onBack }) {
    const [lmp, setLmp] = useState("2026-02-18");
    const valid = !!lmp;
    let due, weekNo, daysLeft, dayInWeek;
    if (valid) {
      const start = new Date(lmp + "T00:00:00");
      due = addDays(start, 280);
      const today = new Date("2026-06-14T00:00:00");
      const diff = Math.floor((today - start) / 86400000);
      weekNo = Math.floor(diff / 7);
      dayInWeek = diff % 7;
      daysLeft = Math.ceil((due - today) / 86400000);
    }
    const trimester = weekNo <= 13 ? "I trymestr" : weekNo <= 26 ? "II trymestr" : "III trymestr";
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: "Kalkulator terminu", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("p", { className: "k-detail__lead" }, "Podaj pierwszy dzień ostatniej miesiączki, a policzymy przewidywany termin porodu i Twój aktualny tydzień."),
        h("label", { className: "k-field" },
          h("span", { className: "k-field__l" }, "Pierwszy dzień ostatniej miesiączki"),
          h("input", { className: "k-input", type: "date", value: lmp, onChange: (e) => setLmp(e.target.value) })
        ),
        valid && weekNo >= 0 && weekNo <= 43 && h("div", { className: "k-due" },
          h("div", { className: "k-due__main" },
            h(Kicker, null, "przewidywany termin porodu"),
            h("div", { className: "k-due__date" }, plDate(due))
          ),
          h("div", { className: "k-due__stats" },
            h(DueStat, { v: weekNo + " tydz.", l: dayInWeek + ". dzień" }),
            h(DueStat, { v: trimester, l: "etap ciąży" }),
            h(DueStat, { v: daysLeft > 0 ? daysLeft : 0, l: "dni do terminu" })
          )
        ),
        valid && (weekNo < 0 || weekNo > 43) && h("p", { className: "k-empty" }, "Sprawdź datę — wynik wykracza poza zakres ciąży."),
        h("div", { className: "k-due__note" },
          h(Icon, { name: "info", size: 16, style: { color: "var(--ink-faint)", flex: "none" } }),
          h("span", null, "Wynik jest szacunkowy (reguła Naegelego, 280 dni). Termin potwierdzi lekarz na podstawie USG.")
        )
      )
    );
  }
  const DueStat = ({ v, l }) =>
    h("div", { className: "k-due__stat" },
      h("div", { className: "k-due__statv" }, v),
      h("div", { className: "k-due__statl" }, l)
    );

  /* ============ LICZNIK KOPNIĘĆ ============ */
  function KickCounter({ onBack }) {
    const [count, setCount] = useState(0);
    const [running, setRunning] = useState(false);
    const [sec, setSec] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
      if (running) { ref.current = setInterval(() => setSec((s) => s + 1), 1000); }
      return () => clearInterval(ref.current);
    }, [running]);
    const tap = () => {
      if (!running) setRunning(true);
      setCount((c) => Math.min(10, c + 1));
    };
    const reset = () => { setRunning(false); setCount(0); setSec(0); };
    const done = count >= 10;
    const history = [
      { d: "Dziś, 9:12", n: 10, t: "18 min" },
      { d: "Wczoraj, 21:40", n: 10, t: "24 min" },
      { d: "Wczoraj, 13:05", n: 10, t: "31 min" },
    ];
    return h(
      "div", { className: "k-screen k-detail k-kick" },
      h(TopBar, { title: "Licznik kopnięć", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("p", { className: "k-kick__hint" }, done ? "Świetnie — dziecko jest aktywne." : "Dotykaj koła przy każdym ruchu. Cel: 10 kopnięć."),
        h("button", { className: cx("k-kick__dial", running && "k-kick__dial--live", done && "k-kick__dial--done"), onClick: tap },
          h("span", { className: "k-kick__num" }, count),
          h("span", { className: "k-kick__of" }, "z 10 kopnięć"),
          h("span", { className: "k-kick__time" }, h(Icon, { name: "clock", size: 13 }), fmt(sec))
        ),
        h("div", { className: "k-kick__actions" },
          h(Btn, { variant: "light", icon: "minus", onClick: () => setCount((c) => Math.max(0, c - 1)) }, "Cofnij"),
          h(Btn, { variant: "light", icon: "cross", onClick: reset }, "Reset")
        ),
        h("div", { className: "k-sectionhead", style: { marginTop: 28 } }, h("h3", { className: "k-sectionhead__t" }, "Ostatnie sesje")),
        h("div", { className: "k-stack" },
          history.map((s, k) =>
            h("div", { key: k, className: "k-histrow" },
              h("span", { className: "k-histrow__ic" }, h(Icon, { name: "foot", size: 17 })),
              h("div", { className: "k-histrow__txt" }, h("div", { className: "k-histrow__t" }, s.n + " kopnięć"), h("div", { className: "k-histrow__d" }, s.d)),
              h("span", { className: "k-histrow__v" }, s.t)
            )
          )
        )
      )
    );
  }

  /* ============ TIMER SKURCZÓW ============ */
  function ContractionTimer({ onBack }) {
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [log, setLog] = useState([
      { dur: 52, gap: 312, time: "21:58" },
      { dur: 47, gap: 348, time: "21:52" },
      { dur: 44, gap: 372, time: "21:46" },
    ]);
    const startRef = useRef(0);
    const lastRef = useRef(Date.now() - 312000);
    const tRef = useRef(null);
    useEffect(() => {
      if (running) {
        startRef.current = Date.now();
        tRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 250);
      }
      return () => clearInterval(tRef.current);
    }, [running]);
    const toggle = () => {
      if (!running) { setRunning(true); setElapsed(0); }
      else {
        setRunning(false);
        const now = Date.now();
        const gap = Math.floor((startRef.current - lastRef.current) / 1000);
        lastRef.current = startRef.current;
        const d = new Date();
        setLog((l) => [{ dur: Math.max(1, Math.floor((now - startRef.current) / 1000)), gap, time: pad(d.getHours()) + ":" + pad(d.getMinutes()) }, ...l]);
        setElapsed(0);
      }
    };
    const avgGap = log.length ? Math.round(log.slice(0, 3).reduce((s, x) => s + x.gap, 0) / Math.min(3, log.length)) : 0;
    const near = avgGap > 0 && avgGap <= 300;
    return h(
      "div", { className: "k-screen k-detail k-contr" },
      h(TopBar, { title: "Timer skurczów", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-contr__stats" },
          h(DueStat, { v: fmt(avgGap), l: "śr. odstęp" }),
          h(DueStat, { v: log.length ? fmt(log[0].dur) : "—", l: "ostatni skurcz" }),
          h(DueStat, { v: log.length, l: "skurczów" })
        ),
        h("button", { className: cx("k-contr__btn", running && "k-contr__btn--live"), onClick: toggle },
          h(Icon, { name: running ? "pause" : "play", size: 26 }),
          h("span", null, running ? fmt(elapsed) : "Start skurczu"),
          h("span", { className: "k-contr__btnsub" }, running ? "trwa — dotknij, by zakończyć" : "dotknij, gdy zacznie się skurcz")
        ),
        near && h("div", { className: "k-contr__alert" },
          h(Icon, { name: "info", size: 17, style: { flex: "none" } }),
          h("span", null, h("strong", null, "Skurcze co ~5 min."), " Jeśli utrzymują się regularnie przez godzinę — przygotuj się do wyjazdu do szpitala.")
        ),
        h("div", { className: "k-sectionhead", style: { marginTop: 24 } }, h("h3", { className: "k-sectionhead__t" }, "Historia")),
        h("div", { className: "k-contr__log" },
          h("div", { className: "k-contr__loghead" }, h("span", null, "godzina"), h("span", null, "czas trwania"), h("span", null, "odstęp")),
          log.map((c, k) =>
            h("div", { key: k, className: "k-contr__logrow" },
              h("span", { className: "k-contr__lt" }, c.time),
              h("span", null, fmt(c.dur)),
              h("span", { className: "k-contr__lg" }, fmt(c.gap))
            )
          )
        )
      )
    );
  }

  Object.assign(window, { ToolsHub, WeekScreen, DueDateCalc, KickCounter, ContractionTimer });
})();
