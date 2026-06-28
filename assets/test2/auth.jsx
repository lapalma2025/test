/* Kidelo — logowanie + onboarding */
(function () {
  "use strict";
  const { createElement: h, useState } = React;
  const { Btn, Field, Icon, Progress } = window;

  function Logo({ size = 40 }) {
    return h(
      "div", { className: "k-logo", style: { fontSize: size } },
      h("span", { className: "k-logo__mark" },
        h(Icon, { name: "routeAlt", size: size * 0.62, stroke: 1.7 })
      ),
      h("span", { className: "k-logo__word" }, "Kidelo")
    );
  }
  window.Logo = Logo;

  /* ---------- RYSUNEK: sylwetka ciężarnej (line-art) ---------- */
  function PregnantArt({ sun = true, className }) {
    const stroke = {
      stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round",
      strokeLinejoin: "round", fill: "none",
    };
    return h(
      "svg", { className, viewBox: "0 0 340 560", fill: "none", "aria-hidden": "true" },
      sun && h("circle", { cx: 182, cy: 300, r: 150, className: "k-art__sun" }),
      h("g", stroke,
        // włosy + kok
        h("path", { d: "M196 110 C176 82 146 82 138 106 C118 106 114 136 140 142 C154 145 156 124 144 110" }),
        // profil twarzy
        h("path", { d: "M196 110 C201 117 200 123 205 129 C213 135 214 143 204 148 C213 153 209 161 197 162 C205 167 199 179 185 180 C180 181 178 187 178 197" }),
        // szyja → biust → brzuch → pod brzuchem
        h("path", { d: "M178 197 C176 208 178 217 176 227 C196 236 200 255 187 273 C232 283 256 328 240 370 C233 392 214 406 190 408" }),
        // przód sukni (lekki klosz)
        h("path", { d: "M190 408 C203 443 209 483 213 519" }),
        // tył głowy → plecy → tył sukni
        h("path", { d: "M146 142 C156 172 160 205 155 237 C150 271 150 317 158 359 C164 395 158 438 152 478 C150 496 149 510 148 519" }),
        // rąbek
        h("path", { d: "M148 519 C172 529 191 529 213 519" })
      )
    );
  }
  window.PregnantArt = PregnantArt;

  /* ---------- LOGOWANIE ---------- */
  function Login({ onLogin }) {
    return h(
      "div", { className: "k-screen k-auth" },
      h("div", { className: "k-auth__art" }, h(PregnantArt, { sun: true })),
      h("div", { className: "k-auth__top" },
        h(Logo, { size: 46 }),
        h("p", { className: "k-auth__tag" }, "Twoja trasa przez ciążę i pierwsze miesiące — terminy, świadczenia i dokumenty w jednym miejscu.")
      ),
      h("div", { className: "k-auth__form" },
        h(Field, { label: "Adres e-mail", type: "email", value: "anna@kidelo.pl", placeholder: "ty@example.com" }),
        h(Field, { label: "Hasło", type: "password", value: "••••••••", placeholder: "twoje hasło" }),
        h("button", { className: "k-auth__forgot" }, "Nie pamiętasz hasła?"),
        h(Btn, { variant: "primary", full: true, onClick: onLogin, iconRight: "arrow" }, "Zaloguj się"),
        h("div", { className: "k-auth__or" }, h("span", null, "lub")),
        h(Btn, { variant: "light", full: true, icon: "shield", onClick: onLogin }, "Kontynuuj z Apple"),
        h(Btn, { variant: "light", full: true, icon: "globe", onClick: onLogin }, "Kontynuuj z Google")
      ),
      h("button", { className: "k-auth__switch", onClick: onLogin },
        "Nie masz konta? ", h("strong", null, "Załóż je w 60 sekund")
      )
    );
  }

  /* ---------- ONBOARDING ---------- */
  const OptionCard = ({ active, title, note, onClick, icon }) =>
    h("button", { className: "k-opt" + (active ? " k-opt--on" : ""), onClick },
      icon && h("span", { className: "k-opt__ic" }, h(Icon, { name: icon, size: 20 })),
      h("span", { className: "k-opt__body" },
        h("span", { className: "k-opt__t" }, title),
        note && h("span", { className: "k-opt__n" }, note)
      ),
      h("span", { className: "k-opt__tick" }, active && h(Icon, { name: "check", size: 14, stroke: 2.4 }))
    );

  const WOJ = ["mazowieckie", "małopolskie", "śląskie", "wielkopolskie", "dolnośląskie", "pomorskie", "łódzkie", "lubelskie"];

  function Onboarding({ onDone, startStep }) {
    const [step, setStep] = useState(startStep || 0);
    const [a, setA] = useState({
      stage: "born", date: "26 maja 2026",
      parity: "first",
      work: "uop",
      woj: "mazowieckie", city: "Warszawa",
      partner: "yes",
    });
    const set = (k, v) => setA((s) => ({ ...s, [k]: v }));
    const total = 5;
    const next = () => (step < total ? setStep(step + 1) : onDone());
    const back = () => (step > 0 ? setStep(step - 1) : onDone());

    const steps = [
      // 0 — etap
      h("div", { key: "s0", className: "k-ob__q" },
        h("h2", { className: "k-ob__title" }, "Na jakim etapie jesteś?"),
        h("p", { className: "k-ob__hint" }, "Ułożymy oś czasu z konkretnymi datami."),
        h("div", { className: "k-ob__opts" },
          h(OptionCard, { active: a.stage === "preg", icon: "heart", title: "Jestem w ciąży", note: "podasz tydzień lub termin porodu", onClick: () => set("stage", "preg") }),
          h(OptionCard, { active: a.stage === "born", icon: "sparkle", title: "Dziecko już się urodziło", note: "podasz datę urodzenia", onClick: () => set("stage", "born") })
        ),
        a.stage === "born"
          ? h(Field, { label: "Data urodzenia dziecka", value: a.date, onChange: (v) => set("date", v) })
          : h(Field, { label: "Który to tydzień ciąży?", value: "tydzień 24", onChange: () => {} })
      ),
      // 1 — parzystość
      h("div", { key: "s1", className: "k-ob__q" },
        h("h2", { className: "k-ob__title" }, "To pierwsze dziecko?"),
        h("p", { className: "k-ob__hint" }, "Dopasujemy podpowiedzi i checklisty."),
        h("div", { className: "k-ob__opts" },
          h(OptionCard, { active: a.parity === "first", title: "Tak, pierwsze", note: "pokażemy wszystko krok po kroku", onClick: () => set("parity", "first") }),
          h(OptionCard, { active: a.parity === "next", title: "Kolejne", note: "pominiemy podstawy, zostawimy terminy", onClick: () => set("parity", "next") })
        )
      ),
      // 2 — zatrudnienie
      h("div", { key: "s2", className: "k-ob__q" },
        h("h2", { className: "k-ob__title" }, "Jaka jest Twoja forma zatrudnienia?"),
        h("p", { className: "k-ob__hint" }, "Od tego zależy, jakie świadczenia Ci przysługują."),
        h("div", { className: "k-ob__opts" },
          h(OptionCard, { active: a.work === "uop", title: "Umowa o pracę", note: "zasiłek macierzyński", onClick: () => set("work", "uop") }),
          h(OptionCard, { active: a.work === "b2b", title: "B2B / działalność", note: "zależnie od ubezpieczenia chorobowego", onClick: () => set("work", "b2b") }),
          h(OptionCard, { active: a.work === "student", title: "Student / umowa zlecenie", note: "kosiniakowe 1000 zł/mies.", onClick: () => set("work", "student") }),
          h(OptionCard, { active: a.work === "none", title: "Bez pracy", note: "kosiniakowe 1000 zł/mies.", onClick: () => set("work", "none") })
        )
      ),
      // 3 — lokalizacja
      h("div", { key: "s3", className: "k-ob__q" },
        h("h2", { className: "k-ob__title" }, "Gdzie mieszkasz?"),
        h("p", { className: "k-ob__hint" }, "Pokażemy szkoły rodzenia i szpitale w okolicy."),
        h("label", { className: "k-field" },
          h("span", { className: "k-field__l" }, "Województwo"),
          h("div", { className: "k-selectwrap" },
            h("select", { className: "k-input", value: a.woj, onChange: (e) => set("woj", e.target.value) },
              WOJ.map((w) => h("option", { key: w, value: w }, w))),
            h(Icon, { name: "chevronDown", size: 16, style: { position: "absolute", right: 14, top: 16, pointerEvents: "none", color: "var(--ink-faint)" } })
          )
        ),
        h(Field, { label: "Miasto", value: a.city, onChange: (v) => set("city", v) })
      ),
      // 4 — partner
      h("div", { key: "s4", className: "k-ob__q" },
        h("h2", { className: "k-ob__title" }, "Uwzględnić partnera?"),
        h("p", { className: "k-ob__hint" }, "Część formalności i urlopów dotyczy dwojga rodziców."),
        h("div", { className: "k-ob__opts" },
          h(OptionCard, { active: a.partner === "yes", icon: "user", title: "Tak, jest ze mną partner", note: "dodamy jego urlopy i dokumenty", onClick: () => set("partner", "yes") }),
          h(OptionCard, { active: a.partner === "no", title: "Nie teraz", note: "możesz dodać później w profilu", onClick: () => set("partner", "no") })
        ),
        a.partner === "yes" && h(Field, { label: "Imię partnera", value: "Marek", onChange: () => {} })
      ),
      // 5 — podsumowanie
      h("div", { key: "s5", className: "k-ob__q k-ob__done" },
        h("div", { className: "k-ob__doneicon" }, h(Icon, { name: "sparkle", size: 30 })),
        h("h2", { className: "k-ob__title" }, "Gotowe, Anna."),
        h("p", { className: "k-ob__hint" }, "Ułożyliśmy Twoją trasę na podstawie odpowiedzi. Zaczynamy od najpilniejszego: rejestracji urodzenia w USC."),
        h("div", { className: "k-ob__sum" },
          h(SumRow, { k: "Etap", v: "Maja, 14 dni po porodzie" }),
          h(SumRow, { k: "Zatrudnienie", v: "Umowa o pracę" }),
          h(SumRow, { k: "Miejsce", v: "Warszawa, mazowieckie" }),
          h(SumRow, { k: "Należy Ci się", v: "10 600 zł w 1. roku", hi: true })
        )
      ),
    ];

    return h(
      "div", { className: "k-screen k-ob" },
      h("div", { className: "k-ob__head" },
        h("button", { className: "k-topbar__back", onClick: back }, h(Icon, { name: "back", size: 20 })),
        h("div", { className: "k-ob__progress" }, h(Progress, { value: step + 1, max: total + 1 })),
        h("span", { className: "k-ob__count" }, step < total ? `${step + 1} / ${total}` : "✓")
      ),
      h("div", { className: "k-ob__scroll" }, steps[step]),
      h("div", { className: "k-ob__foot" },
        h(Btn, { variant: "primary", full: true, onClick: next, iconRight: step < total ? "arrow" : "check" },
          step === 0 ? "Dalej" : step < total ? "Dalej" : "Zobacz trasę")
      )
    );
  }

  const SumRow = ({ k, v, hi }) =>
    h("div", { className: "k-ob__sumrow" + (hi ? " k-ob__sumrow--hi" : "") },
      h("span", { className: "k-ob__sumk" }, k),
      h("span", { className: "k-ob__sumv" }, v)
    );

  Object.assign(window, { Login, Onboarding });
})();
