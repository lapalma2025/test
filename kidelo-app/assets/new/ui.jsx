/* Kidelo — wspólne komponenty UI. Eksport na window. */
(function () {
  "use strict";
  const { createElement: h } = React;
  const Icon = window.Icon;

  const cx = (...a) => a.filter(Boolean).join(" ");

  function Btn({ variant = "primary", icon, iconRight, children, onClick, full, style }) {
    return h(
      "button",
      { className: cx("k-btn", "k-btn--" + variant, full && "k-btn--full"), onClick, style },
      icon && h(Icon, { name: icon, size: 18 }),
      h("span", null, children),
      iconRight && h(Icon, { name: iconRight, size: 18 })
    );
  }

  function Chip({ active, children, onClick, icon }) {
    return h(
      "button",
      { className: cx("k-chip", active && "k-chip--on"), onClick },
      icon && h(Icon, { name: icon, size: 14 }),
      h("span", null, children)
    );
  }

  function Kicker({ children }) {
    return h("div", { className: "k-kicker" }, children);
  }

  function SectionHead({ title, action, onAction }) {
    return h(
      "div", { className: "k-sectionhead" },
      h("h3", { className: "k-sectionhead__t" }, title),
      action && h("button", { className: "k-sectionhead__a", onClick: onAction }, action)
    );
  }

  function Card({ children, onClick, style, className, tint }) {
    return h(
      "div",
      {
        className: cx("k-card", onClick && "k-card--tap", tint && "k-card--tint-" + tint, className),
        onClick, style,
      },
      children
    );
  }

  function IconBadge({ name, theme = "sand", size = 44 }) {
    return h(
      "div", { className: "k-iconbadge k-iconbadge--" + theme, style: { width: size, height: size } },
      h(Icon, { name, size: Math.round(size * 0.5) })
    );
  }

  function Toggle({ on, onClick }) {
    return h(
      "button",
      { className: cx("k-toggle", on && "k-toggle--on"), onClick, role: "switch", "aria-checked": !!on },
      h("span", { className: "k-toggle__knob" })
    );
  }

  function Checkbox({ checked, onClick }) {
    return h(
      "span",
      { className: cx("k-check", checked && "k-check--on"), onClick, "aria-checked": !!checked, role: "checkbox" },
      checked && h(Icon, { name: "check", size: 14, stroke: 2.2 })
    );
  }

  function Progress({ value, max }) {
    const pct = max ? Math.round((value / max) * 100) : 0;
    return h(
      "div", { className: "k-progress" },
      h("span", { className: "k-progress__fill", style: { width: pct + "%" } })
    );
  }

  function Stars({ rating, reviews }) {
    return h(
      "div", { className: "k-stars" },
      h(Icon, { name: "star", size: 13, style: { color: "var(--terracotta)" } }),
      h("span", { className: "k-stars__n" }, String(rating).replace(".", ",")),
      reviews != null && h("span", { className: "k-stars__r" }, "· " + reviews + " opinii")
    );
  }

  function Avatar({ name, size = 44, theme = "sage" }) {
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    return h(
      "div",
      { className: "k-avatar k-avatar--" + theme, style: { width: size, height: size, fontSize: size * 0.4 } },
      initial
    );
  }

  function Field({ label, type = "text", value, onChange, placeholder }) {
    return h(
      "label", { className: "k-field" },
      label && h("span", { className: "k-field__l" }, label),
      h("input", {
        className: "k-input", type, value, placeholder, readOnly: !onChange,
        onChange: onChange ? (e) => onChange(e.target.value) : undefined,
      })
    );
  }

  // Pasek górny ekranu (z back / tytuł / akcja po prawej)
  function TopBar({ title, onBack, right, subtitle }) {
    return h(
      "div", { className: "k-topbar" },
      onBack
        ? h("button", { className: "k-topbar__back", onClick: onBack }, h(Icon, { name: "back", size: 20 }))
        : h("span", { className: "k-topbar__sp" }),
      h("div", { className: "k-topbar__center" },
        h("div", { className: "k-topbar__t" }, title),
        subtitle && h("div", { className: "k-topbar__sub" }, subtitle)
      ),
      right || h("span", { className: "k-topbar__sp" })
    );
  }

  const NAV = [
    { id: "trasa", label: "Trasa", icon: "routeAlt" },
    { id: "szkoly", label: "Szkoły", icon: "school" },
    { id: "pieniadze", label: "Pieniądze", icon: "wallet" },
    { id: "lista", label: "Lista", icon: "list" },
    { id: "profil", label: "Profil", icon: "user" },
  ];

  function BottomNav({ tab, onTab }) {
    return h(
      "nav", { className: "k-nav" },
      NAV.map((it) =>
        h(
          "button",
          { key: it.id, className: cx("k-nav__i", tab === it.id && "k-nav__i--on"), onClick: () => onTab(it.id) },
          h(Icon, { name: it.icon, size: 22, stroke: tab === it.id ? 1.8 : 1.6 }),
          h("span", null, it.label)
        )
      )
    );
  }

  Object.assign(window, {
    Btn, Chip, Kicker, SectionHead, Card, IconBadge, Toggle, Checkbox,
    Progress, Stars, Avatar, Field, TopBar, BottomNav, cx,
  });
})();
