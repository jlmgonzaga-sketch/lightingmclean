const SUPABASE_URL = "https://ujanqdbecobgtsodmjkm.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_ImoCrm2a6Kt0KWphFuRDbw_CP7yOXgS";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
let allQuotes = [];

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Invalid email or password.");
      return;
    }

    window.location.href = "admin-dashboard.html";
  });
}

async function forgotPassword() {
  const email = document.getElementById("adminEmail").value;

  if (!email) {
    alert("Please enter your email first.");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/admin-reset-password.html"
  });

  if (error) {
    alert("Unable to send reset email.");
    return;
  }

  alert("Password reset email sent.");
}

async function loadQuoteRequests() {

  const { data, error } = await supabaseClient
    .from("quote_requests")
   .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const tableBody = document.getElementById("quoteTableBody");

  if (!tableBody) return;

 allQuotes = data;
renderQuoteTable(allQuotes);
}

loadQuoteRequests();

async function logoutAdmin() {
  await supabaseClient.auth.signOut();
  window.location.href = "admin-login.html";
}

async function updateQuoteStatus(id, status) {
  const { data: userData, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !userData.user) {
    alert("You must be logged in to update status.");
    return;
  }

  const { error } = await supabaseClient
    .from("quote_requests")
    .update({
  status: status,
  status_updated_by: userData.user.id,
  status_updated_by_name: userData.user.email,
  status_updated_at: new Date().toISOString()
})
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Unable to update status.");
    return;
  }

  alert("Status updated.");
  loadQuoteRequests();
  renderMonthlyCalendar();
}

const adminCalendarDate = document.getElementById("adminCalendarDate");
const adminTimeButtons = document.querySelectorAll("#adminTimeGrid button");
const adminCalendarNote = document.getElementById("adminCalendarNote");

if (adminCalendarDate) {
  adminCalendarDate.addEventListener("change", loadAdminCalendarDay);
}

adminTimeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const selectedDate = adminCalendarDate.value;
    const selectedTime = button.dataset.time;

    if (!selectedDate) {
      alert("Please select a date first.");
      return;
    }

    if (button.classList.contains("confirmed")) {
      alert("This time has a confirmed booking and cannot be blocked here.");
      return;
    }

    if (button.classList.contains("blocked")) {
      await unblockTimeSlot(selectedDate, selectedTime);
    } else {
      await blockTimeSlot(selectedDate, selectedTime);
    }

    loadAdminCalendarDay();
    renderMonthlyCalendar();
  });
});

async function loadAdminCalendarDay() {
  const selectedDate = adminCalendarDate.value;

  if (!selectedDate) return;

  adminCalendarNote.textContent = "Loading availability...";

 adminTimeButtons.forEach((button) => {
  button.classList.remove("blocked", "confirmed");
  button.disabled = false;
  button.innerHTML = button.dataset.label || button.textContent;
});

  const { data: blockedSlots, error: blockedError } = await supabaseClient
    .from("blocked_slots")
    .select("*")
    .eq("blocked_date", selectedDate);

  if (blockedError) {
    console.error(blockedError);
    adminCalendarNote.textContent = "Unable to load blocked slots.";
    return;
  }

  const { data: confirmedQuotes, error: quoteError } = await supabaseClient
    .from("quote_requests")
    .select("preferred_time, customer_name")
    .eq("preferred_date", selectedDate)
    .eq("status", "confirmed");

  if (quoteError) {
    console.error(quoteError);
    adminCalendarNote.textContent = "Unable to load confirmed bookings.";
    return;
  }

  const isFullDayBlocked = blockedSlots.some((slot) => slot.is_full_day);

  if (isFullDayBlocked) {
    adminTimeButtons.forEach((button) => {
      button.classList.add("blocked");
    });

    adminCalendarNote.textContent = "This full day is blocked.";
    return;
  }

  const blockedTimes = blockedSlots
    .filter((slot) => !slot.is_full_day && slot.blocked_time)
    .map((slot) => slot.blocked_time.slice(0, 5));

  const confirmedBookings = confirmedQuotes.map((quote) => ({
  time: quote.preferred_time.slice(0, 5),
  name: quote.customer_name
}));

  adminTimeButtons.forEach((button) => {
    if (blockedTimes.includes(button.dataset.time)) {
      button.classList.add("blocked");
    }

    const confirmedBooking = confirmedBookings.find(
  (booking) => booking.time === button.dataset.time
);

if (confirmedBooking) {
  button.classList.add("confirmed");
  button.disabled = true;
  button.innerHTML = `${button.textContent}<br><small>${confirmedBooking.name}</small>`;
}
  });

adminCalendarNote.textContent =
  `${blockedTimes.length} blocked time(s), ${confirmedBookings.length} confirmed booking(s).`;
}

