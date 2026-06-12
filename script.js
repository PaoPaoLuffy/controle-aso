// --- DADOS INICIAIS DA BASE DE ASOS ---
// Array vazio por segurança — dados ficam apenas no localStorage do usuário.
// Para popular o sistema, utilize o botão "Importar Backup" na aba Dashboard.
const initialData = [];

// --- VARIÁVEIS DE ESTADO (ASO) ---
let employees = [];
let currentMonthFilter = "";
let chartStatusInstance = null;
let chartMonthInstance = null;

const monthsPT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// --- VARIÁVEIS DE ESTADO (TAREFAS) ---
let tasks = [];
let currentTaskFilter = "Todas";

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    loadTasks();
    renderControle();
    
    // Intercepta a submissão do formulário de tarefas
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTask();
        });
    }
});

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function loadData() {
    const saved = localStorage.getItem('spidey_asos_v2'); 
    if (saved && saved !== '[]') {
        employees = JSON.parse(saved);
    } else {
        employees = [...initialData];
        saveData();
    }
}

function saveData() {
    localStorage.setItem('spidey_asos_v2', JSON.stringify(employees));
}

// --- ARMAZENAMENTO COMPARTILHADO DE TAREFAS ---
function loadTasks() {
    const savedTasks = localStorage.getItem('op_tasks_v1');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        tasks = [];
    }
}

function saveTasksState() {
    localStorage.setItem('op_tasks_v1', JSON.stringify(tasks));
}

// --- NAVEGAÇÃO ENTRE ABAS COMPATÍVEL ---
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'controle') {
        document.getElementById('btn-tab-controle').classList.add('active');
        renderControle();
    } else if (tabId === 'dashboard') {
        document.getElementById('btn-tab-dashboard').classList.add('active');
        renderDashboard();
    } else if (tabId === 'tarefas') {
        document.getElementById('btn-tab-tarefas').classList.add('active');
        renderTasks();
    }
}

// --- UTILITÁRIOS DE DATA ---
function getMonthYearString(dateStr) {
    const parts = dateStr.split('-');
    const monthIndex = parseInt(parts[1]) - 1;
    const year = parts[0];
    return `${monthsPT[monthIndex]} ${year}`;
}

function isValidDate(dateStr) {
    const inputDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    
    const inputYear = inputDate.getFullYear();
    const inputMonth = inputDate.getMonth();
    
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (inputYear < currentYear) return false;
    if (inputYear === currentYear && inputMonth < currentMonth) return false;
    
    return true;
}

