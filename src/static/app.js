document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        activityCard.dataset.spotsLeft = spotsLeft;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> <span class="spots-left">${spotsLeft} spots left</span></p>
          <h5>Participants</h5>
          <ul class="participants-list"></ul>
        `;

        const participantsList = activityCard.querySelector(".participants-list");
        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        } else {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            participant.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.className = "remove-participant";
            removeButton.type = "button";
            removeButton.title = `Remove ${email} from ${name}`;
            removeButton.setAttribute("aria-label", removeButton.title);
            removeButton.innerHTML = '<span aria-hidden="true">&#128465;</span>';
            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();
                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                participant.remove();
                if (!participantsList.querySelector(".participant-item")) {
                  const emptyMessage = document.createElement("li");
                  emptyMessage.className = "empty-participants";
                  emptyMessage.textContent = "No participants yet";
                  participantsList.appendChild(emptyMessage);
                }

                const updatedSpotsLeft = Number(activityCard.dataset.spotsLeft) + 1;
                activityCard.dataset.spotsLeft = updatedSpotsLeft;
                activityCard.querySelector(".spots-left").textContent = `${updatedSpotsLeft} spots left`;
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
              } catch (error) {
                removeButton.disabled = false;
                messageDiv.textContent = error.message || "Failed to unregister participant.";
                messageDiv.className = "error";
                console.error("Error unregistering participant:", error);
              }

              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
            });

            participant.appendChild(participantEmail);
            participant.appendChild(removeButton);
            participantsList.appendChild(participant);
          });
        }

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

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
