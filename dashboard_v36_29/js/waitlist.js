// js/waitlist.js
// Handle the marketing "Create my account" trial form on the landing page.
// This keeps things simple for now: show a quick UX response, then send
// the user to the thank-you page.

const trialForm = document.querySelector('form[name="trial"]');

if (trialForm) {
  const submitBtn = trialForm.querySelector('button[type="submit"]');

  trialForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    // Small delay so the button state is visible, then go to thank-you page
    setTimeout(() => {
      window.location.href = 'thank-you.html';
    }, 600);
  });
}
