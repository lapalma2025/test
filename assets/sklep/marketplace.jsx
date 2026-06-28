/* Kidelo — Sklep / Marketplace Kidelo */
(function () {
  "use strict";
  const { createElement: h, useState } = React;
  const { Icon, Btn, Card, cx, Kicker } = window;

  const CATS = [
    { id: "all", t: "Wszystko", icon: "grid", theme: "ever" },
    { id: "ubrania", t: "Ubrania", icon: "shirt", theme: "clay" },
    { id: "obuwie", t: "Obuwie", icon: "shoe", theme: "sand" },
    { id: "zabawki", t: "Zabawki", icon: "blocks", theme: "sage" },
    { id: "ksiazki", t: "Książki", icon: "book", theme: "clay" },
    { id: "pokoj", t: "Pokój dziecka", icon: "crib", theme: "sand" },
    { id: "karmienie", t: "Karmienie", icon: "bottle", theme: "sage" },
    { id: "pielegnacja", t: "Pielęgnacja", icon: "lotion", theme: "clay" },
    { id: "zdrowie", t: "Zdrowie", icon: "heart", theme: "sage" },
    { id: "szkola", t: "Szkoła", icon: "school", theme: "sand" },
    { id: "dodatki", t: "Dodatki", icon: "bag", theme: "clay" },
    { id: "prezent", t: "Na prezent", icon: "gift", theme: "sage" },
    { id: "inne", t: "Inne", icon: "dots", theme: "sand" },
  ];

  const LISTINGS = [
    { id: "p1", cat: "pokoj", title: "Wózek 3w1 Riko Brano", price: "650 zł", cond: "Bardzo dobry", where: "Mokotów · 2 km", tone: "sage" },
    { id: "p2", cat: "ubrania", title: "Body 56–62, paczka 10 szt.", price: "45 zł", cond: "Jak nowe", where: "Wola · 4 km", tone: "clay" },
    { id: "p3", cat: "zabawki", title: "Mata edukacyjna Fisher-Price", price: "90 zł", cond: "Dobry", where: "Ursynów · 6 km", tone: "sand" },
    { id: "p4", cat: "obuwie", title: "Buciki Bobux 12–18 mies.", price: "30 zł", cond: "Nowe", where: "Praga-Płd · 8 km", tone: "clay" },
    { id: "p5", cat: "karmienie", title: "Krzesełko do karmienia Stokke", price: "480 zł", cond: "Bardzo dobry", where: "Żoliborz · 3 km", tone: "sage" },
    { id: "p6", cat: "ksiazki", title: "Pakiet książeczek kontrastowych", price: "25 zł", cond: "Jak nowe", where: "Bemowo · 9 km", tone: "sand" },
  ];

  function Sklep() {
    const [cat, setCat] = useState("all");
    const list = cat === "all" ? LISTINGS : LISTINGS.filter((p) => p.cat === cat);
    const activeName = CATS.find((c) => c.id === cat).t;
    return h(
      "div", { className: "k-screen k-shop" },
      h("header", { className: "k-pagehead" },
        h("div", null,
          h("h1", { className: "k-pagetitle" }, "Sklep"),
          h("div", { className: "k-pagehead__date" }, "Marketplace Kidelo")
        ),
        h("button", { className: "k-iconbtn" }, h(Icon, { name: "search", size: 20 }))
      ),

      // PROMO — sprzedaj rzeczy z Kidelo
      h("a", { className: "k-mkt", href: "https://kidelo.pl", target: "_blank", rel: "noopener" },
        h("div", { className: "k-mkt__deco", "aria-hidden": "true" }),
        h("div", { className: "k-mkt__brand" },
          h("image-slot", { id: "kidelo-partner-logo", shape: "rounded", radius: "12", style: { width: "48px", height: "48px", display: "block", flex: "none" }, placeholder: "logo" }),
          h("div", null,
            h("div", { className: "k-mkt__name" }, "Kidelo"),
            h("div", { className: "k-mkt__sub" }, "Marketplace dla rodziców")
          )
        ),
        h("h2", { className: "k-mkt__head" }, "Masz rzeczy, z których Twoje dziecko wyrosło?"),
        h("p", { className: "k-mkt__body" }, "Sprzedaj ubranka, wózek czy akcesoria dziecięce innym rodzicom. Szybko i bezpiecznie — z Kidelo."),
        h("span", { className: "k-mkt__btn" },
          h("span", null, "Przejdź do Kidelo"),
          h(Icon, { name: "arrow", size: 18 })
        )
      ),

      // KATEGORIE
      h("div", { className: "k-sectionhead" }, h("h3", { className: "k-sectionhead__t" }, "Kategorie")),
      h("div", { className: "k-catgrid" },
        CATS.map((c) =>
          h("button", { key: c.id, className: cx("k-cat", cat === c.id && "k-cat--on"), onClick: () => setCat(c.id) },
            h("span", { className: "k-cat__ic k-cat__ic--" + c.theme }, h(Icon, { name: c.icon, size: 23, stroke: 1.6 })),
            h("span", { className: "k-cat__t" }, c.t)
          )
        )
      ),

      // OGŁOSZENIA
      h("div", { className: "k-sectionhead", style: { marginTop: 26 } },
        h("h3", { className: "k-sectionhead__t" }, cat === "all" ? "Polecane w pobliżu" : activeName),
        h("span", { className: "k-shop__count" }, list.length + (list.length === 1 ? " oferta" : " oferty"))
      ),
      list.length
        ? h("div", { className: "k-listings" },
            list.map((p) =>
              h("a", { key: p.id, className: "k-listing", href: "https://kidelo.pl", target: "_blank", rel: "noopener" },
                h("div", { className: "k-listing__imgwrap" },
                  h("image-slot", { id: "kidelo-listing-" + p.id, shape: "rect", style: { width: "100%", height: "120px", display: "block" }, placeholder: "" }),
                  h("span", { className: "k-listing__cond k-listing__cond--" + p.tone }, p.cond)
                ),
                h("div", { className: "k-listing__info" },
                  h("div", { className: "k-listing__title" }, p.title),
                  h("div", { className: "k-listing__bottom" },
                    h("span", { className: "k-listing__price" }, p.price),
                    h("span", { className: "k-listing__where" }, p.where)
                  )
                )
              )
            )
          )
        : h("p", { className: "k-empty" }, "Brak ofert w tej kategorii. Zajrzyj później lub przejdź do Kidelo."),

      h("a", { className: "k-shop__all", href: "https://kidelo.pl", target: "_blank", rel: "noopener" },
        "Zobacz wszystkie oferty na kidelo.pl", h(Icon, { name: "arrow", size: 16 }))
    );
  }

  window.Sklep = Sklep;
})();
