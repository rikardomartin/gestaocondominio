// Script para configurar usuários de demonstração no Firebase
// Execute este script uma vez para criar os usuários de teste

import { createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

// Usuários de demonstração
const demoUsers = [
    {
        email: 'admin@condominio.com',
        password: '123456',
        name: 'Administrador Sistema',
        role: 'admin'
    },
    {
        email: 'operador@condominio.com', 
        password: '123456',
        name: 'Operador Pagamentos',
        role: 'operator'
    },
    {
        email: 'viewer@condominio.com',
        password: '123456', 
        name: 'Usuário Visualização',
        role: 'viewer'
    }
];

// Função para criar usuários de demonstração
export async function setupDemoUsers() {
    console.log('Configurando usuários de demonstração...');
    
    for (const userData of demoUsers) {
        try {
            // Criar usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                userData.email, 
                userData.password
            );
            
            const user = userCredential.user;
            
            // Atualizar perfil do usuário
            await updateProfile(user, {
                displayName: userData.name
            });
            
            // Criar documento do usuário no Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                createdAt: new Date(),
                createdBy: 'system',
                active: true
            });
            
            console.log(`✅ Usuário criado: ${userData.email} (${userData.role})`);
            
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`⚠️  Usuário já existe: ${userData.email}`);
            } else {
                console.error(`❌ Erro ao criar ${userData.email}:`, error);
            }
        }
    }
    
    console.log('Configuração de usuários concluída!');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    setupDemoUsers().catch(console.error);
}