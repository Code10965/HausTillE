// eventsCarousel.js
//
// Vier Teile:
//   1. EventsCarouselState        - reine Zustandsverwaltung.
//   2. createCarouselController   - verbindet EventsCarouselState mit
//      dem tatsächlichen HTML, inkl. echtem Fingerwischen mit
//      Live-Mitziehen über swipeGesture.js.
//   3. partitionEventsByDate       - teilt Events in Zukunft/Vergangenheit.
//   4. createPastCarouselController - Desktop-Flip-Kalender-Karussell.

import { attachSwipeGesture } from "./swipeGesture.js";

export class EventsCarouselState {
  constructor(count, startIndex = 0) {
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError("EventsCarouselState braucht mindestens 1 Folie.");
    }
    this.count = count;
    this.index = EventsCarouselState.wrap(startIndex, count);
  }

  static wrap(index, count) {
    return ((index % count) + count) % count;
  }

  next() {
    this.index = EventsCarouselState.wrap(this.index + 1, this.count);
    return this.index;
  }

  prev() {
    this.index = EventsCarouselState.wrap(this.index - 1, this.count);
    return this.index;
  }

  goTo(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) {
      throw new RangeError(
        `Index ${index} liegt außerhalb des gültigen Bereichs 0..${this.count - 1}.`
      );
    }
    this.index = index;
    return this.index;
  }
}

const DEFAULT_AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

export function createCarouselController(container, { setIntervalFn, clearIntervalFn } = {}) {
  const track = container.querySelector("[data-events-track]");
  const slides = Array.prototype.slice.call(container.querySelectorAll("[data-events-slide]"));
  if (!track || slides.length === 0) return null;

  const prevBtn = container.querySelector("[data-events-prev]");
  const nextBtn = container.querySelector("[data-events-next]");
  const playPauseBtn = container.querySelector("[data-events-playpause]");
  const dots = Array.prototype.slice.call(container.querySelectorAll("[data-events-dot]"));
  const liveRegion = container.querySelector("[data-events-live]");
  const iconPause = playPauseBtn ? playPauseBtn.querySelector("[data-icon-pause]") : null;
  const iconPlay = playPauseBtn ? playPauseBtn.querySelector("[data-icon-play]") : null;

  const pauseLabel = playPauseBtn ? playPauseBtn.getAttribute("aria-label") : "";
  const playLabel = playPauseBtn ? playPauseBtn.dataset.playLabel || pauseLabel : "";

  const win = container.ownerDocument.defaultView || window;
  const setTimer = setIntervalFn || win.setInterval.bind(win);
  const clearTimer = clearIntervalFn || win.clearInterval.bind(win);

  const prefersReducedMotion =
    "matchMedia" in win && win.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const autoplayMs = parseInt(container.dataset.autoplayMs, 10) || DEFAULT_AUTOPLAY_MS;
  const state = new EventsCarouselState(slides.length, 0);

  let userPlaying = !prefersReducedMotion && slides.length > 1;
  let hovering = false;
  let timerId = null;

  function isEffectivelyPlaying() {
    return userPlaying && !hovering;
  }

  function render() {
    track.style.transform = `translateX(-${state.index * 100}%)`;

    slides.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", i === state.index ? "false" : "true");
    });

    dots.forEach((dot, i) => {
      const active = i === state.index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (liveRegion) {
      const label = slides[state.index].getAttribute("aria-label") || "";
      liveRegion.textContent = label;
    }
  }

  function renderPlayState() {
    if (!playPauseBtn) return;
    const playing = userPlaying;
    playPauseBtn.setAttribute("aria-pressed", playing ? "false" : "true");
    if (playLabel && pauseLabel) {
      playPauseBtn.setAttribute("aria-label", playing ? pauseLabel : playLabel);
    }
    if (iconPause) iconPause.hidden = !playing;
    if (iconPlay) iconPlay.hidden = playing;
  }

  function stopTimer() {
    if (timerId !== null) {
      clearTimer(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (!isEffectivelyPlaying()) return;
    timerId = setTimer(() => {
      state.next();
      render();
    }, autoplayMs);
  }

  function restartTimer() {
    stopTimer();
    startTimer();
  }

  function goTo(index) {
    state.goTo(index);
    render();
    restartTimer();
  }

  function next() {
    state.next();
    render();
    restartTimer();
  }

  function prev() {
    state.prev();
    render();
    restartTimer();
  }

  function setPlaying(playing) {
    userPlaying = playing;
    renderPlayState();
    restartTimer();
  }

  function togglePlaying() {
    setPlaying(!userPlaying);
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);
  if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlaying);
  dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

  container.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  });

  container.addEventListener("mouseenter", () => {
    hovering = true;
    restartTimer();
  });
  container.addEventListener("mouseleave", () => {
    hovering = false;
    restartTimer();
  });
  container.addEventListener("focusin", () => {
    hovering = true;
    restartTimer();
  });
  container.addEventListener("focusout", () => {
    hovering = false;
    restartTimer();
  });

  let dragBaseOffsetPx = 0;

  attachSwipeGesture(track, {
    axis: "horizontal",
    threshold: SWIPE_THRESHOLD_PX,
    onDragStart: () => {
      hovering = true;
      restartTimer();
      dragBaseOffsetPx = -state.index * track.getBoundingClientRect().width;
      track.style.transition = "none";
    },
    onDragMove: (deltaX) => {
      track.style.transform = `translateX(${dragBaseOffsetPx + deltaX}px)`;
    },
    onDragCancel: () => {
      track.style.transition = "";
      render();
    },
    onNext: () => {
      track.style.transition = "";
      next();
    },
    onPrev: () => {
      track.style.transition = "";
      prev();
    },
    onDragEnd: () => {
      hovering = false;
      restartTimer();
    },
  });

  render();
  renderPlayState();
  startTimer();

  return {
    state,
    next,
    prev,
    goTo,
    setPlaying,
    togglePlaying,
    isPlaying: () => userPlaying,
    isEffectivelyPlaying,
    destroy: stopTimer,
  };
}

