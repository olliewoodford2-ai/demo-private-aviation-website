(() => {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (start, end, value) => {
    const progress = clamp((value - start) / (end - start));
    return progress * progress * (3 - 2 * progress);
  };
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileViewport = window.matchMedia("(max-width: 680px)");
  const root = document.documentElement;
  const windowSection = document.querySelector(".window-journey");
  const windowStage = document.querySelector("[data-window-scene]");
  const aircraftSection = document.querySelector(".aircraft-journey");
  const aircraftStage = document.querySelector("[data-aircraft-scene]");
  const aircraftVideo = document.querySelector("[data-jet-video]");
  const aircraftSource = aircraftVideo?.querySelector("source[data-src]");
  const routeSection = document.querySelector("[data-route-scene]");
  const testimonialSection = document.querySelector(".testimonials-scroll");
  const testimonialStage = document.querySelector("[data-testimonials-scene]");
  const testimonialWindow = document.querySelector(".testimonial-window");
  const testimonialTrack = document.querySelector("[data-testimonial-track]");
  const testimonialCards = [...document.querySelectorAll(".testimonial-card")];
  const testimonialCount = document.querySelector("[data-testimonial-count]");
  const testimonialProgress = document.querySelector("[data-testimonial-progress]");
  const cursorAura = document.querySelector(".cursor-aura");
  const bookingDialog = document.querySelector(".booking-dialog");
  const bookingForm = document.querySelector("[data-booking-form]");
  let frameRequested = false;
  let videoRequested = false;
  let videoReady = false;
  let videoFailed = false;
  let targetVideoTime = 0;

  const setVar = (element, name, value) => {
    if (element) element.style.setProperty(name, value);
  };

  const sectionProgress = (section) => {
    if (!section) return 0;
    const distance = Math.max(1, section.offsetHeight - window.innerHeight);
    return clamp((window.scrollY - section.offsetTop) / distance);
  };

  function updateWindowScene() {
    if (!windowStage) return;
    const progress = sectionProgress(windowSection);
    const photoProgress = smooth(0.02, 0.55, progress);
    const copyOpacity = 1 - smooth(0.14, 0.42, progress);
    const cloudOpacity = smooth(0.32, 0.58, progress);
    const storyOpacity = smooth(0.52, 0.68, progress);
    const bookingOpacity = smooth(0.68, 0.8, progress);

    setVar(windowStage, "--p", progress.toFixed(3));
    setVar(windowStage, "--photo-scale", (1 + photoProgress * 0.72).toFixed(3));
    setVar(windowStage, "--photo-opacity", (1 - smooth(0.39, 0.6, progress)).toFixed(3));
    setVar(windowStage, "--cloud-opacity", cloudOpacity.toFixed(3));
    setVar(windowStage, "--copy-opacity", copyOpacity.toFixed(3));
    setVar(windowStage, "--copy-offset", `${(progress * 110).toFixed(1)}px`);

    windowStage.querySelectorAll(".window-copy").forEach((copy) => {
      copy.classList.toggle("is-active", copyOpacity > 0.015);
    });

    const story = windowStage.querySelector(".window-cloud-story");
    const booking = windowStage.querySelector(".window-booking");
    const cue = windowStage.querySelector(".scroll-cue");
    if (story) story.style.opacity = storyOpacity.toFixed(3);
    if (booking) booking.style.opacity = bookingOpacity.toFixed(3);
    if (cue) cue.style.opacity = (1 - smooth(0.02, 0.12, progress)).toFixed(3);
  }

  function updateAircraftScene() {
    if (!aircraftStage) return;
    const progress = sectionProgress(aircraftSection);
    const videoIn = smooth(0.28, 0.35, progress);
    const videoOut = 1 - smooth(0.57, 0.68, progress);
    const videoOpacity = videoIn * videoOut;
    const titleOpacity = 1 - smooth(0.47, 0.57, progress);
    const specsOpacity = smooth(0.52, 0.63, progress) * (1 - smooth(0.72, 0.8, progress));
    const seatOpacity = smooth(0.75, 0.85, progress);

    setVar(aircraftStage, "--p", progress.toFixed(3));
    setVar(aircraftStage, "--flight-video-opacity", (videoReady && !videoFailed ? videoOpacity : 0).toFixed(3));
    setVar(aircraftStage, "--flight-still-opacity", (!videoReady || videoFailed ? videoOpacity : 0).toFixed(3));
    setVar(aircraftStage, "--title-opacity", titleOpacity.toFixed(3));
    setVar(aircraftStage, "--spec-opacity", specsOpacity.toFixed(3));
    setVar(aircraftStage, "--seat-opacity", seatOpacity.toFixed(3));
    setVar(aircraftStage, "--stage-dark", "0");
    setVar(aircraftStage, "--spec-y", `${((1 - specsOpacity) * 18).toFixed(1)}px`);
    setVar(aircraftStage, "--seat-y", `${((1 - seatOpacity) * 8).toFixed(1)}vh`);

    const progressBar = aircraftStage.querySelector("[data-aircraft-progress]");
    if (progressBar) progressBar.style.width = `${(progress * 100).toFixed(1)}%`;

    if (aircraftVideo && videoReady && !prefersReducedMotion.matches) {
      const start = 0.28;
      const end = 0.62;
      const scrubProgress = clamp((progress - start) / (end - start));
      const duration = Number.isFinite(aircraftVideo.duration) ? aircraftVideo.duration : 0;
      if (duration > 0) {
        targetVideoTime = Math.min(duration, 1.15 + scrubProgress * Math.max(0, duration - 1.15));
        seekAircraftVideo();
      }
    }
  }

  function seekAircraftVideo() {
    if (!aircraftVideo || aircraftVideo.seeking || !videoReady || videoFailed) return;
    if (Math.abs(aircraftVideo.currentTime - targetVideoTime) > 0.035) {
      try {
        aircraftVideo.currentTime = targetVideoTime;
      } catch {
        videoFailed = true;
        aircraftStage?.classList.add("video-error");
      }
    }
  }

  function requestAircraftVideo() {
    if (videoRequested || !aircraftVideo || !aircraftSource || prefersReducedMotion.matches) return;
    videoRequested = true;
    aircraftSource.src = aircraftSource.dataset.src;
    aircraftVideo.load();
  }

  function updateRouteScene() {
    if (!routeSection) return;
    const progress = sectionProgress(routeSection);
    const globe = routeSection.querySelector("[data-globe]");
    setVar(routeSection, "--route-p", progress.toFixed(3));
    setVar(globe, "--route-y", `${((0.5 - progress) * 36).toFixed(1)}px`);
  }

  function updateTestimonials() {
    if (!testimonialStage || !testimonialTrack || !testimonialWindow) return;
    const nativeScroll = mobileViewport.matches || prefersReducedMotion.matches;
    const maxDistance = Math.max(0, testimonialTrack.scrollWidth - testimonialWindow.clientWidth);
    const progress = nativeScroll
      ? clamp(testimonialWindow.scrollLeft / Math.max(1, maxDistance))
      : sectionProgress(testimonialSection);

    if (!nativeScroll) {
      testimonialTrack.style.transform = `translate3d(${-maxDistance * progress}px, 0, 0)`;
    }
    setVar(testimonialStage, "--testimonial-p", progress.toFixed(3));

    const activeIndex = Math.min(testimonialCards.length - 1, Math.round(progress * (testimonialCards.length - 1)));
    if (testimonialCount) testimonialCount.textContent = String(activeIndex + 1).padStart(2, "0");
    if (testimonialProgress) testimonialProgress.style.width = `${(progress * 100).toFixed(1)}%`;
  }

  function updateAll() {
    frameRequested = false;
    updateWindowScene();
    updateAircraftScene();
    updateRouteScene();
    updateTestimonials();
  }

  function requestUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateAll);
  }

  if (!prefersReducedMotion.matches) root.classList.add("has-motion");

  if (aircraftVideo && !prefersReducedMotion.matches) {
    const loadObserver = "IntersectionObserver" in window
      ? new IntersectionObserver((entries, observer) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            requestAircraftVideo();
            observer.disconnect();
          }
        }, { rootMargin: "140% 0px" })
      : null;

    if (loadObserver && aircraftStage) loadObserver.observe(aircraftStage);
    else requestAircraftVideo();

    aircraftVideo.addEventListener("loadedmetadata", () => {
      videoReady = true;
      aircraftStage?.classList.add("is-video-ready");
      requestUpdate();
    });
    aircraftVideo.addEventListener("canplay", () => {
      videoReady = true;
      aircraftStage?.classList.add("is-video-ready");
      requestUpdate();
    });
    aircraftVideo.addEventListener("seeked", seekAircraftVideo);
    aircraftVideo.addEventListener("error", () => {
      videoFailed = true;
      videoReady = false;
      aircraftStage?.classList.add("video-error");
      requestUpdate();
    });
  }

  const revealItems = document.querySelectorAll(".benefit-card, .intro-points article");
  if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const setMenuOpen = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    mobileMenu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  };

  menuToggle?.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });
  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.querySelectorAll("[data-booking-open]").forEach((button) => {
    button.addEventListener("click", () => {
      if (bookingDialog && !bookingDialog.open) bookingDialog.showModal();
    });
  });
  document.querySelector(".dialog-close")?.addEventListener("click", () => bookingDialog?.close());
  bookingDialog?.addEventListener("click", (event) => {
    if (event.target === bookingDialog) bookingDialog.close();
  });
  bookingDialog?.addEventListener("close", () => {
    document.body.classList.remove("menu-open");
  });
  bookingForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = bookingForm.querySelector("[data-form-note]");
    if (note) {
      note.textContent = "Your enquiry is ready to review. This local preview does not send or store your details.";
      note.classList.add("is-success");
    }
  });

  if (cursorAura && !mobileViewport.matches && !prefersReducedMotion.matches) {
    window.addEventListener("pointermove", (event) => {
      cursorAura.style.left = `${event.clientX}px`;
      cursorAura.style.top = `${event.clientY}px`;
      cursorAura.classList.add("is-visible");
    }, { passive: true });

    document.querySelectorAll("a, button, input, select").forEach((element) => {
      element.addEventListener("pointerenter", () => cursorAura.classList.add("is-hovering"));
      element.addEventListener("pointerleave", () => cursorAura.classList.remove("is-hovering"));
    });
  }

  if (!mobileViewport.matches && !prefersReducedMotion.matches) {
    const globe = routeSection?.querySelector("[data-globe]");
    globe?.addEventListener("pointermove", (event) => {
      const bounds = globe.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      setVar(globe, "--globe-tilt-x", `${(-y * 5).toFixed(2)}deg`);
      setVar(globe, "--globe-tilt-y", `${(x * 5).toFixed(2)}deg`);
    });
    globe?.addEventListener("pointerleave", () => {
      setVar(globe, "--globe-tilt-x", "0deg");
      setVar(globe, "--globe-tilt-y", "0deg");
    });

    document.querySelectorAll(".magnetic").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left - bounds.width / 2) * 0.12;
        const y = (event.clientY - bounds.top - bounds.height / 2) * 0.12;
        element.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
      element.addEventListener("pointerleave", () => {
        element.style.translate = "0px 0px";
      });
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  testimonialWindow?.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  prefersReducedMotion.addEventListener?.("change", requestUpdate);
  mobileViewport.addEventListener?.("change", requestUpdate);
  requestUpdate();
})();
