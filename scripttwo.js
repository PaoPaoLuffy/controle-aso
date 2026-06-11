/* =========================================
   TEMA: DEKU / BOKU NO HERO (CHECKLIST)
   ARQUIVO: scripttwo.js
========================================= */

// Lista imutável de verificações
const checklistItems = [
    "ASO com cargo correto.",
    "ASO, O.S, Ficha de EPI e Carta de Anuência com os exatos mesmos cargos.",
    "Ficha de EPI na validade de até 3 meses.",
    "Ficha de EPI contendo todos os EPIs necessários.",
    "Ficha de EPI assinada pelo colaborador.",
    "Carta de Anuência assinada pelo colaborador e pelo Willian.",
    "Certificados de treinamentos (NR10, SEP, NR18, DIR DEF, NR6 e Integração).",
    "Certificados assinados e dentro do prazo.",
    "Seguro de vida incluído.",
    "RG e CPF adicionados.",
    "CTPS atualizada com o cargo atual.",
    "Ficha de Registro com assinatura do colaborador e da empresa (Willian).",
    "Certificado NR6 e Integração assinados pelo Willian e pelo colaborador.",
    "PGR e PCMSO adicionados aos documentos da empresa."
];

// Estado salvo no LocalStorage
let checklistState = JSON.parse(localStorage.getItem('checklistEnvioData')) || new Array(checklistItems.length).fill(false);

document.addEventListener('DOMContentLoaded', () => {
    renderChecklist();
    updateProgress();
});

function renderChecklist() {
    const container = document.getElementById('checklist-container');
    container.innerHTML = '';

    checklistItems.forEach((text, index) => {
        const isChecked = checklistState[index];
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `check-item ${isChecked ? 'completed' : ''}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `check-${index}`;
        checkbox.checked = isChecked;
        
        const label = document.createElement('label');
        label.htmlFor = `check-${index}`;
        label.innerText = text;

        // Evento de clique para marcar/desmarcar
        checkbox.addEventListener('change', (e) => {
            checklistState[index] = e.target.checked;
            localStorage.setItem('checklistEnvioData', JSON.stringify(checklistState));
            
            if(e.target.checked) {
                itemDiv.classList.add('completed');
            } else {
                itemDiv.classList.remove('completed');
            }
            
            updateProgress();
        });

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        container.appendChild(itemDiv);
    });
}

function updateProgress() {
    const total = checklistItems.length;
    const completed = checklistState.filter(item => item === true).length;
    const percentage = Math.round((completed / total) * 100);

    const barFill = document.getElementById('progress-bar-fill');
    const textPercent = document.getElementById('progress-percentage');
    const message = document.getElementById('progress-message');
    const btnReset = document.getElementById('btn-reset-checklist');
    const notebookContainer = document.querySelector('.deku-notebook');

    // Atualiza largura e texto da barra
    barFill.style.width = `${percentage}%`;
    textPercent.innerText = `${percentage}%`;

    // Reseta classes de animação e botão toda vez que o progresso muda
    message.className = 'hero-message';
    notebookContainer.classList.remove('plus-ultra-mode');
    btnReset.style.display = 'none';

    // Evolução da cor do One For All e mensagens
    if (percentage === 0) {
        barFill.style.backgroundColor = '#dceddd'; // Verde muito fraco
        message.innerHTML = "Hora de começar a análise!";
    } else if (percentage >= 1 && percentage <= 24) {
        barFill.style.backgroundColor = '#8fd9a8'; // Verde suave
        message.innerHTML = "Cada detalhe importa!";
    } else if (percentage >= 25 && percentage <= 49) {
        barFill.style.backgroundColor = '#58c77e'; // Verde mais intenso
        message.innerHTML = "Bom trabalho! Continue avançando!";
    } else if (percentage >= 50 && percentage <= 74) {
        barFill.style.backgroundColor = '#3ED37F'; // Verde da paleta principal
        message.innerHTML = "Metade da missão concluída!";
    } else if (percentage >= 75 && percentage <= 99) {
        barFill.style.backgroundColor = '#2eb568'; // Verde brilhante focado
        message.innerHTML = "Vá ainda mais além...";
        message.classList.add('going-beyond'); // Ativa animação do CSS
    } else if (percentage === 100) {
        barFill.style.backgroundColor = '#00ff66'; // Verde extremamente vibrante
        message.innerHTML = "PLUS ULTRA!<br>Todos os documentos foram conferidos. A missão foi concluída com sucesso!";

        // Ativação dos efeitos de energia One For All 100%
        message.classList.add('plus-ultra-text');
        notebookContainer.classList.add('plus-ultra-mode');
        btnReset.style.display = 'inline-block';
    }
}

// Botão de Reiniciar
document.getElementById('btn-reset-checklist').addEventListener('click', () => {
    const confirmReset = confirm("Tem certeza que deseja reiniciar o checklist? Isso apagará todas as marcações atuais.");
    
    if (confirmReset) {
        checklistState = new Array(checklistItems.length).fill(false);
        localStorage.setItem('checklistEnvioData', JSON.stringify(checklistState));
        renderChecklist();
        updateProgress();
    }
});