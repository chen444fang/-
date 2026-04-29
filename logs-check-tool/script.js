// script.js
console.log('script.js loaded');

let logs = [];

function parseLogs(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const arr = [];
  for (const line of lines) {
    // 基础信息提取
    const timeMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})/);
    const timestamp = timeMatch ? timeMatch[1] : '';
    const logIdMatch = line.match(/LOGID:([^|]+)/);
    const logId = logIdMatch ? logIdMatch[1].trim() : '';
    const userMatch = line.match(/用户ID:([^,]+),/);
    const userId = userMatch ? userMatch[1].trim() : '';
    const uriMatch = line.match(/请求URI:([^,]+),/);
    const uri = uriMatch ? uriMatch[1].trim() : '';
    const ipMatch = line.match(/IP:([^,]+),/);
    const ip = ipMatch ? ipMatch[1].trim() : '';

    // 参数 JSON（请求）
    let request = {};
    const paramIdx = line.indexOf('参数:');
    if (paramIdx !== -1) {
      const afterParam = line.slice(paramIdx + 3);
      // 通过花括号计数寻找完整 JSON
      let brace = 0, end = afterParam.length;
      for (let i = 0; i < afterParam.length; i++) {
        const ch = afterParam[i];
        if (ch === '{') brace++;
        else if (ch === '}') brace--;
        if (brace === 0 && i > 0) { end = i + 1; break; }
      }
      const jsonStr = afterParam.slice(0, end);
      try { request = JSON.parse(jsonStr); } catch (e) { request = {}; }
    }

    // 返回数据 JSON（响应）
    let response = {};
    const respIdx = line.indexOf('返回数据：');
    if (respIdx !== -1) {
      const afterResp = line.slice(respIdx + 5);
      let brace = 0, end = afterResp.length;
      for (let i = 0; i < afterResp.length; i++) {
        const ch = afterResp[i];
        if (ch === '{') brace++;
        else if (ch === '}') brace--;
        if (brace === 0 && i > 0) { end = i + 1; break; }
      }
      const jsonStr = afterResp.slice(0, end);
      try { response = JSON.parse(jsonStr); } catch (e) { response = {}; }
    }

    arr.push({
      timestamp,
      logId,
      userId,
      interface: uri,
      ip,
      request,
      response
    });
  }
  return arr;
}

function renderTable(data) {
  console.log('renderTable called with', data.length, 'records');
  const table = document.getElementById('logTable');
  table.innerHTML = `
    <thead class="bg-gray-300">
      <tr>
        <th class="px-2 py-1">LOGID</th>
        <th class="px-2 py-1">接口</th>
        <th class="px-2 py-1">请求</th>
        <th class="px-2 py-1">响应</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement('tbody');
  const frag = document.createDocumentFragment();
  data.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.dataset.idx = i;
    tr.className = 'border-t';
    // LOGID
    const tdId = document.createElement('td');
    tdId.className = 'px-2 py-1 border';
    tdId.textContent = row.logId;
    tr.appendChild(tdId);
    // 接口
    const tdUri = document.createElement('td');
    tdUri.className = 'px-2 py-1 border';
    tdUri.textContent = row.interface;
    tr.appendChild(tdUri);
    // 请求 JSON
    const tdReq = document.createElement('td');
    tdReq.className = 'px-2 py-1 border';
    const preReq = document.createElement('pre');
    preReq.className = 'bg-gray-50 p-1 rounded overflow-auto';
    const codeReq = document.createElement('code');
    codeReq.className = 'language-json';
    codeReq.textContent = JSON.stringify(row.request, null, 2);
    preReq.appendChild(codeReq);
    tdReq.appendChild(preReq);
    tr.appendChild(tdReq);
    // 响应 JSON
    const tdRes = document.createElement('td');
    tdRes.className = 'px-2 py-1 border';
    const preRes = document.createElement('pre');
    preRes.className = 'bg-gray-50 p-1 rounded overflow-auto';
    const codeRes = document.createElement('code');
    codeRes.className = 'language-json';
    codeRes.textContent = JSON.stringify(row.response, null, 2);
    preRes.appendChild(codeRes);
    tdRes.appendChild(preRes);
    tr.appendChild(tdRes);
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
  table.appendChild(tbody);
  Prism.highlightAll();
}

function applyFilter(term) {
  const t = term.trim().toLowerCase();
  if (!t) return logs;
  return logs.filter(l =>
    l.interface.toLowerCase().includes(t) ||
    l.userId.toLowerCase().includes(t) ||
    l.logId.toLowerCase().includes(t)
  );
}

function showDetail(idx) {
  const log = logs[idx];
  document.getElementById('reqJson').textContent = JSON.stringify(log.request, null, 2);
  document.getElementById('resJson').textContent = JSON.stringify(log.response, null, 2);
  Prism.highlightAll();
  document.getElementById('detailPanel').classList.remove('hidden');
}

// Event listeners

document.getElementById('logInput').addEventListener('input', e => {
  logs = parseLogs(e.target.value);
  renderTable(logs);
});

document.getElementById('filter').addEventListener('input', e => {
  const filtered = applyFilter(e.target.value);
  renderTable(filtered);
});

document.getElementById('logTable').addEventListener('click', e => {
  const tr = e.target.closest('tr[data-index]') || e.target.closest('tr[data-idx]');
  if (tr) showDetail(tr.dataset.idx || tr.dataset.index);
});
