/* ══════════════════════════════════════════════
   LIGHTNING MCLEAN — script.js
   ══════════════════════════════════════════════ */

'use strict';

const SUPABASE_URL = "https://ujanqdbecobgtsodmjkm.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_ImoCrm2a6Kt0KWphFuRDbw_CP7yOXgS";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ── SCROLL ANIMATION (Intersection Observer) ── */
(function initFadeUp() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
})();


/* ── NAVBAR SCROLL SHADOW ── */
(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load
})();


/* ── MOBILE HAMBURGER MENU ── */
(function initHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when a link is clicked
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();


/* ── SMOOTH SCROLL (fallback for older browsers) ── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


/* ── ACTIVE NAV LINK HIGHLIGHT ── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.style.color = '';
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              if (!link.classList.contains('nav-cta')) {
                link.style.color = 'var(--pink)';
              }
            }
          });
        }
      });
    },
    { threshold: 0.45 }
  );

  sections.forEach((section) => observer.observe(section));
})();


/* ── TICKER PAUSE ON HOVER ── */
(function initTickerHover() {
  const ticker = document.querySelector('.ticker-track');
  if (!ticker) return;

  ticker.addEventListener('mouseenter', () => {
    ticker.style.animationPlayState = 'paused';
  });
  ticker.addEventListener('mouseleave', () => {
    ticker.style.animationPlayState = 'running';
  });
})();


/* ── GALLERY HOVER EXPAND ── */
(function initGalleryHover() {
  const items = document.querySelectorAll('.gallery-item');
  if (!items.length) return;

  items.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      items.forEach((i) => {
        i.style.flex = i === item ? '2' : '0.75';
      });
    });
    item.addEventListener('mouseleave', () => {
      items.forEach((i) => { i.style.flex = ''; });
    });
  });
})();


/* ── STATS COUNTER ANIMATION ── */
(function initCounters() {
  const chips = document.querySelectorAll('.chip-num');
  if (!chips.length) return;

  chips.forEach((chip) => {
    const text = chip.textContent.trim();
    const numMatch = text.match(/(\d+)/);
    if (!numMatch) return;

    const target = parseInt(numMatch[1], 10);
    const suffix = text.replace(numMatch[0], '');
    const duration = 1200;
    const start = performance.now();

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        const animate = (now) => {
          const elapsed = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - elapsed, 3);
          chip.textContent = Math.round(eased * target) + suffix;
          if (elapsed < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.5 });

    observer.observe(chip);
  });
})();

const serviceDetails = {
  window: {
    title: "Window Cleaning",
    tag: "For homes, businesses, and exterior glass surfaces",
    desc: "Our window cleaning service helps brighten your space with clear, streak-free results. We clean interior and exterior glass, frames, and sills with careful attention to detail.",
    includes: ["Interior and exterior glass cleaning", "Frame and sill wipe-down", "Streak-free finishing", "Residential and commercial windows"]
  },
  residential: {
    title: "Residential Cleaning",
    tag: "For regular home care and deep cleaning needs",
    desc: "Our residential cleaning service keeps your home fresh, comfortable, and well-maintained. We focus on visible surfaces, common areas, and detailed cleaning based on your needs.",
    includes: ["General room cleaning", "Kitchen and bathroom cleaning", "Dusting and surface wiping", "Move-in or move-out cleaning support"]
  },
  commercial: {
    title: "Commercial Cleaning",
    tag: "For offices, shops, and business spaces",
    desc: "Our commercial cleaning service helps your business maintain a clean and professional environment for staff, clients, and visitors.",
    includes: ["Office and storefront cleaning", "Floor and surface care", "Trash and debris cleanup", "Flexible cleaning schedule"]
  },
  realestate: {
    title: "Real Estate Cleaning",
    tag: "For listings, handovers, and property turnover",
    desc: "Our real estate cleaning service prepares properties for viewing, move-in, or final handover. We help make the space look clean, polished, and client-ready.",
    includes: ["Move-in and move-out cleaning", "Listing preparation", "Deep surface cleaning", "Final presentation cleanup"]
  },
  debris: {
    title: "Debris Removal",
    tag: "For cleanup after projects, moves, or clutter removal",
    desc: "Our debris removal service helps clear unwanted materials so your space is safer, cleaner, and easier to use.",
    includes: ["Light debris removal", "Post-cleanup clearing", "Clutter and unwanted item removal", "Safe and organized disposal support"]
  }
};

