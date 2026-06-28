/* Kidelo — Narzędzia (część 2): badania, karmienie, szczepienia, album, notatki */
(function () {
  "use strict";
  const { createElement: h, useState, useEffect, useRef } = React;
  const { Icon, Btn, TopBar, Card, IconBadge, cx, Kicker } = window;
  const T = window.KIDELO_TOOLS;

  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (s) => pad(Math.floor(s / 60)) + ":" + pad(s % 60);

  /* ============ DZIENNIK BADAŃ ============ */
  function TestJournal({ onBack }) {
    const out = T.tests.filter((t) => !t.ok).length;
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: "Dziennik badań", onBack, right: h("button", { className: "k-topbar__back" }, h(Icon, { name: "plus", size: 20 })) }),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-tj__summary" },
          h("div", { className: "k-tj__sumitem" }, h("div", { className: "k-tj__sumv" }, T.tests.length), h("div", { className: "k-tj__suml" }, "wyników")),
          h("div", { className: "k-tj__sumdiv" }),
          h("div", { className: "k-tj__sumitem" }, h("div", { className: "k-tj__sumv k-tj__sumv--ok" }, T.tests.length - out), h("div", { className: "k-tj__suml" }, "w normie")),
          h("div", { className: "k-tj__sumdiv" }),
          h("div", { className: "k-tj__sumitem" }, h("div", { className: "k-tj__sumv k-tj__sumv--out" }, out), h("div", { className: "k-tj__suml" }, "do uwagi"))
        ),
        h("div", { className: "k-stack", style: { marginTop: 16 } },
          T.tests.map((t) =>
            h("div", { key: t.id, className: "k-tj" },
              h("div", { className: "k-tj__top" },
                h("div", { className: "k-tj__name" }, t.name),
                h("span", { className: cx("k-pill", t.ok ? "k-pill--sage" : "k-pill--clay") }, t.ok ? "w normie" : "poza normą")
              ),
              h("div", { className: "k-tj__row" },
                h("div", { className: "k-tj__val" }, t.value, h("span", { className: "k-tj__unit" }, t.unit)),
                h("div", { className: "k-tj__range" }, "norma ", t.range)
              ),
              h("div", { className: "k-tj__date" }, h(Icon, { name: "calendar", size: 12 }), t.date)
            )
          )
        )
      )
    );
  }

  /* ============ KARMIENIE ============ */
  function FeedingTracker({ onBack }) {
    const [side, setSide] = useState(null); // 'L' | 'R' | null
    const [sec, setSec] = useState(0);
    const ref = useRef(null);
    const [log, setLog] = useState([
      { side: "L", dur: 14 * 60 + 20, time: "11:20", ago: "2 godz. temu" },
      { side: "R", dur: 11 * 60 + 5, time: "8:45", ago: "5 godz. temu" },
      { side: "L", dur: 16 * 60 + 40, time: "5:30", ago: "8 godz. temu" },
    ]);
    useEffect(() => {
      if (side) ref.current = setInterval(() => setSec((s) => s + 1), 1000);
      return () => clearInterval(ref.current);
    }, [side]);
    const start = (s) => {
      if (side === s) {
        const d = new Date();
        setLog((l) => [{ side: s, dur: sec, time: pad(d.getHours()) + ":" + pad(d.getMinutes()), ago: "przed chwilą" }, ...l]);
        setSide(null); setSec(0);
      } else { setSide(s); setSec(0); }
    };
    return h(
      "div", { className: "k-screen k-detail k-feed" },
      h(TopBar, { title: "Karmienie", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-feed__last" },
          h(Kicker, null, "ostatnie karmienie"),
          h("div", { className: "k-feed__lastv" }, "2 godz. temu · lewa pierś")
        ),
        h("div", { className: "k-feed__sides" },
          h(SideBtn, { label: "Lewa", active: side === "L", time: side === "L" ? fmt(sec) : null, onClick: () => start("L") }),
          h(SideBtn, { label: "Prawa", active: side === "R", time: side === "R" ? fmt(sec) : null, onClick: () => start("R") })
        ),
        h("p", { className: "k-feed__tip" }, side ? "Karmienie trwa — dotknij ponownie, by zapisać." : "Dotknij stronę, by rozpocząć pomiar."),
        h("div", { className: "k-sectionhead", style: { marginTop: 22 } }, h("h3", { className: "k-sectionhead__t" }, "Dzisiaj")),
        h("div", { className: "k-stack" },
          log.map((s, k) =>
            h("div", { key: k, className: "k-histrow" },
              h("span", { className: cx("k-feed__badge", s.side === "L" ? "k-feed__badge--l" : "k-feed__badge--r") }, s.side),
              h("div", { className: "k-histrow__txt" },
                h("div", { className: "k-histrow__t" }, (s.side === "L" ? "Lewa" : "Prawa") + " pierś · " + fmt(s.dur)),
                h("div", { className: "k-histrow__d" }, s.time + " · " + s.ago)
              )
            )
          )
        )
      )
    );
  }
  const SideBtn = ({ label, active, time, onClick }) =>
    h("button", { className: cx("k-feed__side", active && "k-feed__side--on"), onClick },
      h("div", { className: "k-feed__sidel" }, label),
      h("div", { className: "k-feed__sidet" }, active ? time : "dotknij, by start"),
      active && h("span", { className: "k-feed__pulse" })
    );

  /* ============ SZCZEPIENIA ============ */
  function VaccineTracker({ onBack }) {
    const doneN = T.vaccines.filter((v) => v.done).length;
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: "Szczepienia", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("div", { className: "k-vac__head" },
          h("div", null,
            h(Kicker, null, "kalendarz GIS · Maja"),
            h("div", { className: "k-vac__hv" }, doneN + " z " + T.vaccines.length + " etapów")
          ),
          h("div", { className: "k-vac__ring" }, h("div", { className: "k-vac__ringn" }, Math.round((doneN / T.vaccines.length) * 100) + "%"))
        ),
        h("div", { className: "k-vac__timeline" },
          T.vaccines.map((v) =>
            h("div", { key: v.id, className: cx("k-vac", v.done && "k-vac--done", v.next && "k-vac--next") },
              h("div", { className: "k-vac__dot" }, v.done && h(Icon, { name: "check", size: 13, stroke: 2.4 })),
              h("div", { className: "k-vac__body" },
                h("div", { className: "k-vac__top" },
                  h("div", { className: "k-vac__age" }, v.age),
                  v.next && h("span", { className: "k-pill k-pill--clay" }, "następne"),
                  v.done && h("span", { className: "k-vac__when" }, v.when)
                ),
                !v.done && h("div", { className: "k-vac__date" }, v.when),
                h("div", { className: "k-vac__shots" }, v.shots.map((s, k) => h("span", { key: k, className: "k-vac__shot" }, s)))
              )
            )
          )
        )
      )
    );
  }

  /* ============ ALBUM BRZUSZKA ============ */
  function PhotoAlbum({ onBack }) {
    const weeks = [16, 20, 24, 28, 32, 36];
    return h(
      "div", { className: "k-screen k-detail" },
      h(TopBar, { title: "Album brzuszka", onBack }),
      h("div", { className: "k-detail__scroll" },
        h("p", { className: "k-detail__lead" }, "Rób zdjęcie brzuszka co tydzień — Kidelo automatycznie podpisze je tygodniem ciąży."),
        h("div", { className: "k-album" },
          weeks.map((w) =>
            h("div", { key: w, className: "k-album__cell" },
              h("image-slot", { id: "kidelo-belly-" + w, shape: "rounded", radius: "14", style: { width: "100%", height: "150px", display: "block" }, placeholder: "+ zdjęcie" }),
              h("div", { className: "k-album__tag" }, "tydzień " + w)
            )
          )
        )
      )
    );
  }

  /* ============ NOTATKI ============ */
  function Notes({ onBack }) {
    return h(
      "div", { className: "k-screen k-detail k-notes" },
      h(TopBar, { title: "Notatki", onBack, right: h("button", { className: "k-topbar__back" }, h(Icon, { name: "plus", size: 20 })) }),
      h("div", { className: "k-detail__scroll" },
        h("button", { className: "k-notes__add" },
          h(Icon, { name: "pencil", size: 17 }),
          h("span", null, "Nowa notatka lub pytanie do lekarza")
        ),
        h("div", { className: "k-stack", style: { marginTop: 12 } },
          T.notes.map((n) =>
            h("div", { key: n.id, className: "k-note k-note--" + n.color },
              h("div", { className: "k-note__top" },
                h("span", { className: "k-note__kind" }, n.kind),
                h("span", { className: "k-note__date" }, n.date)
              ),
              h("div", { className: "k-note__title" }, n.title),
              h("div", { className: "k-note__body" }, n.body)
            )
          )
        )
      )
    );
  }

  Object.assign(window, { TestJournal, FeedingTracker, VaccineTracker, PhotoAlbum, Notes });
})();
