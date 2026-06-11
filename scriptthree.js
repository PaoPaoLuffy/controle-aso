// ==========================================
// LÓGICA DA ABA TREINAMENTOS (BLUE LOCK)
// ==========================================

const STORAGE_KEY_BL = 'treinamentosEliteData_v2'; 
let treinamentosDB = [];
let currentMonthFilterBL = '';

const mesesPT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Lista Completa
// Array vazio por segurança — dados ficam apenas no localStorage do usuário.
// Para popular o sistema, utilize o botão "Importar Backup" na aba Backup.
const initialDataBL = [];

document.addEventListener('DOMContentLoaded', () => {
    loadDataBL();
});

function getHojeData() {
    return new Date().toISOString().split("T")[0];
}

function loadDataBL() {
    const saved = localStorage.getItem(STORAGE_KEY_BL);
    if (saved) {
        try {
            treinamentosDB = JSON.parse(saved);
        } catch (error) {
            carregarIniciaisBL();
        }
    } else {
        carregarIniciaisBL();
    }
    renderInterfaceBL();
}

function carregarIniciaisBL() {
    treinamentosDB = initialDataBL.map(item => ({
        id: generateIdBL(),
        nome: item.nome,
        treinamentos: item.treinamentos,
        mes: item.mes,
        status: "Pendente",
        cobranca: ""
    }));
    saveDataBL();
}

function saveDataBL() {
    localStorage.setItem(STORAGE_KEY_BL, JSON.stringify(treinamentosDB));
}

function generateIdBL() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

window.renderInterfaceBL = function() {
    renderMonthFiltersBL();
    renderCardsBL();
};

function renderMonthFiltersBL() {
    const container = document.getElementById('bl-month-filters');
    if (!container) return;
    container.innerHTML = '';

    const mesesExistentes = [...new Set(treinamentosDB.map(t => t.mes))];
    mesesExistentes.sort((a, b) => mesesPT.indexOf(a) - mesesPT.indexOf(b));

    if (mesesExistentes.length > 0 && (!currentMonthFilterBL || !mesesExistentes.includes(currentMonthFilterBL))) {
        currentMonthFilterBL = mesesExistentes[0]; 
    }

    mesesExistentes.forEach(mes => {
        const btn = document.createElement('button');
        btn.className = `bl-month-btn ${currentMonthFilterBL === mes ? 'active' : ''}`;
        btn.textContent = mes;
        btn.onclick = () => {
            currentMonthFilterBL = mes;
            window.renderInterfaceBL();
        };
        container.appendChild(btn);
    });
}

function renderCardsBL() {
    const container = document.getElementById('bl-grid');
    const searchInput = document.getElementById('bl-search');
    if (!container) return; 
    
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    container.innerHTML = '';

    let list = treinamentosDB.filter(t => t.mes === currentMonthFilterBL);
    
    if (searchQuery) {
        list = list.filter(t => t.nome.toLowerCase().includes(searchQuery));
    }

    list.sort((a, b) => a.nome.localeCompare(b.nome));

    if (list.length === 0) {
        container.innerHTML = '<p style="color: #4A6B8C; grid-column: 1/-1; text-align: center; padding: 20px;">Nenhum colaborador encontrado.</p>';
        return;
    }

    const hoje = getHojeData();

    list.forEach(t => {
        const card = document.createElement('div');
        card.className = 'bl-card';
        
        const trainingsText = t.treinamentos.join(', ');
        let statusClass = t.status === "Aguardando Certificado" ? "Aguardando" : t.status;

        card.innerHTML = `
            <div class="bl-card-header">
                <h4 class="bl-card-name">${t.nome}</h4>
                <div class="bl-card-actions">
                    <button class="bl-action-btn" onclick="window.openModalBL('${t.id}')">✏️</button>
                    <button class="bl-action-btn" onclick="window.deleteCardBL('${t.id}')">🗑️</button>
                </div>
            </div>
            <div class="bl-card-trainings">${trainingsText}</div>
            
            <div class="bl-card-bottom">
                <select class="bl-status-select ${statusClass}" onchange="window.updateStatusBL('${t.id}', this.value, this)">
                    <option value="Pendente" ${t.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Aguardando Certificado" ${t.status === 'Aguardando Certificado' ? 'selected' : ''}>Aguardando</option>
                    <option value="Finalizado" ${t.status === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                </select>
                <input type="date" class="bl-date-input" max="${hoje}" value="${t.cobranca || ''}" onchange="window.updateCobrancaBL('${t.id}', this.value)">
            </div>
        `;
        container.appendChild(card);
    });
}

window.updateStatusBL = function(id, newStatus, selectElement) {
    const item = treinamentosDB.find(t => t.id === id);
    if (item) {
        item.status = newStatus;
        saveDataBL();
        selectElement.className = `bl-status-select ${newStatus === 'Aguardando Certificado' ? 'Aguardando' : newStatus}`;
    }
};

window.updateCobrancaBL = function(id, newDate) {
    const item = treinamentosDB.find(t => t.id === id);
    if (item) {
        item.cobranca = newDate;
        saveDataBL();
    }
};

window.deleteCardBL = function(id) {
    if (confirm("Deseja realmente remover este colaborador?")) {
        treinamentosDB = treinamentosDB.filter(t => t.id !== id);
        saveDataBL();
        window.renderInterfaceBL();
    }
};

window.openModalBL = function(id = null) {
    const modal = document.getElementById('bl-modal');
    const title = document.getElementById('bl-modal-title');
    if(title) title.textContent = id ? "Editar Treinamento" : "Novo Treinamento";
    
    // Resetar checkboxes (ajuste conforme seu HTML)
    document.querySelectorAll('.bl-check').forEach(cb => cb.checked = false);

    if (id) {
        const item = treinamentosDB.find(t => t.id === id);
        if(item) {
            document.getElementById('bl-id').value = item.id;
            document.getElementById('bl-nome').value = item.nome;
            document.getElementById('bl-mes').value = item.mes;
            document.querySelectorAll('.bl-check').forEach(cb => {
                if (item.treinamentos.includes(cb.value)) cb.checked = true;
            });
        }
    } else {
        document.getElementById('bl-id').value = '';
        document.getElementById('bl-nome').value = '';
        if(currentMonthFilterBL) document.getElementById('bl-mes').value = currentMonthFilterBL;
    }
    if(modal) modal.style.display = 'flex';
};

window.closeModalBL = function() {
    document.getElementById('bl-modal').style.display = 'none';
};

window.saveModalBL = function() {
    const id = document.getElementById('bl-id').value;
    const nome = document.getElementById('bl-nome').value.trim();
    const mes = document.getElementById('bl-mes').value;
    const treinamentos = Array.from(document.querySelectorAll('.bl-check:checked')).map(cb => cb.value);

    if (!nome || treinamentos.length === 0) return alert("Preencha o nome e selecione um treinamento.");

    if (id) {
        const item = treinamentosDB.find(t => t.id === id);
        item.nome = nome; item.mes = mes; item.treinamentos = treinamentos;
    } else {
        treinamentosDB.push({ id: generateIdBL(), nome, mes, treinamentos, status: "Pendente", cobranca: "" });
    }

    currentMonthFilterBL = mes;
    saveDataBL();
    window.closeModalBL();
    window.renderInterfaceBL();
};