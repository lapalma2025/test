/* Kidelo — ekrany szczegółów: świadczenie, szkoła, zadanie, porównywarka */
(function () {
  "use strict";
  const { createElement: h, useState } = React;
  const { Icon, Btn, TopBar, Stars, Card, cx } = window;
  const K = window.KIDELO;

  const STATUS = {
    eligible: { label: "należy Ci się", cls: "sage" },
    action: { label: "do złożenia", cls: "clay" },
    active: { label: "w toku", cls: "ever" },
    future: { label: "wkrótce", cls: "muted" },
    na: { label: "nie dotyczy", cls: "faint" },
  };

  /* ---- ŚWIADCZENIE ---- */
  function BenefitDetail({ id, onBack }) {
    const b = K.benefits.find((x) => x.id === id) || K.benefits[0];
    const st = STATUS[b.status];
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: "Świadczenie", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("span", { className: "k-pill k-pill--" + st.cls }, st.label),
        h("h1", { className: "k-detail__title" }, b.name),
        h("p", { className: "k-detail__lead" }, b.summary),
        h("div", { className: "k-detail__amtbox" },
          h("div", { className: "k-detail__amt" }, b.amount),
          h("div", { className: "k-detail__amtunit" }, b.unit)
        ),
        h("div", { className: "k-infogrid" },
          h(InfoCell, { icon: "pin", k: "Gdzie złożyć", v: b.where }),
          h(InfoCell, { icon: "clock", k: "Termin", v: b.deadline })
        ),
        h(Block, { title: "Kto może dostać" }, h("p", { className: "k-detail__p" }, b.criteria)),
        h(Block, { title: "Jak złożyć krok po kroku" },
          h("ol", { className: "k-steps" },
            b.steps.map((s, i) => h("li", { key: i, className: "k-steps__i" },
              h("span", { className: "k-steps__n" }, i + 1),
              h("span", null, s)
            ))
          )
        )
      ),
      h("div", { className: "k-detail__foot" },
        b.status === "na"
          ? h(Btn, { variant: "light", full: true }, "Nie dotyczy Twojej sytuacji")
          : h(Btn, { variant: "primary", full: true, icon: "phone", iconRight: "arrow" },
              "Złóż przez " + b.channel)
      )
    );
  }

  const InfoCell = ({ icon, k, v }) =>
    h("div", { className: "k-infocell" },
      h("span", { className: "k-infocell__ic" }, h(Icon, { name: icon, size: 16 })),
      h("div", null,
        h("div", { className: "k-infocell__k" }, k),
        h("div", { className: "k-infocell__v" }, v)
      )
    );

  const Block = ({ title, children }) =>
    h("section", { className: "k-block" },
      h("h3", { className: "k-block__t" }, title),
      children
    );

  /* ---- SZKOŁA ---- */
  function SchoolDetail({ id, onBack }) {
    const s = K.schools.find((x) => x.id === id) || K.schools[0];
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: s.kind, onBack }),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-shero k-shero--" + s.tag },
          h(Icon, { name: s.online ? "globe" : s.kind === "Szpital" ? "hospital" : "school", size: 46, stroke: 1.3 })
        ),
        h("h1", { className: "k-detail__title" }, s.name),
        h("div", { className: "k-detail__srow" },
          h(Stars, { rating: s.rating, reviews: s.reviews }),
          h("span", { className: "k-school__area" }, h(Icon, { name: "pin", size: 13 }), s.area)
        ),
        h("p", { className: "k-detail__lead" }, s.about),
        h("div", { className: "k-infogrid" },
          h(InfoCell, { icon: "wallet", k: "Koszt", v: s.price }),
          h(InfoCell, { icon: "clock", k: "Harmonogram", v: s.schedule }),
          h(InfoCell, { icon: "globe", k: "Język", v: s.lang }),
          h(InfoCell, { icon: "pin", k: "Lokalizacja", v: s.area })
        )
      ),
      h("div", { className: "k-detail__foot k-detail__foot--2" },
        h(Btn, { variant: "light", icon: "layers" }, "Porównaj"),
        h(Btn, { variant: "primary", iconRight: "arrow" }, s.kind === "Szpital" ? "Wybierz szpital" : "Zapisz się")
      )
    );
  }

  /* ---- ZADANIE (USC) ---- */
  function TaskDetail({ onBack }) {
    const [done, setDone] = useState(false);
    const docs = ["Karta urodzenia ze szpitala", "Dowody osobiste obojga rodziców", "Akt małżeństwa lub zaświadczenie", "Login do mObywatela (jeśli online)"];
    const steps = [
      "Zgłoś urodzenie online przez mObywatela lub osobiście w USC właściwym dla miejsca urodzenia",
      "Urząd sporządza akt urodzenia i automatycznie nadaje numer PESEL",
      "Odbierz skrócony odpis aktu urodzenia (bezpłatnie, 1 egz.)",
      "Dziecko zostaje zameldowane pod Twoim adresem",
    ];
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: "Zadanie", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("span", { className: "k-pill k-pill--clay" }, "termin: 9 czerwca · zostało 7 dni"),
        h("h1", { className: "k-detail__title" }, "Zarejestruj urodzenie Mai w USC"),
        h("p", { className: "k-detail__lead" }, "Masz 21 dni od porodu na zgłoszenie urodzenia. Bez aktu urodzenia nie złożysz wniosku o 800+ ani becikowego."),
        h(Block, { title: "Co przygotować" },
          h("ul", { className: "k-doclist" },
            docs.map((d, i) => h("li", { key: i }, h(Icon, { name: "file", size: 15, style: { color: "var(--terracotta)" } }), d))
          )
        ),
        h(Block, { title: "Jak to zrobić" },
          h("ol", { className: "k-steps" },
            steps.map((s, i) => h("li", { key: i, className: "k-steps__i" },
              h("span", { className: "k-steps__n" }, i + 1), h("span", null, s)
            ))
          )
        )
      ),
      h("div", { className: "k-detail__foot" },
        h(Btn, { variant: done ? "light" : "primary", full: true, icon: done ? "check" : undefined, onClick: () => setDone(!done) },
          done ? "Zrobione — świetnie!" : "Oznacz jako zrobione")
      )
    );
  }

  /* ---- PORÓWNYWARKA ---- */
  function Compare({ ids, onBack }) {
    const items = ids.map((id) => K.schools.find((s) => s.id === id)).filter(Boolean);
    const rows = [
      { k: "Typ", get: (s) => s.kind },
      { k: "Koszt", get: (s) => s.price },
      { k: "Ocena", get: (s) => String(s.rating).replace(".", ",") + " ★" },
      { k: "Opinie", get: (s) => s.reviews },
      { k: "Harmonogram", get: (s) => s.schedule },
      { k: "Język", get: (s) => s.lang },
      { k: "Lokalizacja", get: (s) => s.area },
    ];
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: "Porównanie", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-compare", style: { gridTemplateColumns: "118px repeat(" + items.length + ", 1fr)" } },
          h("div", { className: "k-compare__corner" }),
          items.map((s) => h("div", { key: s.id, className: "k-compare__h" },
            h("div", { className: "k-compare__hname" }, s.name),
            h("span", { className: "k-tag k-tag--" + s.tag }, s.kind)
          )),
          rows.map((r) => [
            h("div", { key: r.k + "k", className: "k-compare__rk" }, r.k),
            ...items.map((s) => h("div", { key: r.k + s.id, className: "k-compare__rv" }, r.get(s))),
          ])
        )
      ),
      h("div", { className: "k-detail__foot" },
        h(Btn, { variant: "primary", full: true, iconRight: "arrow" }, "Wybierz " + items[0].name.split(" ").slice(0, 2).join(" "))
      )
    );
  }

  Object.assign(window, { BenefitDetail, SchoolDetail, TaskDetail, Compare });
})();