async function blockTimeSlot(date, time) {
  const { error } = await supabaseClient
    .from("blocked_slots")
    .insert([
      {
        blocked_date: date,
        blocked_time: time,
        is_full_day: false,
        reason: "Blocked by admin"
      }
    ]);

  if (error) {
    console.error(error);
    alert("Unable to block this time.");
  }
}

async function unblockTimeSlot(date, time) {
  const { error } = await supabaseClient
    .from("blocked_slots")
    .delete()
    .eq("blocked_date", date)
    .eq("blocked_time", time)
    .eq("is_full_day", false);

  if (error) {
    console.error(error);
    alert("Unable to unblock this time.");
  }
}

async function blockFullDay() {
  const selectedDate = adminCalendarDate.value;

  if (!selectedDate) {
    alert("Please select a date first.");
    return;
  }

  const { error } = await supabaseClient
    .from("blocked_slots")
    .insert([
      {
        blocked_date: selectedDate,
        blocked_time: null,
        is_full_day: true,
        reason: "Full day blocked by admin"
      }
    ]);

  if (error) {
    console.error(error);
    alert("Unable to block full day.");
    return;
  }

  loadAdminCalendarDay();
  renderMonthlyCalendar();
}

async function unblockFullDay() {
  const selectedDate = adminCalendarDate.value;

  if (!selectedDate) {
    alert("Please select a date first.");
    return;
  }

  const { error } = await supabaseClient
    .from("blocked_slots")
    .delete()
    .eq("blocked_date", selectedDate)
    .eq("is_full_day", true);

  if (error) {
    console.error(error);
    alert("Unable to unblock full day.");
    return;
  }

  loadAdminCalendarDay();
  renderMonthlyCalendar();
}

function openQuoteDetails(quote) {
  document.getElementById("detailCustomerName").textContent = quote.customer_name;
  document.getElementById("detailEmail").textContent = quote.email;
  document.getElementById("detailPhone").textContent = quote.phone;
  document.getElementById("detailAddress").textContent = quote.address;

  document.getElementById("detailSchedule").textContent =
    `${quote.preferred_date} at ${quote.preferred_time}`;

  document.getElementById("detailServices").textContent =
    quote.services.join(", ");

  document.getElementById("detailStatus").textContent =
    quote.status;

  document.getElementById("detailUpdatedBy").textContent =
    quote.status_updated_by_name || "Not updated yet";

  document.getElementById("detailUpdatedAt").textContent =
    quote.status_updated_at
      ? new Date(quote.status_updated_at).toLocaleString()
      : "Not updated yet";

  document.getElementById("detailNotes").textContent =
    quote.notes || "No additional notes.";

  document.getElementById("quoteDetailsOverlay").classList.add("active");
  document.getElementById("quoteDetailsModal").classList.add("active");
}

function closeQuoteDetails() {
  document.getElementById("quoteDetailsOverlay").classList.remove("active");
  document.getElementById("quoteDetailsModal").classList.remove("active");
}

function renderQuoteTable(quotes) {

  const tableBody = document.getElementById("quoteTableBody");

  if (!tableBody) return;

  tableBody.innerHTML = quotes.map((quote) => `

    <tr onclick='openQuoteDetails(${JSON.stringify(quote)})'>

      <td>
        <strong>${quote.customer_name}</strong><br>
        ${quote.email}<br>
        ${quote.phone}
      </td>

      <td>
        ${quote.services.join(", ")}
      </td>

      <td>
        ${quote.preferred_date}
      </td>

      <td>
        ${quote.preferred_time}
      </td>

      <td onclick="event.stopPropagation()">

        <select class="status-select"
          onchange="updateQuoteStatus('${quote.id}', this.value)">

          <option value="pending"
            ${quote.status === "pending" ? "selected" : ""}>
            Pending
          </option>

          <option value="confirmed"
            ${quote.status === "confirmed" ? "selected" : ""}>
            Confirmed
          </option>

          <option value="completed"
            ${quote.status === "completed" ? "selected" : ""}>
            Completed
          </option>

          <option value="cancelled"
            ${quote.status === "cancelled" ? "selected" : ""}>
            Cancelled
          </option>

        </select>

      </td>

      <td>
        ${quote.status_updated_by_name || "Not updated yet"}
      </td>

      <td>
        ${quote.status_updated_at
          ? new Date(quote.status_updated_at).toLocaleString()
          : "Not updated yet"}
      </td>

    </tr>

  `).join("");
}