function formatDateBR(dateStr) {
    if(!dateStr) return "";
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// --- CONTROLE DE ASO (PRESERVADO) ---
function renderControle() {
    const monthFiltersContainer = document.getElementById('month-filters');
    const employeeListContainer = document.getElementById('employee-list');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    employees.sort((a, b) => new Date(a.date) - new Date(b.date));

    const uniqueYearMonths = [...new Set(employees.map(emp => emp.date.substring(0, 7)))];
    uniqueYearMonths.sort(); 
    
    const uniqueMonths = uniqueYearMonths.map(ym => {
        const [year, month] = ym.split('-');
        return `${monthsPT[parseInt(month) - 1]} ${year}`;
    });

    if (!currentMonthFilter && uniqueMonths.length > 0) {
        currentMonthFilter = uniqueMonths[0];
    } else if (uniqueMonths.length > 0 && !uniqueMonths.includes(currentMonthFilter)) {
        currentMonthFilter = uniqueMonths[0];
    }

    monthFiltersContainer.innerHTML = '';
    uniqueMonths.forEach(month => {
        const btn = document.createElement('button');
        btn.className = `month-btn ${month === currentMonthFilter ? 'active' : ''}`;
        btn.innerText = month.split(' ')[0]; 
        btn.onclick = () => {
            currentMonthFilter = month;
            renderControle();
        };
        monthFiltersContainer.appendChild(btn);
    });

    let filteredEmps = employees.filter(emp => getMonthYearString(emp.date) === currentMonthFilter);
    if (searchTerm) {
        filteredEmps = filteredEmps.filter(emp => emp.name.toLowerCase().includes(searchTerm));
    }

    employeeListContainer.innerHTML = '';
    if (filteredEmps.length === 0) {
        employeeListContainer.innerHTML = '<p style="color: gray; padding: 15px;">Nenhum colaborador encontrado para este filtro.</p>';
        return;
    }

    filteredEmps.forEach(emp => {
        const card = document.createElement('div');
        const statusClass = emp.status.split(' ')[0]; 
        card.className = `emp-card status-${statusClass}`;
        
        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn edit" onclick="openEditModal('${emp.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteEmployee('${emp.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
            <h4>${emp.name}</h4>
            <div class="emp-date"><i class="fa-regular fa-calendar"></i> ${formatDateBR(emp.date)}</div>
            <select class="emp-status-select" onchange="changeStatus('${emp.id}', this.value)" style="color: var(--status-${statusClass.toLowerCase()}); border: 1px solid var(--status-${statusClass.toLowerCase()})">
                <option value="Pendente" ${emp.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                <option value="Agendado" ${emp.status === 'Agendado' ? 'selected' : ''}>Agendado</option>
                <option value="Aguardando Liberação" ${emp.status === 'Aguardando Liberação' ? 'selected' : ''}>Aguardando Liberação</option>
                <option value="Concluído" ${emp.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
            </select>
        `;
        employeeListContainer.appendChild(card);
    });
}

function filterByName() {
    renderControle();
}

function addEmployee(e) {
    e.preventDefault();
    const nameInput = document.getElementById('add-name');
    const dateInput = document.getElementById('add-date');
    const errorMsg = document.getElementById('date-error');

    errorMsg.innerText = '';

    if (!isValidDate(dateInput.value)) {
        errorMsg.innerText = "Erro: Não é permitido cadastrar meses/anos anteriores ao atual.";
        return;
    }

    const newEmp = {
        id: generateId(),
        name: nameInput.value.toUpperCase(),
        date: dateInput.value,
        status: 'Pendente'
    };

    employees.push(newEmp);
    saveData();
    currentMonthFilter = getMonthYearString(newEmp.date);
    nameInput.value = '';
    dateInput.value = '';
    renderControle();
}

function deleteEmployee(id) {
    if(confirm("Tem certeza que deseja excluir este colaborador?")) {
        employees = employees.filter(emp => emp.id !== id);
        saveData();
        renderControle();
    }
}

function changeStatus(id, newStatus) {
    const emp = employees.find(e => e.id === id);
    if (emp) {
        emp.status = newStatus;
        saveData();
        renderControle();
    }
}

function openEditModal(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('edit-id').value = emp.id;
    document.getElementById('edit-name').value = emp.name;
    document.getElementById('edit-date').value = emp.date;
    document.getElementById('edit-status').value = emp.status;
    document.getElementById('edit-date-error').innerText = '';

    document.getElementById('edit-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function saveEdit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value.toUpperCase();
    const date = document.getElementById('edit-date').value;
    const status = document.getElementById('edit-status').value;
    const errorMsg = document.getElementById('edit-date-error');

    if (!isValidDate(date)) {
        errorMsg.innerText = "Erro: Data não pode ser anterior ao mês atual.";
        return;
    }

    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
        employees[index].name = name;
        employees[index].date = date;
        employees[index].status = status;
        
        saveData();
        currentMonthFilter = getMonthYearString(date); 
        closeModal();
        renderControle();
    }
}

// --- DASHBOARD (ATUALIZADO SEM PERDER ASOS GRÁFICOS) ---
function renderDashboard() {
    const total = employees.length;
    const pendentes = employees.filter(e => e.status === 'Pendente').length;
    const agendados = employees.filter(e => e.status === 'Agendado').length;
    const aguardando = employees.filter(e => e.status === 'Aguardando Liberação').length;
    const concluidos = employees.filter(e => e.status === 'Concluído').length;

    // Contador de Tarefas independentes adicionado ao Dashboard
    const tarefasPendentes = tasks.filter(t => t.status === 'Em andamento').length;

    if(document.getElementById('dash-total')) document.getElementById('dash-total').innerText = total;
    if(document.getElementById('dash-pendentes')) document.getElementById('dash-pendentes').innerText = pendentes;
    if(document.getElementById('dash-aguardando')) document.getElementById('dash-aguardando').innerText = aguardando;
    if(document.getElementById('dash-concluidos')) document.getElementById('dash-concluidos').innerText = concluidos;
    if(document.getElementById('dash-agendados')) document.getElementById('dash-agendados').innerText = agendados;
    
    // Injeção dinâmica do contador de Tarefas
    if(document.getElementById('dash-tarefas-pendentes')) {
        document.getElementById('dash-tarefas-pendentes').innerText = tarefasPendentes;
    }

    renderAlerts();

    const tableBody = document.getElementById('table-pendentes');
    tableBody.innerHTML = '';
    const pendentesList = employees.filter(e => e.status === 'Pendente');
    pendentesList.sort((a, b) => new Date(a.date) - new Date(b.date));

    pendentesList.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.name}</td>
            <td>${formatDateBR(emp.date)}</td>
            <td>${getMonthYearString(emp.date).split(' ')[0]}</td>
        `;
        tableBody.appendChild(tr);
    });

    renderCharts(pendentes, agendados, aguardando, concluidos);
}

function renderAlerts() {
    const alertsContainer = document.getElementById('alerts-list');
    alertsContainer.innerHTML = '';
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const upcoming = employees.filter(emp => emp.status !== 'Concluído').map(emp => {
        const empDate = new Date(emp.date + 'T00:00:00');
        const diffTime = empDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...emp, days: diffDays };
    });

    const alerts = upcoming.filter(emp => emp.days <= 30);
    alerts.sort((a, b) => a.days - b.days);

    if(alerts.length === 0) {
        alertsContainer.innerHTML = '<p style="color: gray; padding: 5px;">Nenhum vencimento próximo.</p>';
        return;
    }

    alerts.forEach(emp => {
        let urgencyClass = 'notice'; 
        let text = `Vence em ${emp.days} dias`;
        
        if (emp.days <= 7) {
            urgencyClass = 'urgent'; 
            text = emp.days < 0 ? `Atrasado há ${Math.abs(emp.days)} dias` : (emp.days === 0 ? 'Vence HOJE' : `Vence em ${emp.days} dias`);
        } else if (emp.days <= 15) {
            urgencyClass = 'warning'; 
        }

        const div = document.createElement('div');
        div.className = `alert-item ${urgencyClass}`;
        div.innerHTML = `<strong>${emp.name}</strong> - ${text} (${formatDateBR(emp.date)})`;
        alertsContainer.appendChild(div);
    });
}

function renderCharts(pendentes, agendados, aguardando, concluidos) {
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    const ctxMonth = document.getElementById('monthChart').getContext('2d');

    if (chartStatusInstance) chartStatusInstance.destroy();
    chartStatusInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Pendente', 'Agendado', 'Aguardando Lib.', 'Concluído'],
            datasets: [{
                data: [pendentes, agendados, aguardando, concluidos],
                backgroundColor: ['#b71c1c', '#0288D1', '#F57F17', '#2E7D32'], 
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Distribuição de Status' }
            }
        }
    });

    const uniqueYearMonths = [...new Set(employees.map(emp => emp.date.substring(0, 7)))];
    uniqueYearMonths.sort();

    const labelsMonth = uniqueYearMonths.map(ym => {
        const [year, month] = ym.split('-');
        return monthsPT[parseInt(month) - 1];
    });

    const dataMonth = uniqueYearMonths.map(ym => {
        return employees.filter(emp => emp.date.substring(0, 7) === ym).length;
    });

    if (chartMonthInstance) chartMonthInstance.destroy();
    chartMonthInstance = new Chart(ctxMonth, {
        type: 'bar',
        data: {
            labels: labelsMonth,
            datasets: [{
                label: 'Vencimentos',
                data: dataMonth,
                backgroundColor: '#0D47A1',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Vencimentos por Mês' }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// --- EXPORTAÇÕES E BACKUP DE ASOS ---
function exportToExcel() {
    if (employees.length === 0) return alert("Nenhum dado disponível para exportar.");
    const wsData = employees.map(emp => ({
        "Nome": emp.name,
        "Vencimento": formatDateBR(emp.date),
        "Mês": getMonthYearString(emp.date).split(' ')[0],
        "Status": emp.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ASOs");
    XLSX.writeFile(wb, "Controle_ASO_Spider.xlsx");
}

function exportToPDF() {
    if (employees.length === 0) return alert("Nenhum dado disponível para exportar.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Controle de ASOs", 14, 15);
    doc.setFontSize(10);
    doc.text(`Data da exportação: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

    const tableData = employees.map(emp => [
        emp.name, 
        formatDateBR(emp.date), 
        getMonthYearString(emp.date).split(' ')[0], 
        emp.status
    ]);

    doc.autoTable({
        startY: 30,
        head: [['Nome', 'Vencimento', 'Mês', 'Status']],
        body: tableData,
        headStyles: { fillColor: [13, 71, 161] }, 
        theme: 'striped'
    });

    doc.save("Relatorio_ASO_Spider.pdf");
}

function exportBackup() {
    if (employees.length === 0) return alert("Nenhum dado para exportar backup.");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(employees));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "backup_asos_" + new Date().getTime() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if(Array.isArray(importedData)) {
                employees = importedData;
                saveData();
                alert("Backup restaurado com sucesso!");
                renderControle();
            } else {
                alert("Arquivo JSON inválido.");
            }
        } catch(err) {
            alert("Erro ao ler o arquivo. Certifique-se de que é um backup válido.");
        }
    };
    reader.readAsText(file);
}

// Fechamento de janela para fechar o modal padrão de ASO se clicar fora
window.onclick = function(event) {
    const modalAso = document.getElementById('edit-modal');
    const modalTask = document.getElementById('task-modal');
    if (event.target === modalAso) closeModal();
    if (event.target === modalTask) closeTaskModal();
}


// ==========================================
// --- MÓDULO EXCLUSIVO: DIÁRIO DE TAREFAS ---
// ==========================================

function renderTasks() {
    const taskGrid = document.getElementById('task-list');
    const searchVal = document.getElementById('task-search-input').value.toLowerCase();
    
    if(!taskGrid) return;

    // SISTEMA DE ORDENAÇÃO CRONOLÓGICA & PRIORIDADES
    const urgencyWeight = { 'Urgente': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
    
    tasks.sort((a, b) => {
        // Regra 1: Concluídas sempre por último
        if (a.status === 'Concluída' && b.status !== 'Concluída') return 1;
        if (a.status !== 'Concluída' && b.status === 'Concluída') return -1;
        
        // Regra 2: Prioridade por nível de Urgência
        if (a.status !== 'Concluída') {
            if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
                return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
            }
        }
        
        // Regra 3: Dentro da mesma prioridade, ordenar por data de criação
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // Filtros em Tempo Real
    let filtered = tasks;
    if (currentTaskFilter !== 'Todas') {
        filtered = filtered.filter(t => t.status === currentTaskFilter);
    }
    if (searchVal) {
        filtered = filtered.filter(t => t.name.toLowerCase().includes(searchVal));
    }

    taskGrid.innerHTML = '';
    if(filtered.length === 0) {
        taskGrid.innerHTML = '<p style="color: #705c53; padding: 15px; font-style: italic;">Nenhuma tarefa encontrada neste quadrante.</p>';
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    filtered.forEach(task => {
        const card = document.createElement('div');
        
        // Determinar Alertas Visuais de Prazos
        let alertDeadlineClass = '';
        let deadlineInfoHTML = '';

        if (task.deadline) {
            const dDate = new Date(task.deadline + 'T00:00:00');
            const diffTime = dDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (task.status !== 'Concluída') {
                if (diffDays < 0) {
                    alertDeadlineClass = 'task-deadline-overdue'; // Vermelho
                } else if (diffDays < 3) {
                    alertDeadlineClass = 'task-deadline-imminent'; // Laranja
                } else if (diffDays < 7) {
                    alertDeadlineClass = 'task-deadline-near'; // Amarelo
                }
            }

            const formatDaysText = diffDays < 0 ? `Vencida há ${Math.abs(diffDays)} dias` : (diffDays === 0 ? 'Vence hoje!' : `${diffDays} dias restantes`);
            deadlineInfoHTML = `<div class="op-task-meta"><i class="fa-solid fa-hourglass-half"></i> Prazo: ${formatDateBR(task.deadline)} (${formatDaysText})</div>`;
        } else {
            deadlineInfoHTML = `<div class="op-task-meta"><i class="fa-solid fa-infinity"></i> Sem prazo definido</div>`;
        }

        const isChecked = task.status === 'Concluída' ? 'checked' : '';
        const cardStyleClass = task.status === 'Concluída' ? 'concluida-style' : '';

        // Cor de Borda Esquerda Baseada no Nível de Urgência
        let urgencyColor = '#2e7d32'; // Baixa
        if (task.urgency === 'Média') urgencyColor = '#f57f17';
        if (task.urgency === 'Alta') urgencyColor = '#e65100';
        if (task.urgency === 'Urgente') urgencyColor = '#c62828';

        card.className = `op-task-card ${alertDeadlineClass} ${cardStyleClass}`;
        card.style.borderLeftColor = urgencyColor;

        card.innerHTML = `
            <div class="op-task-checkbox-area">
                <input type="checkbox" class="op-task-checkbox" ${isChecked} onchange="toggleTaskStatus('${task.id}', this.checked)">
            </div>
            <div class="op-task-main">
                <div class="op-task-actions">
                    <button class="op-action-btn" onclick="openTaskModal('${task.id}')" title="Editar"><i class="fa-solid fa-marker"></i></button>
                    <button class="op-action-btn" onclick="deleteTask('${task.id}')" title="Remover"><i class="fa-solid fa-skull"></i></button>
                </div>
                <h4>${task.name}</h4>
                ${task.description ? `<div class="op-task-desc-text">${task.description}</div>` : ''}
                ${deadlineInfoHTML}
                <div class="op-task-meta"><i class="fa-solid fa-compass"></i> Criada em: ${new Date(task.createdAt).toLocaleDateString('pt-BR')}</div>
                <span class="op-badge urg-${task.urgency.toLowerCase()}">${task.urgency}</span>
            </div>
        `;
        taskGrid.appendChild(card);
    });
}

function setTaskFilter(filterType) {
    currentTaskFilter = filterType;
    document.querySelectorAll('#task-filters .op-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.trim() === 'Todas' && filterType === 'Todas') btn.classList.add('active');
        if(btn.innerText.trim() === 'Em Andamento' && filterType === 'Em andamento') btn.classList.add('active');
        if(btn.innerText.trim() === 'Concluídas' && filterType === 'Concluída') btn.classList.add('active');
    });
    renderTasks();
}

function filterTasks() {
    renderTasks();
}

function openTaskModal(id = null) {
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('task-modal-title');
    
    document.getElementById('task-id').value = id || '';
    document.getElementById('task-name').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-deadline').value = '';
    document.getElementById('task-urgency').value = 'Baixa';

    if (id) {
        title.innerText = "Reescrever Ordem de Bordo";
        const task = tasks.find(t => t.id === id);
        if (task) {
            document.getElementById('task-name').value = task.name;
            document.getElementById('task-desc').value = task.description || '';
            document.getElementById('task-deadline').value = task.deadline || '';
            document.getElementById('task-urgency').value = task.urgency;
        }
    } else {
        title.innerText = "Nova Ordem do Capitão";
    }
    
    modal.style.display = 'flex';
}

function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
}

function saveTask() {
    const id = document.getElementById('task-id').value;
    const name = document.getElementById('task-name').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    const deadline = document.getElementById('task-deadline').value;
    const urgency = document.getElementById('task-urgency').value;

    if (!name) return;

    if (id) {
        // Atualização automática preservando data de criação antiga
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.name = name;
            task.description = desc;
            task.deadline = deadline;
            task.urgency = urgency;
        }
    } else {
        // Criação de Nova Tarefa
        const newTask = {
            id: generateId(),
            name: name,
            description: desc,
            deadline: deadline,
            urgency: urgency,
            status: 'Em andamento',
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }

    saveTasksState();
    document.getElementById('task-desc').value = '';
    closeTaskModal();
    renderTasks();
}

function toggleTaskStatus(id, checked) {
    const task = tasks.find(t => t.id === id);
    if(task) {
        task.status = checked ? 'Concluída' : 'Em andamento';
        saveTasksState();
        renderTasks();
    }
}

function deleteTask(id) {
    if (confirm("Deseja mesmo jogar esta tarefa ao mar? Ela será permanentemente removida.")) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasksState();
        renderTasks();
    }
}
