// Behaviour for Contact.astro (moved out of the component so the Astro and Next builds share it).
// Submit button carries the Framer Submit Button states (Default / Loading
// with a spinning arrow / Success with a green arrow / Error). No backend: the
// demo submission resolves to Success after 1.2s. Wire your form service here.
const LABEL = { idle: "Send Message", loading: "Sending…", success: "Thank you", error: "Something went wrong" } as const;
document.querySelectorAll<HTMLFormElement>("[data-contact-form]").forEach((form) => {
  const btn = form.querySelector<HTMLButtonElement>(".submit")!;
  const label = btn.querySelector<HTMLElement>("[data-label]")!;
  let state: keyof typeof LABEL = "idle";
  // Framer "Disabled" variant: dimmed until the required email field is valid.
  const idleClass = () => (form.checkValidity() ? "submit" : "submit is-disabled");
  const set = (s: keyof typeof LABEL) => {
    state = s;
    btn.className = s === "idle" ? idleClass() : `submit is-${s}`;
    btn.disabled = s === "loading";
    label.textContent = LABEL[s];
  };
  form.addEventListener("input", () => state === "idle" && (btn.className = idleClass()));
  btn.className = idleClass();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (state === "loading" || state === "success") return;
    set("loading");
    window.setTimeout(() => set("success"), 1200);
  });
});

export {};