const quoteSearchInput =
  document.getElementById("quoteSearchInput");

const quoteStatusFilter =
  document.getElementById("quoteStatusFilter");

const quoteDateFilter =
  document.getElementById("quoteDateFilter");

[quoteSearchInput, quoteStatusFilter, quoteDateFilter]
.forEach((filter) => {

  if (filter) {
    filter.addEventListener("input", applyQuoteFilters);
    filter.addEventListener("change", applyQuoteFilters);
  }

});

function applyQuoteFilters() {

  const searchValue =
    quoteSearchInput.value.toLowerCase();

  const statusValue =
    quoteStatusFilter.value;

  const dateValue =
    quoteDateFilter.value;

  const filteredQuotes = allQuotes.filter((quote) => {

    const matchesSearch =
      quote.customer_name.toLowerCase().includes(searchValue)
      ||
      quote.email.toLowerCase().includes(searchValue)
      ||
      quote.phone.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusValue === "all"
      ||
      quote.status === statusValue;

    const matchesDate =
      !dateValue
      ||
      quote.preferred_date === dateValue;

    return matchesSearch
      &&
      matchesStatus
      &&
      matchesDate;

  });

  renderQuoteTable(filteredQuotes);
}

function clearQuoteFilters() {

  quoteSearchInput.value = "";

  quoteStatusFilter.value = "all";

  quoteDateFilter.value = "";

  renderQuoteTable(allQuotes);
}

let currentCalendarDate = new Date();

async function renderMonthlyCalendar() {
  const grid = document.getElementById("monthlyCalendarGrid");
  const title = document.getElementById("monthlyCalendarTitle");

  if (!grid || !title) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  title.textContent = currentCalendarDate.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  grid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  for (let i = 0; i < startDay; i++) {
    grid.innerHTML += `<div class="calendar-day empty"></div>`;
  }

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data: blockedSlots } = await supabaseClient
    .from("blocked_slots")
    .select("*")
    .gte("blocked_date", startDate)
    .lte("blocked_date", endDate);

  const { data: confirmedQuotes } = await supabaseClient
    .from("quote_requests")
    .select("preferred_date, preferred_time")
    .eq("status", "confirmed")
    .gte("preferred_date", startDate)
    .lte("preferred_date", endDate);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dayBlockedSlots = (blockedSlots || []).filter(
      slot => slot.blocked_date === dateString
    );

    const dayConfirmedQuotes = (confirmedQuotes || []).filter(
      quote => quote.preferred_date === dateString
    );

    const isFullDayBlocked = dayBlockedSlots.some(slot => slot.is_full_day);

    const blockedTimeCount = dayBlockedSlots.filter(
      slot => !slot.is_full_day && slot.blocked_time
    ).length;

    const confirmedCount = dayConfirmedQuotes.length;

    const totalUnavailable = blockedTimeCount + confirmedCount;

    let statusClass = "available";
    let statusText = "Available";

    if (isFullDayBlocked) {
      statusClass = "blocked";
      statusText = "Blocked";
    } else if (totalUnavailable >= 9) {
      statusClass = "full";
      statusText = "Fully Booked";
    } else if (totalUnavailable > 0) {
      statusClass = "partial";
      statusText = `${9 - totalUnavailable} Slots Left`;
    }

    grid.innerHTML += `
      <div class="calendar-day ${statusClass}" onclick="selectCalendarDate('${dateString}')">
        <span class="calendar-day-number">${day}</span>
        <span class="calendar-day-status">${statusText}</span>
      </div>
    `;
  }
}

function changeCalendarMonth(direction) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
  renderMonthlyCalendar();
}

function selectCalendarDate(dateString) {
  const dateInput = document.getElementById("adminCalendarDate");

  if (!dateInput) return;

  dateInput.value = dateString;
  loadAdminCalendarDay();
  renderMonthlyCalendar();

  document.querySelector(".admin-calendar-card").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

renderMonthlyCalendar();