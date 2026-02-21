// CORRECAO: Salvar status apenas para o mes ativo selecionado
// Este arquivo sobrescreve a funcao saveApartmentStatusNew() com a versao correta

console.log('🔧 Carregando correcao para salvar apenas mes ativo...');

// Funcao helper para buscar status do mes ativo
window.getStatusForActivePeriod = function(apartamento) {
    if (!appState.activeYear || !appState.activeMonth) {
        return { status: 'pendente', observacao: '' };
    }
    
    const payment = appState.payments.condominio.find(p =>
        p.apartamentoId === apartamento.id &&
        p.ano === appState.activeYear &&
        p.mes === appState.activeMonth
    );
    
    if (payment) {
        return {
            status: payment.status || 'pendente',
            observacao: payment.observacao || ''
        };
    }
    
    return { status: 'pendente', observacao: '' };
};

// Sobrescrever a funcao global
window.saveApartmentStatusNew = async function() {
    console.log('💾 saveApartmentStatusNew CORRIGIDA chamada');

    // VERIFICAR PERIODO ATIVO
    if (!appState.activeYear || !appState.activeMonth) {
        alert('Erro: Selecione o ano e mes antes de salvar');
        return;
    }

    if (!appState.selectedApartamento) {
        console.error('❌ Nenhum apartamento selecionado');
        alert('Erro: Nenhum apartamento selecionado');
        return;
    }

    const apartamento = appState.selectedApartamento;
    const selectedStatus = document.querySelector('input[name="aptStatus"]:checked')?.value || 'pendente';
    const observacoes = document.getElementById('apartmentObservations')?.value || '';
    const morador = document.getElementById('houseResidentName')?.value || '';

    console.log('📋 Salvando pagamento para:', {
        apartamento: apartamento.numero,
        ano: appState.activeYear,
        mes: appState.activeMonth,
        status: selectedStatus,
        observacoes: observacoes
    });

    try {
        // Mostrar loading
        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            saveBtn.textContent = 'Salvando...';
            saveBtn.disabled = true;
        }

        // Criar estrutura de pagamento ESPECIFICA para o mes ativo
        const paymentData = {
            apartamentoId: apartamento.id,
            condominioId: apartamento.condominioId,
            blocoId: apartamento.blocoId,
            apartamentoNumero: apartamento.numero,
            ano: appState.activeYear,
            mes: appState.activeMonth,
            date: `${appState.activeYear}-${appState.activeMonth}`, // formato YYYY-MM
            type: 'condominio',
            status: selectedStatus,
            observacao: observacoes,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (apartamento.tipo === 'casa') {
            paymentData.tipo = 'casa';
            paymentData.morador = morador;
        } else {
            paymentData.tipo = 'apartamento';
        }

        // Verificar se ja existe pagamento para este mes
        const existingPayments = appState.payments.condominio.filter(p =>
            p.apartamentoId === apartamento.id &&
            p.ano === appState.activeYear &&
            p.mes === appState.activeMonth
        );

        if (existingPayments.length > 0) {
            // Atualizar pagamento existente
            if (typeof updatePayment === 'function') {
                const paymentId = await updatePayment(existingPayments[0].id, paymentData);
                console.log('✅ Pagamento atualizado no Firebase');
                
                // Atualizar no estado local
                const localIndex = appState.payments.condominio.findIndex(p => p.id === existingPayments[0].id);
                if (localIndex >= 0) {
                    appState.payments.condominio[localIndex] = {
                        ...appState.payments.condominio[localIndex],
                        ...paymentData,
                        id: existingPayments[0].id
                    };
                }
            }
        } else {
            // Criar novo pagamento
            if (typeof createPayment === 'function') {
                const paymentId = await createPayment(paymentData);
                console.log('✅ Novo pagamento criado no Firebase');
                
                // Adicionar ao estado local imediatamente
                appState.payments.condominio.push({
                    ...paymentData,
                    id: paymentId
                });
            }
        }

        // NAO atualizar o status do apartamento - apenas criar/atualizar o pagamento do mes

        // Fechar modal
        closeApartmentModal();

        // Mostrar sucesso
        if (typeof showToast === 'function') {
            showToast(`Status salvo para ${appState.activeMonth}/${appState.activeYear}`, 'success');
        }

        // Recarregar a tela para mostrar as mudancas
        if (appState.currentScreen === 'apartamentos') {
            if (typeof renderApartamentos === 'function') {
                renderApartamentos();
            }
        } else if (appState.currentScreen === 'blocos') {
            if (typeof renderBlocos === 'function') {
                renderBlocos();
            }
        }

        // Restaurar botao
        if (saveBtn) {
            saveBtn.textContent = 'Salvar Alteracoes';
            saveBtn.disabled = false;
        }

    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);

        // Restaurar botao
        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            saveBtn.textContent = 'Salvar Alteracoes';
            saveBtn.disabled = false;
        }
    }
};

console.log('✅ Funcao saveApartmentStatusNew() sobrescrita com sucesso!');
console.log('📌 Agora o sistema salvara status APENAS para o mes ativo selecionado');


// Sobrescrever funcao de abertura do modal para usar status do mes ativo
const originalOpenApartmentModal = window.openApartmentModal;
if (originalOpenApartmentModal) {
    window.openApartmentModal = function(apartamento) {
        // Chamar funcao original
        originalOpenApartmentModal(apartamento);
        
        // Corrigir status apos abertura
        setTimeout(() => {
            if (appState.activeYear && appState.activeMonth) {
                const { status, observacao } = window.getStatusForActivePeriod(apartamento);
                
                // Atualizar radio buttons
                const radios = document.querySelectorAll('input[name="aptStatus"]');
                radios.forEach(radio => {
                    radio.checked = (radio.value === status);
                });
                
                // Atualizar observacoes
                const observationsField = document.getElementById('apartmentObservations');
                if (observationsField) {
                    observationsField.value = observacao;
                }
                
                console.log('✅ Modal corrigido com status do mes ativo:', status);
            }
        }, 100);
    };
    
    console.log('✅ Funcao openApartmentModal() sobrescrita para usar mes ativo');
}
