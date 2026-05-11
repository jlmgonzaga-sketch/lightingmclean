(function () {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (btn && links) {
    btn.addEventListener('click', function () {
      const isOpen = links.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

(function initMobileQuoteForm() {
  const quoteForm = document.getElementById('quoteForm');
  if (!quoteForm) return;

  const SUPABASE_URL = 'https://ujanqdbecobgtsodmjkm.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_ImoCrm2a6Kt0KWphFuRDbw_CP7yOXgS';
  const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const preferredDateInput = quoteForm.querySelector('input[type="date"]');
  const preferredTimeInput = document.getElementById('preferredTime');
  const timeSlots = document.querySelectorAll('.time-slot');
  const availabilityMessage = document.getElementById('availabilityMessage');

  quoteForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const selectedServices = [...quoteForm.querySelectorAll('.quote-checks input[type="checkbox"]:checked')]
      .map((checkbox) => checkbox.parentElement.textContent.trim());

    if (selectedServices.length === 0) {
      alert('Please select at least one service.');
      return;
    }

    if (!preferredTimeInput.value) {
      alert('Please select an available time slot.');
      return;
    }

    if (!supabaseClient) {
      alert('Booking system is still loading. Please refresh and try again.');
      return;
    }

    const textInputs = quoteForm.querySelectorAll('input[type="text"]');
    const formData = {
      services: selectedServices,
      preferred_date: preferredDateInput.value,
      preferred_time: preferredTimeInput.value,
      customer_name: textInputs[0].value,
      phone: quoteForm.querySelector('input[type="tel"]').value,
      email: quoteForm.querySelector('input[type="email"]').value,
      address: textInputs[1].value,
      notes: quoteForm.querySelector('textarea').value,
      status: 'pending'
    };

    const submitBtn = quoteForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const { error } = await supabaseClient.from('quote_requests').insert([formData]);

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    if (error) {
      console.error(error);
      alert('Something went wrong. Please try again.');
      return;
    }

    alert('Quote request submitted successfully!');
    quoteForm.reset();
    preferredTimeInput.value = '';
    timeSlots.forEach((slot) => slot.classList.remove('selected', 'disabled'));
    if (availabilityMessage) availabilityMessage.textContent = 'Select a date to check available times.';
  });

  if (preferredDateInput && preferredTimeInput && timeSlots.length) {
    preferredDateInput.addEventListener('change', checkDateAvailability);

    timeSlots.forEach((slot) => {
      slot.addEventListener('click', () => {
        if (slot.classList.contains('disabled')) return;
        timeSlots.forEach((btn) => btn.classList.remove('selected'));
        slot.classList.add('selected');
        preferredTimeInput.value = slot.dataset.time;
      });
    });
  }

  async function checkDateAvailability() {
    const selectedDate = preferredDateInput.value;
    preferredTimeInput.value = '';
    timeSlots.forEach((slot) => {
      slot.classList.remove('selected', 'disabled');
      slot.disabled = false;
    });

    if (!selectedDate || !supabaseClient) return;
    availabilityMessage.textContent = 'Checking availability...';

    const { data: blockedSlots = [], error: blockedError } = await supabaseClient
      .from('blocked_slots')
      .select('*')
      .eq('blocked_date', selectedDate);

    if (blockedError) {
      console.error(blockedError);
      availabilityMessage.textContent = 'Unable to check availability.';
      return;
    }

    const isFullDayBlocked = blockedSlots.some((slot) => slot.is_full_day);
    if (isFullDayBlocked) {
      timeSlots.forEach((slot) => {
        slot.classList.add('disabled');
        slot.disabled = true;
      });
      availabilityMessage.textContent = 'This date is fully booked. Please choose another date.';
      return;
    }

    const { data: confirmedQuotes = [], error: quoteError } = await supabaseClient
      .from('quote_requests')
      .select('preferred_time')
      .eq('preferred_date', selectedDate)
      .eq('status', 'confirmed');

    if (quoteError) {
      console.error(quoteError);
      availabilityMessage.textContent = 'Unable to check booked times.';
      return;
    }

    const unavailableTimes = [
      ...blockedSlots.filter((slot) => !slot.is_full_day && slot.blocked_time).map((slot) => slot.blocked_time.slice(0, 5)),
      ...confirmedQuotes.map((quote) => quote.preferred_time.slice(0, 5))
    ];

    timeSlots.forEach((slot) => {
      if (unavailableTimes.includes(slot.dataset.time)) {
        slot.classList.add('disabled');
        slot.disabled = true;
      }
    });

    const availableCount = [...timeSlots].filter((slot) => !slot.classList.contains('disabled')).length;
    availabilityMessage.textContent = availableCount > 0
      ? `${availableCount} time slots available.`
      : 'No available time slots for this date.';
  }
})();


(function initQuoteWizard() {
  const form = document.getElementById('quoteForm');
  if (!form) return;
  const panels = [...form.querySelectorAll('.quote-panel')];
  const progress = [...document.querySelectorAll('.progress-step')];
  const showStep = (step) => {
    panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.step === String(step)));
    progress.forEach((item) => item.classList.toggle('active', Number(item.dataset.progress) <= Number(step)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  form.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.next;
      if (next === '2' && !form.querySelector('input[type="checkbox"]:checked')) {
        alert('Please select at least one service.');
        return;
      }
      if (next === '3') {
        const dateInput = form.querySelector('input[type="date"]');
        const preferredTime = document.getElementById('preferredTime');
        if (!dateInput.value) { alert('Please select a preferred date.'); return; }
        if (!preferredTime.value) { alert('Please select an available time slot.'); return; }
      }
      showStep(next);
    });
  });
  form.querySelectorAll('[data-back]').forEach((btn) => btn.addEventListener('click', () => showStep(btn.dataset.back)));
})();
