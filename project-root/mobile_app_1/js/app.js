// QuickNotes (App 1): auth + notes (create / list / delete).
const root = document.getElementById("app");
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => { window.API.logout(); render(); });

const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; };
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function render() {
  if (window.API.isAuthed()) { logoutBtn.classList.remove("hidden"); await showNotes(); }
  else { logoutBtn.classList.add("hidden"); showAuth(); }
}

function showAuth() {
  root.innerHTML = `
    <div class="card">
      <h2>Sign in to QuickNotes</h2>
      <input id="u" class="input" placeholder="Username" autocomplete="username"/>
      <input id="p" class="input" type="password" placeholder="Password" autocomplete="current-password"/>
      <div class="row">
        <button id="loginBtn" class="btn">Log in</button>
        <button id="registerBtn" class="btn btn-outline">Register</button>
      </div>
      <p id="msg" class="msg"></p>
    </div>`;
  const u = root.querySelector("#u"), p = root.querySelector("#p"), msg = root.querySelector("#msg");
  const guard = async (fn) => { msg.textContent = ""; try { await fn(); await render(); } catch (e) { msg.textContent = e.message; } };
  root.querySelector("#loginBtn").onclick = () => guard(() => window.API.login(u.value.trim(), p.value));
  root.querySelector("#registerBtn").onclick = () => guard(async () => {
    await window.API.register(u.value.trim(), p.value);
    await window.API.login(u.value.trim(), p.value);
  });
}

async function showNotes() {
  let notes = [];
  try { notes = await window.API.list(); }
  catch (e) { if (/401|token/i.test(e.message)) { window.API.logout(); return render(); } }

  root.innerHTML = `
    <div class="card">
      <h2>New note</h2>
      <input id="t" class="input" placeholder="Title"/>
      <textarea id="c" class="input" placeholder="Write something..."></textarea>
      <button id="add" class="btn">Add note</button>
      <p id="msg" class="msg"></p>
    </div>
    <div id="list"></div>`;

  root.querySelector("#add").onclick = async () => {
    const t = root.querySelector("#t"), c = root.querySelector("#c"), msg = root.querySelector("#msg");
    if (!t.value.trim()) { msg.textContent = "Title is required"; return; }
    try { await window.API.create(t.value.trim(), c.value.trim()); await showNotes(); }
    catch (e) { msg.textContent = e.message; }
  };

  const list = root.querySelector("#list");
  if (!notes.length) { list.appendChild(h(`<p class="empty">No notes yet.</p>`)); return; }
  notes.forEach((n) => {
    const el = h(`<div class="card note"><div><h3>${esc(n.title)}</h3><p>${esc(n.content)}</p></div><button class="link danger">Delete</button></div>`);
    el.querySelector("button").onclick = async () => { await window.API.remove(n.id); await showNotes(); };
    list.appendChild(el);
  });
}

render();