function openServiceModal(service) {
  const data = serviceDetails[service];

  document.getElementById("modalTitle").textContent = data.title;
  document.getElementById("modalTag").textContent = data.tag;
  document.getElementById("modalDesc").textContent = data.desc;

  document.getElementById("modalList").innerHTML = data.includes
    .map(item => `<li>${item}</li>`)
    .join("");

  document.getElementById("serviceModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeServiceModal() {
  document.getElementById("serviceModal").classList.remove("active");
  document.body.style.overflow = "";
}

function openQuotePanel(event) {
  if (event) event.preventDefault();

  document.getElementById("quotePanel").classList.add("active");
  document.getElementById("quotePanelOverlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeQuotePanel() {
  document.getElementById("quotePanel").classList.remove("active");
  document.getElementById("quotePanelOverlay").classList.remove("active");
  document.body.style.overflow = "";
}

const quoteForm = document.getElementById("quoteForm");

if (quoteForm) {
  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedServices = [
      ...quoteForm.querySelectorAll('.quote-checks input[type="checkbox"]:checked')
    ].map((checkbox) => checkbox.parentElement.textContent.trim());

    if (selectedServices.length === 0) {
      alert("Please select at least one service.");
      return;
    }

    const textInputs = quoteForm.querySelectorAll('input[type="text"]');

    const formData = {
      services: selectedServices,
      preferred_date: quoteForm.querySelector('input[type="date"]').value,
      preferred_time: document.getElementById("preferredTime").value,
      customer_name: textInputs[0].value,
      phone: quoteForm.querySelector('input[type="tel"]').value,
      email: quoteForm.querySelector('input[type="email"]').value,
      address: textInputs[1].value,
      notes: quoteForm.querySelector("textarea").value,
      status: "pending"
    };

    const { error } = await supabaseClient
      .from("quote_requests")
      .insert([formData]);

    if (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      return;
    }

    alert("Quote request submitted successfully!");

    quoteForm.reset();
    closeQuotePanel();
  });
}


const preferredDateInput = document.querySelector('.quote-form input[type="date"]');
const preferredTimeInput = document.getElementById("preferredTime");
const timeSlots = document.querySelectorAll(".time-slot");
const availabilityMessage = document.getElementById("availabilityMessage");

if (preferredDateInput && preferredTimeInput && timeSlots.length) {
  preferredDateInput.addEventListener("change", checkDateAvailability);

  timeSlots.forEach((slot) => {
    slot.addEventListener("click", () => {
      if (slot.classList.contains("disabled")) return;

      timeSlots.forEach((btn) => btn.classList.remove("selected"));
      slot.classList.add("selected");
      preferredTimeInput.value = slot.dataset.time;
    });
  });
}

async function checkDateAvailability() {
  const selectedDate = preferredDateInput.value;

  preferredTimeInput.value = "";
  timeSlots.forEach((slot) => {
    slot.classList.remove("selected", "disabled");
    slot.disabled = false;
  });

  if (!selectedDate) return;

  availabilityMessage.textContent = "Checking availability...";

  const { data: blockedSlots, error: blockedError } = await supabaseClient
    .from("blocked_slots")
    .select("*")
    .eq("blocked_date", selectedDate);

  if (blockedError) {
    console.error(blockedError);
    availabilityMessage.textContent = "Unable to check availability.";
    return;
  }

  const isFullDayBlocked = blockedSlots.some((slot) => slot.is_full_day);

  if (isFullDayBlocked) {
    timeSlots.forEach((slot) => {
      slot.classList.add("disabled");
      slot.disabled = true;
    });

    availabilityMessage.textContent = "This date is fully booked. Please choose another date.";
    return;
  }

  const { data: confirmedQuotes, error: quoteError } = await supabaseClient
    .from("quote_requests")
    .select("preferred_time")
    .eq("preferred_date", selectedDate)
    .eq("status", "confirmed");

  if (quoteError) {
    console.error(quoteError);
    availabilityMessage.textContent = "Unable to check booked times.";
    return;
  }

  const unavailableTimes = [
    ...blockedSlots
      .filter((slot) => !slot.is_full_day && slot.blocked_time)
      .map((slot) => slot.blocked_time.slice(0, 5)),

    ...confirmedQuotes.map((quote) => quote.preferred_time.slice(0, 5))
  ];

  timeSlots.forEach((slot) => {
    if (unavailableTimes.includes(slot.dataset.time)) {
      slot.classList.add("disabled");
      slot.disabled = true;
    }
  });

  const availableCount = [...timeSlots].filter(
    (slot) => !slot.classList.contains("disabled")
  ).length;

  availabilityMessage.textContent =
    availableCount > 0
      ? `${availableCount} time slots available.`
      : "No available time slots for this date.";
}