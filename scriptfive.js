document.addEventListener('DOMContentLoaded', () => {
    // Seleção dos elementos do DOM pelos IDs configurados no HTML
    const btnExport = document.getElementById('btn-export-backup');
    const btnImport = document.getElementById('btn-import-backup');
    const inputImport = document.getElementById('input-import-backup');

    // ==========================================
    // 1. FUNÇÃO DE EXPORTAR BACKUP (DOWNLOAD)
    // ==========================================
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            try {
                // Validação preventiva: verifica se existe algo salvo no localStorage
                if (localStorage.length === 0) {
                    alert('Não há dados armazenados no navegador para exportar no momento.');
                    return;
                }

                // Converte todo o conteúdo atual do localStorage em uma string JSON estável
                const backupData = JSON.stringify(localStorage);
                
                // Cria um arquivo virtual (Blob) configurado como aplicação JSON
                const blob = new Blob([backupData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Cria um elemento de link invisível para disparar o download nativo
                const a = document.createElement('a');
                a.href = url;
                
                // Formata o nome do arquivo com a data atual (Ano-Mês-Dia) para melhor organização
                const dataAtual = new Date().toISOString().split('T')[0];
                a.download = `sistema_notebook_backup_${dataAtual}.json`;
                
                // Injeta o elemento na árvore, simula o clique do usuário e o remove em seguida
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Libera o link da memória do navegador para evitar vazamento de performance
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Erro crítico ao exportar o backup:', error);
                alert('Ocorreu um erro inesperado ao tentar gerar o arquivo de backup.');
            }
        });
    }

    // ==========================================
    // 2. FUNÇÃO DE IMPORTAR BACKUP (UPLOAD)
    // ==========================================
    if (btnImport && inputImport) {
        // Vincula o botão visível e estilizado ao input de tipo arquivo que está oculto
        btnImport.addEventListener('click', () => {
            inputImport.click();
        });

        // Monitora quando o usuário seleciona um arquivo novo
        inputImport.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return; // Se o usuário cancelar a seleção, interrompe aqui

            // Validação visual rápida: garante que a extensão do arquivo seja .json
            if (!file.name.endsWith('.json')) {
                alert('Por favor, selecione apenas arquivos com a extensão ".json".');
                event.target.value = ''; // Reseta o campo
                return;
            }

            // Inicializa o leitor de arquivos do navegador
            const reader = new FileReader();
            
            // Evento disparado assim que o arquivo terminar de ser lido com sucesso
            reader.onload = function(e) {
                try {
                    // Transforma o texto bruto do arquivo de volta em um objeto JavaScript
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validação de Estrutura: Garante que o JSON é um objeto estruturado e válido
                    if (typeof importedData !== 'object' || importedData === null || Array.isArray(importedData)) {
                        throw new Error('O formato interno do arquivo JSON não corresponde a uma estrutura de armazenamento válida.');
                    }

                    // Caixa de diálogo de segurança para evitar que o usuário clique por engano e perca dados atuais
                    const confirmarSubstituicao = confirm('Atenção: Ao importar este backup, todos os seus dados atuais salvos nesta página serão substituídos. Deseja continuar?');
                    if (!confirmarSubstituicao) {
                        event.target.value = ''; // Limpa o input
                        return;
                    }
                    
                    // PASSO CRÍTICO: Limpa o armazenamento antigo para evitar sobreposição ou lixo residual
                    localStorage.clear();
                    
                    // Percorre todas as chaves do objeto importado e grava uma por uma no localStorage
                    for (let key in importedData) {
                        if (importedData.hasOwnProperty(key)) {
                            localStorage.setItem(key, importedData[key]);
                        }
                    }

                    alert('Backup importado com sucesso! A página será reiniciada para atualizar todas as informações.');
                    
                    // PASSO CRÍTICO DA INTERFACE: Recarrega a página de forma limpa.
                    // Isso força todos os outros scripts a lerem o localStorage renovado do zero, atualizando a tela imediatamente.
                    location.reload(); 

                } catch (error) {
                    console.error('Erro ao processar as propriedades do JSON:', error);
                    alert('Erro ao importar: O arquivo selecionado está corrompido ou não pertence a este sistema.');
                    event.target.value = '';
                }
            };

            // Captura falhas físicas de leitura do arquivo no sistema operacional
            reader.onerror = function() {
                console.error('Erro de leitura física do arquivo.');
                alert('Não foi possível ler o arquivo selecionado. Tente novamente.');
                event.target.value = '';
            };
            
            // Executa a leitura do arquivo selecionado interpretando-o como texto puro
            reader.readAsText(file);
            
            // Reseta o valor do input interno. Isso permite importar o mesmo arquivo consecutivamente se necessário.
            event.target.value = ''; 
        });
    }
});