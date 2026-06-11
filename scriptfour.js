// ==========================================
// LÓGICA DO GUIA DE PROCEDIMENTOS (YUTA x HAKARI)
// ==========================================

const STORAGE_KEY_PROC = 'procedimentosEliteData_v1';
let jjk_db = [];
let jjk_editingId = null;

// Inicializa a aba ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    jjk_loadData();
});

function jjk_loadData() {
    const saved = localStorage.getItem(STORAGE_KEY_PROC);
    if (saved) {
        try {
            jjk_db = JSON.parse(saved);
        } catch (e) {
            console.error("Erro ao ler DB de procedimentos.", e);
            jjk_db = [];
        }
    }
    jjk_renderProcedures();
}

function jjk_saveData() {
    localStorage.setItem(STORAGE_KEY_PROC, JSON.stringify(jjk_db));
}

function jjk_generateId() {
    return 'proc_' + Math.random().toString(36).substr(2, 9);
}

// ==========================================
// RENDERIZAÇÃO E FILTRAGEM
// ==========================================

function jjk_renderProcedures() {
    const container = document.getElementById('proc-grid');
    if (!container) return; // Só roda se a aba existir no HTML

    const termo = document.getElementById('proc-search').value.toLowerCase();
    container.innerHTML = '';

    // Filtrar pela pesquisa
    let lista = jjk_db.filter(p => 
        p.nome.toLowerCase().includes(termo) || 
        (p.categoria && p.categoria.toLowerCase().includes(termo)) ||
        (p.descricao && p.descricao.toLowerCase().includes(termo))
    );

    // Ordenação: Favoritos primeiro, depois ordem alfabética
    lista.sort((a, b) => {
        if (a.favorito === b.favorito) {
            return a.nome.localeCompare(b.nome);
        }
        return a.favorito ? -1 : 1; // True vem antes de False
    });

    if (lista.length === 0) {
        container.innerHTML = '<p style="color: #8892B0; grid-column: 1/-1; text-align: center; padding: 30px;">Nenhuma técnica/procedimento encontrado.</p>';
        return;
    }

    lista.forEach(p => {
        const card = document.createElement('div');
        card.className = 'proc-card';
        card.onclick = (e) => {
            // Impede que clicar nos botões abra o modal de visualização
            if(!e.target.closest('button')) jjk_openViewModal(p.id);
        };

        const favClass = p.favorito ? 'active' : '';
        const starIcon = p.favorito ? '★' : '☆';
        const qtdPassos = p.passos ? p.passos.length : 0;
        const catBadge = p.categoria ? `<span class="proc-card-cat">${p.categoria}</span>` : '';

        card.innerHTML = `
            <div class="proc-card-header">
                <h3 class="proc-card-title">${p.nome}</h3>
                <button class="proc-star-btn ${favClass}" onclick="jjk_toggleFav('${p.id}', event)" title="Favoritar">
                    ${starIcon}
                </button>
            </div>
            ${catBadge}
            <div class="proc-card-footer">
                <span class="proc-step-count">🗎 ${qtdPassos} passos</span>
                <div class="proc-card-actions">
                    <button onclick="jjk_openEditModal('${p.id}', event)" title="Editar">✏️</button>
                    <button onclick="jjk_deleteProcedure('${p.id}', event)" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function jjk_filterProcedures() {
    jjk_renderProcedures();
}

function jjk_toggleFav(id, event) {
    event.stopPropagation(); // Evita abrir o card
    const item = jjk_db.find(p => p.id === id);
    if (item) {
        item.favorito = !item.favorito;
        jjk_saveData();
        jjk_renderProcedures();
    }
}

function jjk_deleteProcedure(id, event) {
    event.stopPropagation();
    if (confirm("Deseja realmente apagar esta técnica da sua biblioteca?")) {
        jjk_db = jjk_db.filter(p => p.id !== id);
        jjk_saveData();
        jjk_renderProcedures();
    }
}

// ==========================================
// EXPANSÃO DE DOMÍNIO (VISUALIZAÇÃO)
// ==========================================

function jjk_openViewModal(id) {
    const proc = jjk_db.find(p => p.id === id);
    if (!proc) return;

    document.getElementById('view-proc-title').textContent = proc.nome;
    document.getElementById('view-proc-cat').textContent = proc.categoria || "Sem Categoria";
    document.getElementById('view-proc-cat').style.display = proc.categoria ? 'inline-block' : 'none';
    document.getElementById('view-proc-desc').textContent = proc.descricao || "";
    
    const stepsContainer = document.getElementById('view-proc-steps');
    stepsContainer.innerHTML = '';

    if (proc.passos && proc.passos.length > 0) {
        proc.passos.forEach((passoText, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'proc-step-item';
            stepDiv.innerHTML = `
                <h4>Passo ${index + 1}</h4>
                <p>${passoText.replace(/\n/g, '<br>')}</p>
            `;
            stepsContainer.appendChild(stepDiv);
        });
    } else {
        stepsContainer.innerHTML = '<p style="color:#8892B0;">Nenhum passo registrado.</p>';
    }

    const modal = document.getElementById('proc-view-modal');
    const domainBox = modal.querySelector('.proc-domain-expansion');
    
    // Reseta a animação para rodar toda vez que abrir
    domainBox.style.animation = 'none';
    domainBox.offsetHeight; /* trigger reflow */
    domainBox.style.animation = null;

    modal.style.display = 'flex';
}

function jjk_closeViewModal() {
    document.getElementById('proc-view-modal').style.display = 'none';
}

// ==========================================
// CRIAÇÃO E EDIÇÃO
// ==========================================

function jjk_openEditModal(id = null, event = null) {
    if(event) event.stopPropagation();

    jjk_editingId = id;
    const title = document.getElementById('edit-proc-modal-title');
    const container = document.getElementById('proc-steps-container');
    container.innerHTML = ''; // Limpa passos antigos

    if (id) {
        title.textContent = "Editar Técnica";
        const proc = jjk_db.find(p => p.id === id);
        if (proc) {
            document.getElementById('proc-input-name').value = proc.nome;
            document.getElementById('proc-input-cat').value = proc.categoria;
            document.getElementById('proc-input-desc').value = proc.descricao;
            
            if (proc.passos && proc.passos.length > 0) {
                proc.passos.forEach(pText => jjk_addStepRow(pText));
            } else {
                jjk_addStepRow(); // Deixa um vazio
            }
        }
    } else {
        title.textContent = "Nova Técnica";
        document.getElementById('proc-input-name').value = '';
        document.getElementById('proc-input-cat').value = '';
        document.getElementById('proc-input-desc').value = '';
        jjk_addStepRow(); // Começa com 1 passo vazio
    }

    document.getElementById('proc-edit-modal').style.display = 'flex';
}

function jjk_closeEditModal() {
    document.getElementById('proc-edit-modal').style.display = 'none';
}

// Lógica de manipulação do DOM para os passos infinitos
function jjk_addStepRow(texto = "") {
    const container = document.getElementById('proc-steps-container');
    const row = document.createElement('div');
    row.className = 'proc-step-row';
    
    row.innerHTML = `
        <textarea placeholder="Descreva a ação deste passo...">${texto}</textarea>
        <div class="proc-step-controls">
            <button class="proc-step-btn" type="button" onclick="jjk_moveStepUp(this)" title="Subir">▲</button>
            <button class="proc-step-btn" type="button" onclick="jjk_moveStepDown(this)" title="Descer">▼</button>
            <button class="proc-step-btn del" type="button" onclick="jjk_removeStepRow(this)" title="Remover">✖</button>
        </div>
    `;
    container.appendChild(row);
}

function jjk_removeStepRow(btn) {
    const row = btn.closest('.proc-step-row');
    row.remove();
}

function jjk_moveStepUp(btn) {
    const row = btn.closest('.proc-step-row');
    const prev = row.previousElementSibling;
    if (prev) {
        row.parentNode.insertBefore(row, prev);
    }
}

function jjk_moveStepDown(btn) {
    const row = btn.closest('.proc-step-row');
    const next = row.nextElementSibling;
    if (next) {
        row.parentNode.insertBefore(next, row);
    }
}

function jjk_saveProcedure() {
    const nome = document.getElementById('proc-input-name').value.trim();
    const categoria = document.getElementById('proc-input-cat').value.trim();
    const descricao = document.getElementById('proc-input-desc').value.trim();
    
    if (!nome) {
        alert("O Nome do procedimento é obrigatório para registrar a técnica.");
        return;
    }

    // Coletar todos os passos que não estão em branco
    const passosNodes = document.querySelectorAll('.proc-step-row textarea');
    const passos = [];
    passosNodes.forEach(node => {
        if (node.value.trim() !== '') {
            passos.push(node.value.trim());
        }
    });

    if (jjk_editingId) {
        // Atualizando existente
        const proc = jjk_db.find(p => p.id === jjk_editingId);
        if (proc) {
            proc.nome = nome;
            proc.categoria = categoria;
            proc.descricao = descricao;
            proc.passos = passos;
        }
    } else {
        // Criando novo
        jjk_db.push({
            id: jjk_generateId(),
            nome: nome,
            categoria: categoria,
            descricao: descricao,
            passos: passos,
            favorito: false
        });
    }

    jjk_saveData();
    jjk_closeEditModal();
    jjk_renderProcedures();
}