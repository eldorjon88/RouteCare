// Renders a phone -> OTP login flow into `container`.
// Calls onSuccess(user) once the session is stored.
function mountLogin(container, { role = 'patient', onSuccess } = {}) {
  container.innerHTML = `
    <div class="card stack w-narrow mx-auto">
      <h2>Sign in</h2>
      <div class="field">
        <label for="phone">Phone number</label>
        <input id="phone" class="input" inputmode="tel" placeholder="+998901234567" autocomplete="tel" />
      </div>
      <div class="field hidden" id="codeField">
        <label for="code">SMS code</label>
        <input id="code" class="input" inputmode="numeric" placeholder="6-digit code" autocomplete="one-time-code" />
      </div>
      <button id="submitBtn" class="btn btn--block">Send code</button>
      <small id="hint">We'll text you a one-time code.</small>
    </div>`;

  const phone = container.querySelector('#phone');
  const codeField = container.querySelector('#codeField');
  const code = container.querySelector('#code');
  const btn = container.querySelector('#submitBtn');
  const hint = container.querySelector('#hint');
  let stage = 'phone';

  btn.addEventListener('click', () =>
    window.UI.withLoading(btn, async () => {
      if (stage === 'phone') {
        await window.api.requestOtp(phone.value.trim());
        stage = 'code';
        codeField.classList.remove('hidden');
        btn.textContent = 'Verify & continue';
        hint.textContent = 'Enter the code we sent (in dev it prints to the server console).';
        code.focus();
        window.UI.toast('Code sent', 'success');
      } else {
        const { token, user } = await window.api.verifyOtp({
          phone: phone.value.trim(),
          code: code.value.trim(),
          role,
        });
        window.Auth.setSession(token, user);
        window.UI.toast('Signed in', 'success');
        if (onSuccess) onSuccess(user);
      }
    })
  );
}

window.mountLogin = mountLogin;
