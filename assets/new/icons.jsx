/* Kidelo — ikony (cienka kreska, 1.6px). window.Icon */
(function () {
  "use strict";
  const { createElement: h } = React;

  const P = {
    route: "M5 18c0-5 3-7 7-7s7-2 7-7 M5 18h.01 M19 4h.01", // ścieżka
    routeAlt: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M8 17h6a3 3 0 0 0 3-3V9",
    school: "M3 9l9-5 9 5-9 5-9-5Z M7 11v5c0 1 2 2 5 2s5-1 5-2v-5",
    wallet: "M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z M16 12h3 M3 9h14",
    list: "M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M5 20c0-3.5 3-6 7-6s7 2.5 7 6",
    stethoscope: "M5 4v5a4 4 0 0 0 8 0V4 M9 17a5 5 0 0 0 9-3v-2 M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    hospital: "M4 21V7l8-4 8 4v14 M9 21v-5h6v5 M12 7v4 M10 9h4",
    file: "M7 3h7l5 5v13H7V3Z M14 3v5h5",
    briefcase: "M4 8h16v11H4V8Z M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2",
    activity: "M3 12h4l2 6 4-14 2 8h4",
    heart: "M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z",
    bag: "M6 8h12l-1 12H7L6 8Z M9 8V6a3 3 0 0 1 6 0v2",
    gift: "M4 11h16v9H4v-9Z M3 7h18v4H3V7Z M12 7v13 M12 7S10 3 8 4s0 3 4 3 M12 7s2-4 4-3-0 3-4 3",
    phone: "M8 3h8v18H8V3Z M11 18h2",
    arrow: "M5 12h14 M13 6l6 6-6 6",
    back: "M19 12H5 M11 18l-6-6 6-6",
    check: "M5 12l4 4 10-11",
    plus: "M12 5v14 M5 12h14",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20 20l-4-4",
    star: "M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8L12 4Z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 8v4l3 2",
    pin: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z M10 19a2 2 0 0 0 4 0",
    chevron: "M9 6l6 6-6 6",
    chevronDown: "M6 9l6 6 6-6",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z",
    shield: "M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01",
    layers: "M12 4l8 4-8 4-8-4 8-4Z M4 12l8 4 8-4 M4 16l8 4 8-4",
    cross: "M6 6l12 12 M18 6 6 18",
    drop: "M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z",
    stopwatch: "M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M12 14V10 M9 2h6 M19 6l1.5-1.5",
    flask: "M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7.5 15h9",
    bottle: "M10 2h4 M10 4h4v3l1 2v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V9l1-2V4 M9 12h6",
    syringe: "M14 4l6 6 M17 7l-9 9-4 1 1-4 9-9 M9 12l2 2 M12 9l2 2",
    camera: "M4 8h3l1.5-2h7L17 8h3v11H4V8Z M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    pencil: "M4 20l4-1 11-11-3-3L5 16l-1 4Z M14 6l3 3",
    calendar: "M5 5h14v15H5V5Z M5 9h14 M9 3v4 M15 3v4 M9 13h2 M9 16h6",
    baby: "M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M8 12c1 1.5 2.5 2 4 2s3-.5 4-2 M7 21v-4l-2-2 2-3h8l2 3-2 2v4 M9 11h.01 M15 11h.01",
    ruler: "M4 14L14 4l6 6L10 20 4 14Z M8 10l1.5 1.5 M11 7l1.5 1.5 M7 13l1.5 1.5",
    minus: "M5 12h14",
    play: "M8 5l11 7-11 7V5Z",
    pause: "M8 5v14 M16 5v14",
    grid: "M4 4h7v7H4V4Z M13 4h7v7h-7V4Z M4 13h7v7H4v-7Z M13 13h7v7h-7v-7Z",
    note: "M6 3h9l4 4v14H6V3Z M14 3v5h5 M9 12h7 M9 16h5",
    foot: "M9 4c2 0 3 2 3 5s-1 5-3 5-3-1-3-4 1-6 3-6Z M16 13c1.5 0 2 1 2 2.5S17 18 15.5 18 14 17 14 16s.5-3 2-3 M7 18c1 0 1.5.8 1.5 1.8S7.8 22 6.8 22 5.5 21.2 5.5 20.2 6 18 7 18Z",
  };

  function Icon(props) {
    const name = props.name;
    const size = props.size || 22;
    const sw = props.stroke || 1.6;
    const d = P[name] || P.info;
    return h(
      "svg",
      {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round",
        style: { display: "block", flex: "none", ...(props.style || {}) },
      },
      d.split(" M").map((seg, i) => h("path", { key: i, d: (i === 0 ? seg : "M" + seg) }))
    );
  }

  window.Icon = Icon;
})();
