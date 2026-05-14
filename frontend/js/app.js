const API = "http://localhost:8000/api";

// 상태 한글 레이블 및 스타일
const STATUS_CONFIG = {
  todo:        { label: "할 일",   badge: "bg-slate-100 text-slate-600",   btn: "bg-slate-500 hover:bg-slate-600" },
  in_progress: { label: "진행 중", badge: "bg-yellow-100 text-yellow-700", btn: "bg-yellow-500 hover:bg-yellow-600" },
  done:        { label: "완료",    badge: "bg-green-100 text-green-700",   btn: "bg-green-500 hover:bg-green-600" },
};

const STATUS_ORDER = ["todo", "in_progress", "done"];

// 다음 상태 반환 (done 이후는 없음)
function nextStatus(current) {
  const idx = STATUS_ORDER.indexOf(current);
  return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}

async function fetchTasks() {
  const res = await fetch(`${API}/tasks`);
  return res.json();
}

async function createTask(title, description) {
  const res = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  return res.json();
}

async function updateStatus(id, status) {
  const res = await fetch(`${API}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

async function deleteTask(id) {
  await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
}

// 칸반 보드 렌더링
async function render() {
  const tasks = await fetchTasks();

  STATUS_ORDER.forEach((status) => {
    const col = document.getElementById(`col-${status}`);
    const count = document.getElementById(`count-${status}`);
    const filtered = tasks.filter((t) => t.status === status);

    count.textContent = filtered.length;

    col.innerHTML = filtered.length === 0
      ? `<p class="text-center text-slate-400 text-sm py-8">업무 없음</p>`
      : filtered.map((task) => renderCard(task)).join("");

    // 이벤트 연결
    col.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await deleteTask(btn.dataset.delete);
        render();
      });
    });

    col.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await updateStatus(btn.dataset.id, btn.dataset.next);
        render();
      });
    });
  });
}

function renderCard(task) {
  const cfg = STATUS_CONFIG[task.status];
  const next = nextStatus(task.status);
  const nextCfg = next ? STATUS_CONFIG[next] : null;
  const date = new Date(task.created_at).toLocaleDateString("ko-KR");

  return `
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col gap-2">
      <div class="flex items-start justify-between gap-2">
        <span class="font-semibold text-slate-800 leading-snug">${escapeHtml(task.title)}</span>
        <button data-delete="${task.id}"
          class="shrink-0 text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
          title="삭제">×</button>
      </div>
      ${task.description ? `<p class="text-sm text-slate-500">${escapeHtml(task.description)}</p>` : ""}
      <div class="flex items-center justify-between mt-1">
        <span class="text-xs ${cfg.badge} px-2 py-0.5 rounded-full font-medium">${cfg.label}</span>
        <span class="text-xs text-slate-300">${date}</span>
      </div>
      ${nextCfg ? `
        <button data-next="${next}" data-id="${task.id}"
          class="mt-1 w-full text-xs text-white ${nextCfg.btn} rounded-lg py-1.5 transition-colors font-medium">
          → ${nextCfg.label}로 이동
        </button>` : ""}
    </div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 업무 추가 폼 처리
document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const titleInput = document.getElementById("title");
  const descInput  = document.getElementById("description");
  const title = titleInput.value.trim();
  if (!title) return;

  await createTask(title, descInput.value.trim() || null);
  titleInput.value = "";
  descInput.value  = "";
  render();
});

render();
