// SCRIPT PARA CORRIGIR A FUNÇÃO saveApartmentStatusNew
// Execute este código no console do navegador (F12)

console.log('🔧 Substituindo função saveApartmentStatusNew...');

// Redefinir a função globalmente
window.saveApartmentStatusNew = async function() {
    console.log('💾 saveApartmentStatusNew chamada (VERSÃO CORRIGIDA)');

    // VERIFICAR PERÍODO ATIVO
    if (!appState.activeYear || !appState.activeMonth) {
        alert('Erro: Selecione o ano e mês antes de salvar');
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

    console.log('📋 Salvando pagamento APENAS para:', {
        apartamento: apartamento.numero,
        ano: appState.activeYear,
        mes: appState.activeMonth,
        status: selectedStatus
    });

    try {
        // Mostrar loading
        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            saveBtn.textContent = 'Salvando...';
            saveBtn.disabled = true;
        }

        // Criar estrutura de pagamento ESPECÍFICA para o mês ativo
        const paymentData = {
            apartamentoId: apartamento.id,
            condominioId: apartamento.condominioId,
            blocoId: apartamento.blocoId,
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

        if (apartamento.tipo === 'casa') {
            paymentData.tipo = 'casa';
            paymentData.morador = morador;
        } else {
            paymentData.tipo = 'apartamento';
        }

        // Verificar se já existe pagamento para este mês
        const existingPayments = appState.payments.condominio.filter(p =>
            p.apartamentoId === apartamento.id &&
            p.ano === appState.activeYear &&
            p.mes === appState.activeMonth
        );

        if (existingPayments.length > 0) {
            // Atualizar pagamento existente
            await updatePayment(existingPayments[0].id, paymentData);
            console.log('✅ Pagamento atualizado');
        } else {
            // Criar novo pagamento
            await createPayment(paymentData);
            console.log('✅ Novo pagamento criado');
        }

        // Fechar modal
        closeApartmentModal();

        // Mostrar sucesso
        showToast(`✅ Status salvo para ${appState.activeMonth}/${appState.activeYear}`, 'success');

        // Restaurar botão
        if (saveBtn) {
            saveBtn.textContent = 'Salvar Alterações';
            saveBtn.disabled = false;
        }

    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);

        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            saveBtn.textContent = 'Salvar Alterações';
            saveBtn.disabled = false;
        }
    }
};

console.log('✅ Função substituída! Agora salva apenas para o mês ativo.');
console.log('📝 Teste: Selecione um apartamento e salve o status.');
