document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let activities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants (${details.participants.length})</h5>
            <div class="participants-content"></div>
          </div>
        `;

        renderParticipants(activityCard.querySelector(".participants-content"), details.participants);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderParticipants(container, participants) {
    container.innerHTML = "";
    if (!participants || participants.length === 0) {
      const p = document.createElement("p");
      p.className = "participants-empty";
      p.textContent = "No participants yet";
      container.appendChild(p);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "participants-list";
    participants.forEach((email) => {
      const li = document.createElement("li");
      li.textContent = email;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activityName = activitySelect.value;

    if (!email || !activityName) {
      showMessage("Please provide an email and choose an activity.", "error");
      return;
    }

    showMessage("Signing up...", "info");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        showMessage(err.detail || "Failed to sign up.", "error");
        return;
      }

      // update local data and UI
      if (!activities[activityName].participants) activities[activityName].participants = [];
      activities[activityName].participants.push(email);
      updateActivityCard(activityName);
      showMessage(`Signed up ${email} for ${activityName}`, "success");
      signupForm.reset();
    } catch (error) {
      showMessage("Network error while signing up.", "error");
      console.error("Error signing up:", error);
    }
  });

  function updateActivityCard(activityName) {
    const card = Array.from(document.querySelectorAll(".activity-card")).find(
      (c) => c.dataset.activity === activityName
    );
    if (!card) return;
    const participantsContent = card.querySelector(".participants-content");
    const participants = activities[activityName].participants || [];
    // update heading count
    const heading = card.querySelector(".participants-section h5");
    if (heading) heading.textContent = `Participants (${participants.length})`;
    renderParticipants(participantsContent, participants);
  }

  function showMessage(text, type = "info") {
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.classList.remove("hidden");
    // auto-hide success messages after a short delay
    if (type === "success") {
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 4000);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initialize app
  fetchActivities();
});
