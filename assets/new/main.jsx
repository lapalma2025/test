/* Kidelo — ekrany główne: Trasa, Szkoły, Pieniądze, Lista, Profil */
(function () {
  "use strict";
  const { createElement: h, useState } = React;
  const {
    Icon, Btn, Chip, Kicker, SectionHead, Card, IconBadge, Toggle, Checkbox,
    Progress, Stars, Avatar, Field, cx,
  } = window;
  const K = window.KIDELO;

  /* ============ TRASA ============ */
  function PhaseStrip({ idx }) {
    return h(
      "div", { className: "k-phases" },
      K.stages.map((s, i) =>
        h("span", {
          key: s.id,
          className: cx("k-phases__seg", i === idx && "k-phases__seg--on", i < idx && "k-phases__seg--done"),
          title: s.band,
        })
      )
    );
  }

  function Trasa({ idx, onOpen, onTab, onTools }) {
    const st = K.stages[idx];
    return h(
      "div", { className: "k-screen k-trasa" },
      h("header", { className: "k-pagehead" },
        h("div", null,
          h("div", { className: "k-pagehead__hi" }, "Dzień dobry, " + K.profile.parent),
          h("div", { className: "k-pagehead__date" }, "wtorek, 9 czerwca")
        ),
        h("button", { className: "k-iconbtn" }, h(Icon, { name: "bell", size: 20 }), h("span", { className: "k-iconbtn__dot" }))
      ),

      h("div", { className: "k-trasa__lead" },
        h(Kicker, null, st.kicker),
        h("h1", { className: "k-trasa__big" }, st.big),
        h("p", { className: "k-trasa__sub" }, st.sub),
        h(PhaseStrip, { idx })
      ),

      // HERO — jedna akcja na teraz
      h("div", { className: "k-hero", onClick: () => onOpen(st.hero.link || "task:usc") },
        h("div", { className: "k-hero__row" },
          h("span", { className: "k-hero__kick" }, st.hero.urgent ? "pilne teraz" : "teraz"),
          st.hero.urgent && h("span", { className: "k-hero__clock" }, h(Icon, { name: "clock", size: 13 }), "termin blisko")
        ),
        h("h2", { className: "k-hero__t" }, st.hero.title),
        h("p", { className: "k-hero__note" }, st.hero.note),
        h("div", { className: "k-hero__cta" },
          h("span", null, st.hero.cta),
          h(Icon, { name: "arrow", size: 18 })
        )
      ),

      // Narzędzia — szybki dostęp
      h("div", { className: "k-toolstrip" },
        [
          { id: "week", icon: "baby", t: "Tydzień" },
          { id: "kick", icon: "foot", t: "Kopnięcia" },
          { id: "feeding", icon: "bottle", t: "Karmienie" },
          { id: "vaccine", icon: "syringe", t: "Szczepienia" },
          { id: "_more", icon: "grid", t: "Wszystkie" },
        ].map((it) =>
          h("button", { key: it.id, className: "k-toolstrip__i", onClick: () => it.id === "_more" ? onTools() : onOpen("tool:" + it.id) },
            h("span", { className: "k-toolstrip__ic" }, h(Icon, { name: it.icon, size: 21 })),
            h("span", { className: "k-toolstrip__t" }, it.t)
          )
        )
      ),

      // Następne 30 dni
      h(SectionHead, { title: "Następne 30 dni" }),
      h("div", { className: "k-stack" },
        st.next.map((c, i) =>
          h(Card, { key: i, tint: c.theme, onClick: () => onOpen(c.link || "task:usc"), className: "k-task" },
            h(IconBadge, { name: c.icon, theme: c.theme }),
            h("div", { className: "k-task__body" },
              h("div", { className: "k-task__t" }, c.title),
              h("div", { className: "k-task__n" }, c.note)
            ),
            h(Icon, { name: "chevron", size: 18, style: { color: "var(--ink-faint)" } })
          )
        )
      ),

      // Należy Ci się
      h("div", { className: "k-money", onClick: () => onTab("pieniadze") },
        h("div", { className: "k-money__top" },
          h(Kicker, null, "należy Ci się"),
          h(Icon, { name: "wallet", size: 18, style: { color: "var(--evergreen)" } })
        ),
        h("div", { className: "k-money__num" }, st.money.amount),
        h("div", { className: "k-money__cap" }, st.money.caption),
        h("div", { className: "k-money__link" }, "Zobacz świadczenia", h(Icon, { name: "arrow", size: 16 }))
      )
    );
  }

  /* ============ SZKOŁY ============ */
  function SchoolCard({ s, selected, onToggle, onOpen }) {
    return h(
      Card, { className: "k-school" },
      h("div", { className: "k-school__main", onClick: () => onOpen("school:" + s.id) },
        h("div", { className: "k-school__head" },
          h("div", null,
            h("div", { className: "k-school__name" }, s.name),
            h("div", { className: "k-school__meta" },
              h("span", { className: "k-tag k-tag--" + s.tag }, s.kind),
              h("span", { className: "k-school__area" }, h(Icon, { name: "pin", size: 13 }), s.area)
            )
          ),
          h("div", { className: "k-school__price" + (s.free ? " k-school__price--free" : "") }, s.price)
        ),
        h("div", { className: "k-school__foot" },
          h(Stars, { rating: s.rating, reviews: s.reviews }),
          h("span", { className: "k-school__sched" }, s.schedule)
        )
      ),
      h("button", { className: cx("k-cmp", selected && "k-cmp--on"), onClick: () => onToggle(s.id) },
        h(Checkbox, { checked: selected }),
        h("span", null, "Porównaj")
      )
    );
  }

  function Szkoly({ onOpen, onCompare }) {
    const [q, setQ] = useState("");
    const [f, setF] = useState("all"); // all | online | free
    const [sel, setSel] = useState([]);
    const toggle = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s);
    const list = K.schools.filter((s) => {
      if (f === "online" && !s.online) return false;
      if (f === "free" && !s.free) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    return h(
      "div", { className: "k-screen k-szkoly" },
      h("header", { className: "k-pagehead" },
        h("h1", { className: "k-pagetitle" }, "Szkoły i szpitale")
      ),
      h("div", { className: "k-searchbar" },
        h(Icon, { name: "search", size: 18, style: { color: "var(--ink-faint)" } }),
        h("input", { className: "k-searchinput", placeholder: "Szukaj szkoły lub szpitala", value: q, onChange: (e) => setQ(e.target.value) })
      ),
      h("div", { className: "k-chiprow" },
        h(Chip, { active: f === "all", onClick: () => setF("all") }, "Wszystkie"),
        h(Chip, { active: f === "online", onClick: () => setF("online"), icon: "globe" }, "Online"),
        h(Chip, { active: f === "free", onClick: () => setF("free") }, "Bezpłatne · NFZ"),
        h(Chip, { onClick: () => {} }, "Warszawa"),
        h(Chip, { onClick: () => {} }, "Język")
      ),
      h("div", { className: "k-stack k-szkoly__list" },
        list.length
          ? list.map((s) => h(SchoolCard, { key: s.id, s, selected: sel.includes(s.id), onToggle: toggle, onOpen }))
          : h("p", { className: "k-empty" }, "Brak wyników dla tego filtra.")
      ),
      sel.length >= 2 && h("div", { className: "k-cmpbar" },
        h(Btn, { variant: "primary", full: true, icon: "layers", onClick: () => onCompare(sel) }, "Porównaj (" + sel.length + ")")
      )
    );
  }

  /* ============ PIENIĄDZE ============ */
  const STATUS = {
    eligible: { label: "należy Ci się", cls: "sage" },
    action: { label: "do złożenia", cls: "clay" },
    active: { label: "w toku", cls: "ever" },
    future: { label: "wkrótce", cls: "muted" },
    na: { label: "nie dotyczy", cls: "faint" },
  };

  function BenefitRow({ b, onOpen }) {
    const st = STATUS[b.status];
    return h(
      Card, { className: "k-benefit", onClick: () => onOpen("benefit:" + b.id), tint: undefined },
      h("div", { className: "k-benefit__top" },
        h("div", { className: "k-benefit__name" }, b.name),
        h("span", { className: "k-pill k-pill--" + st.cls }, st.label)
      ),
      h("div", { className: "k-benefit__amt" },
        h("span", { className: "k-benefit__num" }, b.amount),
        h("span", { className: "k-benefit__unit" }, b.unit)
      ),
      h("div", { className: "k-benefit__meta" },
        h("span", null, h(Icon, { name: "pin", size: 13 }), b.where),
        h("span", null, h(Icon, { name: "clock", size: 13 }), b.deadline)
      )
    );
  }

  function Pieniadze({ onOpen }) {
    return h(
      "div", { className: "k-screen k-pieniadze" },
      h("header", { className: "k-pagehead" }, h("h1", { className: "k-pagetitle" }, "Pieniądze")),
      h("div", { className: "k-bignum" },
        h(Kicker, null, "należy Ci się w 1. roku Mai"),
        h("div", { className: "k-bignum__v" }, "10 600 zł"),
        h("p", { className: "k-bignum__basis" }, "na podstawie: umowa o pracę · 1 dziecko · woj. mazowieckie"),
        h("div", { className: "k-bignum__actions" },
          h(Btn, { variant: "light", icon: "phone" }, "Złóż przez mZUS"),
          h(Btn, { variant: "light", icon: "wallet" }, "Bankowość")
        )
      ),
      h(SectionHead, { title: "Twoje świadczenia" }),
      h("div", { className: "k-stack" },
        K.benefits.map((b) => h(BenefitRow, { key: b.id, b, onOpen }))
      )
    );
  }

  /* ============ LISTA ============ */
  function ChecklistCard({ list, open, onOpenToggle, onItem }) {
    const done = list.items.filter((i) => i.done).length;
    return h(
      Card, { className: cx("k-cl", !list.active && "k-cl--muted") },
      h("button", { className: "k-cl__head", onClick: onOpenToggle },
        h("div", { className: "k-cl__headtxt" },
          h("div", { className: "k-cl__t" }, list.title),
          h("div", { className: "k-cl__n" }, list.note)
        ),
        h("div", { className: "k-cl__right" },
          h("span", { className: "k-cl__count" }, done + "/" + list.items.length),
          h(Icon, { name: open ? "chevronDown" : "chevron", size: 18, style: { color: "var(--ink-faint)" } })
        )
      ),
      h(Progress, { value: done, max: list.items.length }),
      open && h("div", { className: "k-cl__items" },
        list.items.map((it, i) =>
          h("button", { key: i, className: cx("k-cli", it.done && "k-cli--done"), onClick: () => onItem(list.id, i) },
            h(Checkbox, { checked: it.done }),
            h("span", null, it.t)
          )
        )
      )
    );
  }

  function Lista() {
    const [data, setData] = useState(() => K.checklists.map((l) => ({ ...l, items: l.items.map((x) => ({ ...x })) })));
    const [open, setOpen] = useState({ usc: true });
    const onItem = (lid, idx) => setData((d) => d.map((l) => l.id !== lid ? l : { ...l, items: l.items.map((it, i) => i === idx ? { ...it, done: !it.done } : it) }));
    const active = data.filter((l) => l.active);
    const done = data.filter((l) => !l.active);
    return h(
      "div", { className: "k-screen k-lista" },
      h("header", { className: "k-pagehead" },
        h("div", null,
          h("h1", { className: "k-pagetitle" }, "Listy"),
          h("div", { className: "k-pagehead__date" }, "dla etapu: Dzień 8–30")
        )
      ),
      h("div", { className: "k-stack" },
        active.map((l) => h(ChecklistCard, { key: l.id, list: l, open: !!open[l.id], onOpenToggle: () => setOpen((o) => ({ ...o, [l.id]: !o[l.id] })), onItem }))
      ),
      done.length > 0 && h("div", { className: "k-lista__done" },
        h(SectionHead, { title: "Zakończone" }),
        h("div", { className: "k-stack" },
          done.map((l) => h(ChecklistCard, { key: l.id, list: l, open: !!open[l.id], onOpenToggle: () => setOpen((o) => ({ ...o, [l.id]: !o[l.id] })), onItem }))
        )
      )
    );
  }

  /* ============ PROFIL ============ */
  function Row({ icon, label, value, onClick, right }) {
    return h("button", { className: "k-prow", onClick },
      icon && h("span", { className: "k-prow__ic" }, h(Icon, { name: icon, size: 18 })),
      h("span", { className: "k-prow__l" }, label),
      right || (value && h("span", { className: "k-prow__v" }, value)),
      h(Icon, { name: "chevron", size: 16, style: { color: "var(--ink-faint)" } })
    );
  }

  function Profil({ onLogout }) {
    const [notif, setNotif] = useState({ terminy: true, swiadczenia: true, szczepienia: false });
    return h(
      "div", { className: "k-screen k-profil" },
      h("header", { className: "k-pagehead" }, h("h1", { className: "k-pagetitle" }, "Profil")),

      h("div", { className: "k-pcard k-pcard--me" },
        h(Avatar, { name: "Anna", size: 56, theme: "ever" }),
        h("div", { className: "k-pcard__txt" },
          h("div", { className: "k-pcard__name" }, "Anna Kowalska"),
          h("div", { className: "k-pcard__sub" }, "anna@kidelo.pl")
        ),
        h("button", { className: "k-pcard__edit" }, "Edytuj")
      ),

      h(SectionHead, { title: "Dziecko" }),
      h("div", { className: "k-pcard k-pcard--baby" },
        h("image-slot", { id: "kidelo-baby", shape: "circle", style: { width: "56px", height: "56px", flex: "none" }, placeholder: "+ zdjęcie" }),
        h("div", { className: "k-pcard__txt" },
          h("div", { className: "k-pcard__name" }, "Maja"),
          h("div", { className: "k-pcard__sub" }, "ur. 26 maja 2026 · 14 dni"),
          h("div", { className: "k-pcard__pesel" }, "PESEL — oczekuje na nadanie")
        )
      ),
      h(Row, { icon: "user", label: "Partner", value: "Marek" }),

      h(SectionHead, { title: "Twoje dane" }),
      h("div", { className: "k-group" },
        h(Row, { icon: "briefcase", label: "Forma zatrudnienia", value: "Umowa o pracę" }),
        h(Row, { icon: "pin", label: "Lokalizacja", value: "Warszawa" })
      ),

      h(SectionHead, { title: "Powiadomienia" }),
      h("div", { className: "k-group" },
        h("div", { className: "k-prow k-prow--toggle" },
          h("span", { className: "k-prow__ic" }, h(Icon, { name: "clock", size: 18 })),
          h("span", { className: "k-prow__l" }, "Terminy i deadline'y"),
          h(Toggle, { on: notif.terminy, onClick: () => setNotif((n) => ({ ...n, terminy: !n.terminy })) })
        ),
        h("div", { className: "k-prow k-prow--toggle" },
          h("span", { className: "k-prow__ic" }, h(Icon, { name: "wallet", size: 18 })),
          h("span", { className: "k-prow__l" }, "Nowe świadczenia"),
          h(Toggle, { on: notif.swiadczenia, onClick: () => setNotif((n) => ({ ...n, swiadczenia: !n.swiadczenia })) })
        ),
        h("div", { className: "k-prow k-prow--toggle" },
          h("span", { className: "k-prow__ic" }, h(Icon, { name: "stethoscope", size: 18 })),
          h("span", { className: "k-prow__l" }, "Szczepienia i bilanse"),
          h(Toggle, { on: notif.szczepienia, onClick: () => setNotif((n) => ({ ...n, szczepienia: !n.szczepienia })) })
        )
      ),

      h(SectionHead, { title: "Aplikacja" }),
      h("div", { className: "k-group" },
        h(Row, { icon: "info", label: "Pomoc i kontakt" }),
        h(Row, { icon: "shield", label: "Prywatność i dane" })
      ),
      h("button", { className: "k-logout", onClick: onLogout }, "Wyloguj się"),
      h("div", { className: "k-version" }, "Kidelo · wersja 1.0")
    );
  }

  Object.assign(window, { Trasa, Szkoly, Pieniadze, Lista, Profil });
})();
