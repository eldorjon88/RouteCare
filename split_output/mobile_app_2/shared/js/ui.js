// Shared UI helpers: toasts + button loading state.
function ensureToastStack() {
  let el = document.querySelector('.toast-stack');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast-stack';
    document.body.appendChild(el);
  }
  return el;
}

function toast(message, type = 'info', timeout = 3000) {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  el.setAttribute('role', 'status');
  ensureToastStack().appendChild(el);
  setTimeout(() => el.remove(), timeout);
}

// Runs an async action while showing a spinner on the button and toasting errors.
async function withLoading(button, fn) {
  const original = button.textContent;
  button.disabled = true;
  button.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
  try {
    return await fn();
  } catch (err) {
    toast(err.message || 'Something went wrong', 'error');
    throw err;
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

window.UI = { toast, withLoading };