export function setupEventsCarousel(root = document) {
  const containers = Array.prototype.slice.call(root.querySelectorAll("[data-events-carousel]"));
  return containers
    .map((container) => {
      const controller = createCarouselController(container);
      if (controller && container.dataset.eventsScope === "past-mobile") {
        controller.setPlaying(false);
      }
      return controller;
    })
    .filter(Boolean);
}

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function slideEndDate(slide) {
  return slide.dataset.dateEnd || slide.dataset.dateStart || null;
}

function buildDots(container, count) {
  const dotsWrap = container.querySelector("[data-events-dots]");
  if (!dotsWrap) return;
  dotsWrap.innerHTML = "";
  const gotoLabel = container.dataset.gotoAria || "";
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "events-dot" + (i === 0 ? " is-active" : "");
    dot.dataset.eventsDot = String(i);
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.setAttribute("aria-label", gotoLabel ? `${gotoLabel} ${i + 1}` : String(i + 1));
    dotsWrap.appendChild(dot);
  }
}

function toggleEmptyState(container, isEmpty) {
  const empty = container.querySelector("[data-events-empty], [data-past-empty]");
  const controls = container.querySelector("[data-events-controls], [data-past-controls]");
  const viewport = container.querySelector("[data-events-viewport], [data-past-viewport]");
  if (empty) empty.classList.toggle("is-hidden", !isEmpty);
  if (controls) controls.classList.toggle("is-hidden", isEmpty);
  if (viewport) viewport.classList.toggle("is-hidden", isEmpty);
}

