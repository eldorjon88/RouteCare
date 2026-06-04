// TaskFlow (App 2): auth + tasks (create / list / toggle done / delete).
// Uses the SAME /data endpoint as App 1, but adds the "done" feature.
const root = document.getElementById("app");
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => { window.API.logout(); render(); });

const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; };
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function render() {
  if (window.API.isAuthed()) { logoutBtn.classList.remove("hidden"); await showTasks(); }
  else { logoutBtn.classList.add("hidden"); showAuth(); }
}

function showAuth() {
  root.innerHTML = `
    <div class="card">
      <h2>Sign in to TaskFlow</h2>
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

async function showTasks() {
  let tasks = [];
  try { tasks = await window.API.list(); }
  catch (e) { if (/401|token/i.test(e.message)) { window.API.logout(); return render(); } }

  root.innerHTML = `
    <div class="card">
      <h2>New task</h2>
      <input id="t" class="input" placeholder="What needs doing?"/>
      <button id="add" class="btn">Add task</button>
      <p id="msg" class="msg"></p>
    </div>
    <div id="list"></div>`;

  root.querySelector("#add").onclick = async () => {
    const t = root.querySelector("#t"), msg = root.querySelector("#msg");
    if (!t.value.trim()) { msg.textContent = "Task title is required"; return; }
    try { await window.API.create(t.value.trim(), ""); await showTasks(); }
    catch (e) { msg.textContent = e.message; }
  };

  const list = root.querySelector("#list");
  if (!tasks.length) { list.appendChild(h(`<p class="empty">No tasks yet. Add one above! ✅</p>`)); return; }
  tasks.forEach((t) => {
    const el = h(`<div class="card task ${t.done ? "done" : ""}">
      <input type="checkbox" ${t.done ? "checked" : ""}/>
      <span>${esc(t.title)}</span>
      <button class="link danger">Delete</button>
    </div>`);
    el.querySelector("input").onchange = async (e) => { await window.API.update(t.id, { done: e.target.checked }); await showTasks(); };
    el.querySelector("button").onclick = async () => { await window.API.remove(t.id); await showTasks(); };
    list.appendChild(el);
  });
}

render();
