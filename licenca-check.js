// licenca-check.js — Verificação de licença ao carregar o sistema
import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const CLIENT_ID = 'gestaodoscondominios'; // ID do cliente no Firestore

export async function verificarLicenca() {
    try {
        const snap = await getDoc(doc(db, 'licencas', CLIENT_ID));

        // Se não existe documento ou ativo === false, bloqueia
        if (!snap.exists() || snap.data().ativo === false) {
            mostrarBloqueio();
            return false;
        }
        return true;
    } catch (e) {
        // Em caso de erro de rede, deixa passar (não bloqueia por falha técnica)
        console.warn('[Licença] Não foi possível verificar:', e.message);
        return true;
    }
}

function mostrarBloqueio() {
    // Remove tudo da tela
    document.body.innerHTML = '';
    document.body.style.cssText = `
        margin: 0; padding: 0;
        background: #0f172a;
        font-family: system-ui, sans-serif;
        display: flex; align-items: center; justify-content: center;
        min-height: 100vh;
    `;

    document.body.innerHTML = `
        <div style="
            text-align: center; padding: 40px 32px; max-width: 420px;
            background: #1e293b; border: 1px solid #334155; border-radius: 16px;
        ">
            <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
            <h1 style="color: #f1f5f9; font-size: 1.4rem; margin-bottom: 12px;">
                Sistema Temporariamente Suspenso
            </h1>
            <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">
                O acesso a este sistema está suspenso.<br>
                Entre em contato com o suporte para regularizar.
            </p>
            <div style="
                background: #0f172a; border-radius: 10px; padding: 16px;
                color: #64748b; font-size: 0.85rem; line-height: 1.8;
            ">
                📞 Suporte: <strong style="color:#94a3b8">(XX) XXXXX-XXXX</strong><br>
                📧 Email: <strong style="color:#94a3b8">suporte@seudominio.com</strong>
            </div>
        </div>
    `;
}
