/* Kidelo — Zdrowie (część 3): Asystent leków, Badania (checklista), Dziennik ciąży */
(function () {
  "use strict";
  const { createElement: h, useState } = React;
  const { Icon, Btn, TopBar, cx, Kicker, Checkbox, Progress } = window;

  /* ============ ASYSTENT LEKÓW ============ */
  const MEDS0 = [
    { id: "m1", name: "Kwas foliowy", dose: "0,4 mg", slot: "Rano", time: "8:00", taken: true, safe: true },
    { id: "m2", name: "Witamina D", dose: "2000 IU", slot: "Rano", time: "8:00", taken: true, safe: true },
    { id: "m3", name: "Żelazo (Tardyferon)", dose: "80 mg", slot: "Przed obiadem", time: "13:00", taken: false, safe: true, next: true },
    { id: "m4", name: "Magnez + B6", dose: "1 tabletka", slot: "Wieczór", time: "21:00", taken: false, safe: true },
    { id: "m5", name: "DHA Omega-3", dose: "500 mg", slot: "Wieczór", time: "21:00", taken: false, safe: true },
  ];

  function MedsAssistant({ onBack }) {
    const [meds, setMeds] = useState(MEDS0);
    const toggle = (id) => setMeds((m) => m.map((x) => x.id === id ? { ...x, taken: !x.taken } : x));
    const taken = meds.filter((m) => m.taken).length;
    // grupuj po porze dnia
    const slots = [];
    meds.forEach((m) => {
      let s = slots.find((x) => x.slot === m.slot);
      if (!s) { s = { slot: m.slot, time: m.time, items: [] }; slots.push(s); }
      s.items.push(m);
    });
    return h(
      "div", { className: "k-screen k-detail k-meds" },
      h(TopBar, { title: "Asystent leków", onBack, right: h("button", { className: "k-topbar__back" }, h(Icon, { name: "plus", size: 20 })) }),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-meds__hero" },
          h("div", { className: "k-meds__heroring" },
            h("div", { className: "k-meds__heronum" }, taken + "/" + meds.length)
          ),
          h("div", null,
            h("div", { className: "k-meds__herot" }, taken === meds.length ? "Wszystko na dziś" : "Dzisiejsze dawki"),
            h("div", { className: "k-meds__heron" }, taken === meds.length ? "Świetnie — komplet przyjęty." : (meds.length - taken) + " do przyjęcia · następna 13:00")
          )
        ),
        slots.map((s) =>
          h("section", { key: s.slot, className: "k-meds__slot" },
            h("div", { className: "k-meds__slothead" },
              h("span", { className: "k-meds__slott" }, s.slot),
              h("span", { className: "k-meds__slottime" }, s.time)
            ),
            h("div", { className: "k-stack" },
              s.items.map((m) =>
                h("div", { key: m.id, className: cx("k-med", m.taken && "k-med--taken") },
                  h("span", { className: "k-med__ic" }, h(Icon, { name: "pill", size: 19 })),
                  h("div", { className: "k-med__body" },
                    h("div", { className: "k-med__name" }, m.name),
                    h("div", { className: "k-med__meta" },
                      h("span", { className: "k-med__dose" }, m.dose),
                      m.safe && h("span", { className: "k-med__safe" }, h(Icon, { name: "shield", size: 12 }), "bezpieczny w ciąży")
                    )
                  ),
                  h(Checkbox, { checked: m.taken, onClick: () => toggle(m.id) })
                )
              )
            )
          )
        ),
        h("div", { className: "k-meds__note" },
          h(Icon, { name: "info", size: 16, style: { flex: "none", color: "var(--ink-faint)" } }),
          h("span", null, "Przed zmianą dawkowania skonsultuj się z lekarzem lub farmaceutą. Kidelo nie zastępuje porady medycznej.")
        )
      )
    );
  }

  /* ============ BADANIA — CHECKLISTA ============ */
  const EXAMS = [
    { tri: "I trymestr", note: "do 13. tygodnia", items: [
      { t: "Morfologia krwi", done: true }, { t: "Grupa krwi i Rh", done: true },
      { t: "Glukoza na czczo", done: true }, { t: "Badanie ogólne moczu", done: true },
      { t: "USG (11.–14. tydzień)", done: true }, { t: "Test PAPP-A", done: true },
      { t: "Cytologia", done: false }, { t: "HIV, HBs, WR", done: false },
    ]},
    { tri: "II trymestr", note: "14.–26. tydzień", items: [
      { t: "Morfologia krwi", done: true }, { t: "USG połówkowe (18.–22. tc.)", done: true },
      { t: "Test obciążenia glukozą (OGTT)", done: false }, { t: "Badanie ogólne moczu", done: false },
      { t: "Przeciwciała odpornościowe", done: false },
    ]},
    { tri: "III trymestr", note: "od 27. tygodnia", items: [
      { t: "Morfologia krwi", done: false }, { t: "Posiew GBS (35.–37. tc.)", done: false },
      { t: "USG (kontrolne)", done: false }, { t: "KTG", done: false }, { t: "Badanie ogólne moczu", done: false },
    ]},
  ];

  function ExamChecklist({ onBack }) {
    const [data, setData] = useState(() => EXAMS.map((g) => ({ ...g, items: g.items.map((x) => ({ ...x })) })));
    const [open, setOpen] = useState({ "I trymestr": true, "II trymestr": true });
    const toggle = (gi, ii) => setData((d) => d.map((g, x) => x !== gi ? g : { ...g, items: g.items.map((it, y) => y === ii ? { ...it, done: !it.done } : it) }));
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: "Badania", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("p", { className: "k-detail__lead" }, "Zalecane badania w ciąży według trymestru. Odhaczaj, gdy je wykonasz."),
        data.map((g, gi) => {
          const done = g.items.filter((i) => i.done).length;
          const isOpen = !!open[g.tri];
          return h("div", { key: g.tri, className: "k-exam" },
            h("button", { className: "k-exam__head", onClick: () => setOpen((o) => ({ ...o, [g.tri]: !o[g.tri] })) },
              h("div", null,
                h("div", { className: "k-exam__tri" }, g.tri),
                h("div", { className: "k-exam__note" }, g.note)
              ),
              h("div", { className: "k-exam__right" },
                h("span", { className: "k-exam__count" }, done + "/" + g.items.length),
                h(Icon, { name: isOpen ? "chevronDown" : "chevron", size: 18, style: { color: "var(--ink-faint)" } })
              )
            ),
            h(Progress, { value: done, max: g.items.length }),
            isOpen && h("div", { className: "k-exam__items" },
              g.items.map((it, ii) =>
                h("button", { key: ii, className: cx("k-cli", it.done && "k-cli--done"), onClick: () => toggle(gi, ii) },
                  h(Checkbox, { checked: it.done }),
                  h("span", null, it.t)
                )
              )
            )
          );
        })
      )
    );
  }

  /* ============ DZIENNIK CIĄŻY ============ */
  const MOODS = [
    { id: "great", t: "Świetnie", c: "#DEE8DD", fg: "#41614C" },
    { id: "good", t: "Dobrze", c: "#F2E8CC", fg: "#8A6E2E" },
    { id: "soso", t: "Tak sobie", c: "#F4E0D3", fg: "#A65A3C" },
    { id: "tired", t: "Zmęczona", c: "#F3DDDD", fg: "#A14C4E" },
  ];
  const moodOf = (id) => MOODS.find((m) => m.id === id) || MOODS[0];

  const ENTRIES = [
    { id: "e1", date: "14 czerwca", week: "24 tc.", mood: "great", weight: "+6,2 kg",
      body: "Pierwsze naprawdę wyraźne kopnięcia! Marek też w końcu poczuł. Cały wieczór się uśmiechałam." },
    { id: "e2", date: "11 czerwca", week: "23 tc.", mood: "tired", weight: "+5,9 kg",
      body: "Ciężka noc, plecy dawały o sobie znać. Pomogła ciepła poduszka i krótki spacer rano." },
    { id: "e3", date: "6 czerwca", week: "23 tc.", mood: "good", weight: "+5,6 kg",
      body: "Wizyta u ginekologa — wszystko w normie. Zapisałam pytania o suplementację żelaza." },
  ];

  function PregnancyDiary({ onBack }) {
    const [sel, setSel] = useState("great");
    return h(
      "div", { className: "k-screen k-detail k-diary" },
      h(TopBar, { title: "Dziennik ciąży", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-diary__new" },
          h("div", { className: "k-diary__q" }, "Jak się dziś czujesz?"),
          h("div", { className: "k-diary__moods" },
            MOODS.map((m) =>
              h("button", { key: m.id, className: cx("k-moodbtn", sel === m.id && "k-moodbtn--on"),
                style: { background: m.c, color: m.fg, borderColor: sel === m.id ? m.fg : "transparent" },
                onClick: () => setSel(m.id) },
                m.t
              )
            )
          ),
          h("button", { className: "k-diary__addbtn" }, h(Icon, { name: "pencil", size: 16 }), "Zapisz wpis")
        ),
        h("div", { className: "k-sectionhead", style: { marginTop: 6 } }, h("h3", { className: "k-sectionhead__t" }, "Wcześniejsze wpisy")),
        h("div", { className: "k-diary__feed" },
          ENTRIES.map((e) => {
            const m = moodOf(e.mood);
            return h("div", { key: e.id, className: "k-dentry" },
              h("div", { className: "k-dentry__top" },
                h("div", { className: "k-dentry__date" }, e.date, h("span", { className: "k-dentry__wk" }, e.week)),
                h("span", { className: "k-dentry__mood", style: { background: m.c, color: m.fg } }, m.t)
              ),
              h("p", { className: "k-dentry__body" }, e.body),
              h("div", { className: "k-dentry__foot" }, h(Icon, { name: "activity", size: 13 }), "waga " + e.weight)
            );
          })
        )
      )
    );
  }

  Object.assign(window, { MedsAssistant, ExamChecklist, PregnancyDiary });
})();
