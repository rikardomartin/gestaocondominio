// CORRECAO DEFINITIVA - Salvar status apenas para mes ativo
console.log('🔧 [FIX v2] Carregando correcao...');

// Funcao para aguardar dependencias
function waitForDependencies(callback, maxAttempts = 30) {
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        // Verificar se appState existe
        const hasAppState = typeof appState !== 'undefined';
        
        if (hasAppState) {
            clearInterval(checkInterval);
            console.log(`✅ [FIX v2] appState carregado apos ${attempts} tentativas`);
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ [FIX v2] Timeout aguardando appState');
        }
    }, 500);
}

// Aguardar dependencias antes de sobrescrever
waitForDependencies(() => {
    console.log('✅ [FIX v2] Iniciando sobrescrita de funcoes');
    console.log('📊 [FIX v2] Pagamentos em memoria:', appState.payments?.condominio?.length || 0);

    // Sobrescrever renderApartamentos para adicionar logs
    const originalRenderApartamentos = window.renderApartamentos;
    if (originalRenderApartamentos) {
        window.renderApartamentos = function() {
            console.log('🎨 [FIX v2] renderApartamentos chamada');
            console.log('📊 [FIX v2] Periodo ativo:', { ano: appState.activeYear, mes: appState.activeMonth });
            console.log('📊 [FIX v2] Total pagamentos:', appState.payments.condominio.length);
            
            // Chamar original
            originalRenderApartamentos();
        };
    }

    // CORRECAO CRITICA: Sobrescrever openApartmentModal para carregar status do periodo ativo
    // Aguardar a funcao existir antes de sobrescrever
    let modalOverrideAttempts = 0;
    const maxModalAttempts = 20;
    
    const tryOverrideModal = setInterval(() => {
        modalOverrideAttempts++;
        
        if (typeof window.openApartmentModal === 'function') {
            clearInterval(tryOverrideModal);
            
            const originalOpenApartmentModal = window.openApartmentModal;
            
            window.openApartmentModal = function(apartamento) {
                console.log('🎯 [FIX v2] openApartmentModal sobrescrita - carregando status do periodo ativo');
                
                // Buscar pagamento do periodo ativo
                if (appState.activeYear && appState.activeMonth && apartamento) {
                    const payment = appState.payments.condominio.find(p =>
                        p.apartamentoId === apartamento.id &&
                        p.ano === appState.activeYear &&
                        p.mes === appState.activeMonth
                    );
                    
                    if (payment) {
                        console.log('✅ [FIX v2] Pagamento encontrado:', payment.status);
                        // Atualizar apartamento com status e observacao do pagamento
                        apartamento.status = payment.status;
                        apartamento.observacao = payment.observacao || '';
                    } else {
                        console.log('⚠️ [FIX v2] Nenhum pagamento encontrado - usando pendente');
                        // Se nao tem pagamento, e pendente
                        apartamento.status = 'pendente';
                        apartamento.observacao = '';
                    }
                }
                
                // Chamar funcao original com apartamento atualizado
                originalOpenApartmentModal(apartamento);
            };
            
            console.log('✅ [FIX v2] openApartmentModal sobrescrita com sucesso apos', modalOverrideAttempts, 'tentativas');
            
        } else if (modalOverrideAttempts >= maxModalAttempts) {
            clearInterval(tryOverrideModal);
            console.error('❌ [FIX v2] Timeout aguardando openApartmentModal');
        }
    }, 200);

    // Sobrescrever saveApartmentStatusNew
    window.saveApartmentStatusNew = async function() {
        console.log('💾 [FIX v2] saveApartmentStatusNew chamada');

        // Validacoes
        if (!appState.activeYear || !appState.activeMonth) {
            alert('Selecione o ano e mes antes de salvar');
            return;
        }

        if (!appState.selectedApartamento) {
            alert('Nenhum apartamento selecionado');
            return;
        }

        const apartamento = appState.selectedApartamento;
        const selectedStatus = document.querySelector('input[name="aptStatus"]:checked')?.value || 'pendente';
        const observacoes = document.getElementById('apartmentObservations')?.value || '';

        console.log('📋 [FIX v2] Dados:', {
            apt: apartamento.numero,
            ano: appState.activeYear,
            mes: appState.activeMonth,
            status: selectedStatus
        });

        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            saveBtn.textContent = 'Salvando...';
            saveBtn.disabled = true;
        }

        try {
            // Importar funcoes dinamicamente do modulo
            const { createPayment, updatePayment } = await import('./firebase-database.js');
            
            console.log('✅ [FIX v2] Funcoes importadas dinamicamente');

            // Estrutura do pagamento
            const paymentData = {
                apartamentoId: apartamento.id,
                condominioId: apartamento.condominioId,
                apartamentoNumero: apartamento.numero,
                ano: appState.activeYear,
                mes: appState.activeMonth,
                date: `${appState.activeYear}-${appState.activeMonth}`,
                type: 'condominio',
                status: selectedStatus,
                observacao: observacoes,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // CORRECAO: Adicionar blocoId apenas se existir (casas nao tem blocoId)
            if (apartamento.blocoId) {
                paymentData.blocoId = apartamento.blocoId;
            }

            // Verificar se ja existe
            const existingIndex = appState.payments.condominio.findIndex(p =>
                p.apartamentoId === apartamento.id &&
                p.ano === appState.activeYear &&
                p.mes === appState.activeMonth
            );

            let paymentId;

            if (existingIndex >= 0) {
                // Atualizar existente
                const existing = appState.payments.condominio[existingIndex];
                paymentId = await updatePayment(existing.id, paymentData);
                
                // Atualizar estado local
                appState.payments.condominio[existingIndex] = {
                    ...existing,
                    ...paymentData,
                    id: existing.id
                };
                
                console.log('✅ [FIX v2] Pagamento atualizado:', existing.id);
            } else {
                // Criar novo
                paymentId = await createPayment(paymentData);
                
                // Adicionar ao estado local
                appState.payments.condominio.push({
                    ...paymentData,
                    id: paymentId
                });
                
                console.log('✅ [FIX v2] Pagamento criado:', paymentId);
            }

            // Fechar modal
            if (typeof closeApartmentModal === 'function') {
                closeApartmentModal();
            }

            // Recarregar visualizacao atual
            if (typeof renderApartamentos === 'function') {
                renderApartamentos();
            }
            
            // CORRECAO: Recarregar dados dos blocos para refletir mudancas
            // Isso garante que quando o usuario voltar para a tela de blocos, vera os dados atualizados
            if (appState.selectedCondominio && appState.selectedCondominio.id) {
                const condominioId = appState.selectedCondominio.id;
                
                // Recarregar dados em background (sem mudar de tela)
                if (typeof loadBlocosData === 'function') {
                    loadBlocosData(condominioId).catch(err => {
                        console.error('Erro ao recarregar blocos:', err);
                    });
                }
            }
            
            // Atualizar painel se estiver aberto
            if (appState.currentScreen === 'painel') {
                if (typeof updatePainelSummary === 'function') {
                    updatePainelSummary();
                }
                if (typeof renderPaymentsTable === 'function') {
                    renderPaymentsTable();
                }
            }

            // Mostrar sucesso
            if (typeof showToast === 'function') {
                showToast(`Status salvo: ${selectedStatus} - ${appState.activeMonth}/${appState.activeYear}`, 'success');
            }

        } catch (error) {
            console.error('❌ [FIX v2] Erro:', error);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            if (saveBtn) {
                saveBtn.textContent = 'Salvar Alteracoes';
                saveBtn.disabled = false;
            }
        }
    };

    console.log('✅ [FIX v2] Funcao sobrescrita com sucesso');

    // Funcao auxiliar para delay (evitar rate limit do Firebase)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Funcao para pagamento em massa de TODO O CONDOMINIO - APENAS MES ATIVO
    window.bulkPaymentForCondominio = async function(condominio) {
        console.log('💰 [FIX v2] Iniciando pagamento em massa para condominio - MES ATIVO');

        // BLOQUEAR SE FOR VIEWER
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.email === 'viewer@condominio.com') {
            console.log('🚫 VIEWER não pode fazer pagamento em massa');
            alert('❌ Acesso Negado\n\nVocê está no modo VISUALIZAÇÃO e não tem permissão para fazer alterações.');
            return;
        }

        // Validacoes
        if (!appState.activeYear || !appState.activeMonth) {
            alert('Selecione o ano e mês primeiro no seletor acima');
            return;
        }

        if (!condominio) {
            alert('Erro: Condominio nao identificado');
            return;
        }

        // Buscar todos os blocos e apartamentos do condominio
        const { getBlocosByCondominio, getApartamentosByBloco } = await import('./firebase-database.js');
        
        try {
            const blocos = await getBlocosByCondominio(condominio.id);
            
            if (blocos.length === 0) {
                alert('Este condominio nao possui blocos cadastrados');
                return;
            }

            // Buscar todos os apartamentos de todos os blocos
            let todosApartamentos = [];
            for (const bloco of blocos) {
                const apartamentos = await getApartamentosByBloco(bloco.id);
                todosApartamentos = todosApartamentos.concat(apartamentos);
            }

            if (todosApartamentos.length === 0) {
                alert('Este condominio nao possui apartamentos cadastrados');
                return;
            }

            // Confirmar acao - APENAS MES ATIVO
            const mesNome = {
                '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
                '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
                '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
            };
            
            const confirmMsg = `Deseja marcar TODOS os ${todosApartamentos.length} apartamentos do condominio "${condominio.nome}" como PAGO para:\n\n📅 ${mesNome[appState.activeMonth]}/${appState.activeYear}\n\nIsso criará ${todosApartamentos.length} pagamentos.`;
            if (!confirm(confirmMsg)) {
                return;
            }

            // Mostrar loading
            if (typeof showToast === 'function') {
                showToast(`Processando ${todosApartamentos.length} pagamentos...`, 'info');
            }

            // Importar funcoes
            const { createPayment, updatePayment } = await import('./firebase-database.js');
            
            const year = appState.activeYear;
            const month = appState.activeMonth;
            let created = 0;
            let updated = 0;
            let errors = 0;
            let processed = 0;

            console.log(`📊 Total a processar: ${todosApartamentos.length} pagamentos para ${mesNome[month]}/${year}`);

            // Processar cada apartamento - APENAS MES ATIVO
            for (const apartamento of todosApartamentos) {
                try {
                    const paymentData = {
                        apartamentoId: apartamento.id,
                        condominioId: apartamento.condominioId,
                        apartamentoNumero: apartamento.numero,
                        ano: year,
                        mes: month,
                        date: `${year}-${month}`,
                        type: 'condominio',
                        status: 'pago',
                        observacao: `Pagamento em massa - ${condominio.nome} - ${mesNome[month]}/${year}`,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    
                    // CORRECAO: Adicionar blocoId apenas se existir (casas nao tem blocoId)
                    if (apartamento.blocoId) {
                        paymentData.blocoId = apartamento.blocoId;
                    }

                    // Verificar se ja existe
                    const existingIndex = appState.payments.condominio.findIndex(p =>
                        p.apartamentoId === apartamento.id &&
                        p.ano === year &&
                        p.mes === month
                    );

                    if (existingIndex >= 0) {
                        // Atualizar existente
                        const existing = appState.payments.condominio[existingIndex];
                        await updatePayment(existing.id, paymentData);
                        
                        appState.payments.condominio[existingIndex] = {
                            ...existing,
                            ...paymentData,
                            id: existing.id
                        };
                        
                        updated++;
                    } else {
                        // Criar novo
                        const paymentId = await createPayment(paymentData);
                        
                        appState.payments.condominio.push({
                            ...paymentData,
                            id: paymentId
                        });
                        
                        created++;
                    }
                    
                    processed++;
                    
                    // Delay para evitar rate limit do Firebase
                    // A cada 10 pagamentos, aguardar 50ms
                    if (processed % 10 === 0) {
                        await delay(50);
                        console.log(`📊 Progresso: ${processed}/${todosApartamentos.length} pagamentos`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Erro no apt ${apartamento.numero}:`, error);
                    errors++;
                }
            }

            // Mostrar resultado
            const msg = `✅ Pagamento em massa concluído!\n\nCondomínio: ${condominio.nome}\nPeríodo: ${mesNome[month]}/${year}\n\nTotal processado: ${processed}\nCriados: ${created}\nAtualizados: ${updated}\nErros: ${errors}`;
            alert(msg);
            
            if (typeof showToast === 'function') {
                showToast(`${condominio.nome} - ${mesNome[month]}/${year} marcado como pago`, 'success');
            }

            // CORRECAO: Recarregar dados dos blocos para sincronizar estado
            // Isso garante que os percentuais sejam atualizados corretamente no modal
            if (appState.selectedCondominio && appState.selectedCondominio.id === condominio.id) {
                console.log('🔄 Recarregando dados dos blocos para atualizar percentuais...');
                if (typeof loadBlocosData === 'function') {
                    await loadBlocosData(condominio.id);
                }
            }

            // Recarregar a tela de condominios para atualizar o status visual
            if (typeof renderCondominios === 'function') {
                renderCondominios();
            }

        } catch (error) {
            console.error('❌ [FIX v2] Erro no pagamento em massa:', error);
            alert('Erro ao processar pagamento em massa: ' + error.message);
        }
    };

    console.log('✅ [FIX v2] Funcao de pagamento em massa para condominio criada');

}); // Fim do waitForDependencies
