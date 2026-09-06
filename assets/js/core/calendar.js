/* ================================================================
   ROUTINE — CORE / CALENDAR.JS
   Jalali / Gregorian calendar layer.
   Data keys are always Gregorian: YYYY-MM-DD.
================================================================ */

(function () {
  "use strict";

  const PERSIAN_MONTHS = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند"
  ];

  const EN_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  const PERSIAN_WEEKDAYS = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه"
  ];

  const EN_WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const BREAKS = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
    1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];

  function div(a, b) {
    return Math.trunc(a / b);
  }

  function mod(a, b) {
    return a - Math.trunc(a / b) * b;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function currentLang() {
    return window.I18N && window.I18N.lang ? window.I18N.lang : "fa";
  }

  function faNum(value) {
    return window.Utils ? window.Utils.toFa(value) : String(value);
  }

  /* ------------------------------
     Jalali conversion core
  ------------------------------ */

  function jalCal(jy) {
    const bl = BREAKS.length;
    const gy = jy + 621;
    let leapJ = -14;
    let jp = BREAKS[0];
    let jm;
    let jump = 0;
    let leap;
    let n;
    let i;

    if (jy < jp || jy >= BREAKS[bl - 1]) {
      throw new Error("Invalid Jalali year: " + jy);
    }

    for (i = 1; i < bl; i += 1) {
      jm = BREAKS[i];
      jump = jm - jp;

      if (jy < jm) break;

      leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }

    n = jy - jp;
    leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);

    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;

    if (jump - n < 6) {
      n = n - jump + div(jump + 4, 33) * 33;
    }

    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;

    return {
      leap: leap,
      gy: gy,
      march: march
    };
  }

  function g2d(gy, gm, gd) {
    let d =
      div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
      div(153 * mod(gm + 9, 12) + 2, 5) +
      gd -
      34840408;

    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;

    return d;
  }

  function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;

    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);

    return {
      gy: gy,
      gm: gm,
      gd: gd
    };
  }

  function j2d(jy, jm, jd) {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }

  function d2j(jdn) {
    const gy = d2g(jdn).gy;
    let jy = gy - 621;

    const r = jalCal(jy);
    const jdn1f = g2d(gy, 3, r.march);

    let k = jdn - jdn1f;
    let jm;
    let jd;

    if (k >= 0) {
      if (k <= 185) {
        jm = 1 + div(k, 31);
        jd = mod(k, 31) + 1;
        return { jy: jy, jm: jm, jd: jd };
      }

      k -= 186;
    } else {
      jy -= 1;
      k += 179;

      if (r.leap === 1) k += 1;
    }

    jm = 7 + div(k, 30);
    jd = mod(k, 30) + 1;

    return {
      jy: jy,
      jm: jm,
      jd: jd
    };
  }

  function gregorianToJalali(gy, gm, gd) {
    const r = d2j(g2d(gy, gm, gd));
    return [r.jy, r.jm, r.jd];
  }

  function jalaliToGregorian(jy, jm, jd) {
    const r = d2g(j2d(jy, jm, jd));
    return [r.gy, r.gm, r.gd];
  }

  function isJalaliLeap(jy) {
    return jalCal(jy).leap === 0;
  }

  function getTodayJalali() {
    const d = new Date();
    return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function getJalaliMonthDays(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isJalaliLeap(jy) ? 30 : 29;
  }

  function getJalaliDayOfWeek(jy, jm, jd) {
    const g = jalaliToGregorian(jy, jm, jd);
    return (new Date(g[0], g[1] - 1, g[2]).getDay() + 1) % 7;
  }

  function formatJalali(jy, jm, jd) {
    return faNum(jd) + " " + PERSIAN_MONTHS[jm - 1] + " " + faNum(jy);
  }

  /* ------------------------------
     Date key helpers
  ------------------------------ */

  function keyOf(date) {
    const d = date instanceof Date ? date : new Date(date);

    return (
      d.getFullYear() +
      "-" +
      pad2(d.getMonth() + 1) +
      "-" +
      pad2(d.getDate())
    );
  }

  function todayKey() {
    return keyOf(new Date());
  }

  function keyToDate(key) {
    const parts = String(key).split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
  }

  function keyShift(days, fromKey) {
    const d = fromKey ? keyToDate(fromKey) : new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + Number(days || 0));
    return keyOf(d);
  }

  function keyToJalaliShort(key, lang) {
    lang = lang || currentLang();

    const parts = String(key).split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);

    if (lang === "en") {
      return EN_MONTHS[date.getMonth()].slice(0, 3) + " " + date.getDate();
    }

    const j = gregorianToJalali(parts[0], parts[1], parts[2]);
    return faNum(j[2]);
  }

  function keyToJalaliFull(key, lang) {
    lang = lang || currentLang();

    const parts = String(key).split("-").map(Number);

    if (lang === "en") {
      const date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
      return EN_MONTHS[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
    }

    const j = gregorianToJalali(parts[0], parts[1], parts[2]);
    return formatJalali(j[0], j[1], j[2]);
  }

  /* ------------------------------
     Public calendar API
  ------------------------------ */

  const Calendar = {
    PERSIAN_MONTHS,
    EN_MONTHS,
    PERSIAN_WEEKDAYS,
    EN_WEEKDAYS,

    gregorianToJalali,
    jalaliToGregorian,
    isJalaliLeap,
    getTodayJalali,
    getJalaliMonthDays,
    getJalaliDayOfWeek,
    formatJalali,

    keyOf,
    todayKey,
    keyToDate,
    keyShift,
    keyToJalaliShort,
    keyToJalaliFull,

    getToday: function (lang) {
      lang = lang || currentLang();
      const d = new Date();

      if (lang === "fa") {
        const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());

        return {
          jy: j[0],
          jm: j[1],
          jd: j[2]
        };
      }

      return {
        jy: d.getFullYear(),
        jm: d.getMonth() + 1,
        jd: d.getDate()
      };
    },

    getMonths: function (lang) {
      lang = lang || currentLang();
      return lang === "fa" ? PERSIAN_MONTHS : EN_MONTHS;
    },

    getWeekdays: function (lang) {
      lang = lang || currentLang();
      return lang === "fa" ? PERSIAN_WEEKDAYS : EN_WEEKDAYS;
    },

    getDaysInMonth: function (y, m, lang) {
      lang = lang || currentLang();

      if (lang === "fa") {
        return getJalaliMonthDays(y, m);
      }

      return new Date(y, m, 0).getDate();
    },

    getFirstWeekday: function (y, m, lang) {
      lang = lang || currentLang();

      if (lang === "fa") {
        return getJalaliDayOfWeek(y, m, 1);
      }

      return new Date(y, m - 1, 1).getDay();
    },

    getDayOfWeek: function (date, lang) {
      lang = lang || currentLang();
      const d = date instanceof Date ? date : new Date(date);

      if (lang === "fa") {
        return (d.getDay() + 1) % 7;
      }

      return d.getDay();
    },

    isHoliday: function (y, m, d, lang) {
      lang = lang || currentLang();

      if (lang !== "fa") return false;

      return getJalaliDayOfWeek(y, m, d) === 6;
    },

    toKey: function (y, m, d, lang) {
      lang = lang || currentLang();

      const g =
        lang === "fa"
          ? jalaliToGregorian(y, m, d)
          : [y, m, d];

      return g[0] + "-" + pad2(g[1]) + "-" + pad2(g[2]);
    },

    formatMonthYear: function (y, m, lang) {
      lang = lang || currentLang();
      const months = lang === "fa" ? PERSIAN_MONTHS : EN_MONTHS;
      const year = lang === "fa" ? faNum(y) : String(y);

      return months[m - 1] + " " + year;
    },

    formatDay: function (y, m, d, lang) {
      lang = lang || currentLang();

      if (lang === "fa") {
        const weekday = PERSIAN_WEEKDAYS[getJalaliDayOfWeek(y, m, d)];
        return weekday + "، " + formatJalali(y, m, d);
      }

      const g = new Date(y, m - 1, d, 12, 0, 0, 0);
      return EN_WEEKDAYS[g.getDay()] + ", " + EN_MONTHS[m - 1] + " " + d + ", " + y;
    },

    formatDate: function (date, lang) {
      lang = lang || currentLang();
      const d = date instanceof Date ? date : new Date(date);

      if (lang === "fa") {
        const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        return formatJalali(j[0], j[1], j[2]);
      }

      return EN_MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    },

    formatWeekday: function (date, lang) {
      lang = lang || currentLang();
      const d = date instanceof Date ? date : new Date(date);

      if (lang === "fa") {
        return PERSIAN_WEEKDAYS[(d.getDay() + 1) % 7];
      }

      return EN_WEEKDAYS[d.getDay()];
    }
  };

  window.Calendar = Calendar;
})();