export function partitionEventsByDate(root = document, today = localISODate()) {
  root.querySelectorAll('[data-events-carousel][data-events-scope="future"]').forEach((container) => {
    const track = container.querySelector("[data-events-track]");
    if (!track) return;

    Array.prototype.slice.call(track.querySelectorAll("[data-events-slide]")).forEach((slide) => {
      const end = slideEndDate(slide);
      if (end && end < today) slide.remove();
    });

    const remaining = Array.prototype.slice.call(track.querySelectorAll("[data-events-slide]"));
    const ofLabel = container.dataset.ofLabel || "";
    remaining.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", i === 0 ? "false" : "true");
      const title = slide.dataset.title;
      if (title) {
        slide.setAttribute("aria-label", `${title} (${i + 1} ${ofLabel} ${remaining.length})`.trim());
      }
    });
    buildDots(container, remaining.length);
    toggleEmptyState(container, remaining.length === 0);
  });

  root.querySelectorAll('[data-events-carousel][data-events-scope="past-mobile"]').forEach((container) => {
    const track = container.querySelector("[data-events-track]");
    if (!track) return;

    Array.prototype.slice.call(track.querySelectorAll("[data-events-slide]")).forEach((slide) => {
      const end = slideEndDate(slide);
      if (!end || end >= today) slide.remove();
    });

    const remaining = Array.prototype.slice.call(track.querySelectorAll("[data-events-slide]")).reverse();
    remaining.forEach((slide) => track.appendChild(slide));

    const ofLabel = container.dataset.ofLabel || "";
    remaining.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", i === 0 ? "false" : "true");
      const title = slide.dataset.title;
      if (title) {
        slide.setAttribute("aria-label", `${title} (${i + 1} ${ofLabel} ${remaining.length})`.trim());
      }
    });
    buildDots(container, remaining.length);
    toggleEmptyState(container, remaining.length === 0);
  });

  root.querySelectorAll("[data-past-carousel]").forEach((container) => {
    const track = container.querySelector("[data-past-track]");
    if (!track) return;

    Array.prototype.slice.call(track.querySelectorAll("[data-past-slide]")).forEach((slide) => {
      const end = slideEndDate(slide);
      if (!end || end >= today) slide.remove();
    });

    const remaining = Array.prototype.slice.call(track.querySelectorAll("[data-past-slide]")).reverse();
    remaining.forEach((slide) => track.appendChild(slide));

    toggleEmptyState(container, remaining.length === 0);
  });
}

const DEFAULT_PAST_OF_LABEL = "von";

export function createPastCarouselController(container) {
  const track = container.querySelector("[data-past-track]");
  const slides = Array.prototype.slice.call(container.querySelectorAll("[data-past-slide]"));
  if (!track || slides.length === 0) return null;

  const prevBtn = container.querySelector("[data-past-prev]");
  const nextBtn = container.querySelector("[data-past-next]");
  const counter = container.querySelector("[data-past-counter]");
  const liveRegion = container.querySelector("[data-past-live]");
  const ofLabel = container.dataset.ofLabel || DEFAULT_PAST_OF_LABEL;

  let index = 0;

  function render() {
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-current", i === index);
      slide.classList.toggle("is-before", i < index);
      slide.classList.toggle("is-after", i > index);
      slide.setAttribute("aria-hidden", i === index ? "false" : "true");
    });

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;

    if (counter) counter.textContent = `${index + 1}/${slides.length}`;

    if (liveRegion) {
      const label = slides[index].getAttribute("aria-label") || "";
      liveRegion.textContent = label;
    }
  }

  function goTo(i) {
    if (i < 0 || i >= slides.length) return;
    index = i;
    render();
  }

  function prev() {
    goTo(index - 1);
  }

  function next() {
    goTo(index + 1);
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);

  container.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      next();
    }
  });

  render();

  return {
    goTo,
    next,
    prev,
    get index() {
      return index;
    },
    get count() {
      return slides.length;
    },
  };
}

export function setupPastEventsCarousel(root = document) {
  const containers = Array.prototype.slice.call(root.querySelectorAll("[data-past-carousel]"));
  return containers
    .map((container) => createPastCarouselController(container))
    .filter(Boolean);
}

export function setupAllEventCarousels(root = document) {
  partitionEventsByDate(root);
  return {
    future: setupEventsCarousel(root),
    past: setupPastEventsCarousel(root),
  };
}