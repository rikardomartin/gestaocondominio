// Serviços de autenticação Firebase
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

// Estado global de autenticação
export let currentUser = null;
export let userProfile = null;

// Perfis de usuário disponíveis
export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

// Permissões por perfil
export const PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    viewAll: true,
    registerPayments: true,
    generateReports: true,
    manageSalao: true,
    manageStructure: true,
    manageUsers: true
  },
  [USER_ROLES.OPERATOR]: {
    viewAll: true,
    registerPayments: true,
    generateReports: true, // Permitir acesso ao Painel Geral para consulta de débitos
    manageSalao: false,
    manageStructure: false,
    manageUsers: false
  },
  [USER_ROLES.VIEWER]: {
    viewAll: true,
    registerPayments: false,
    generateReports: false,
    manageSalao: false,
    manageStructure: false,
    manageUsers: false
  }
};

// Listener para mudanças de autenticação
// Listener para mudanças de autenticação
function initAuthListener(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      userProfile = await getUserProfile(user.uid);
      callback({ user: user, profile: userProfile });
    } else {
      currentUser = null;
      userProfile = null;
      callback({ user: null, profile: null });
    }
  });
}

// Login com email e senha
async function loginWithEmail(email, password) {
  try {
    console.log('Iniciando login...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Autenticação bem-sucedida:', user.email);

    // Criar perfil básico diretamente para evitar travamento
    let role = 'admin'; // padrão
    let name = 'Administrador Sistema';

    if (user.email.includes('operador')) {
      role = 'operator';
      name = 'Operador Pagamentos';
    } else if (user.email.includes('viewer')) {
      role = 'viewer';
      name = 'Usuário Visualização';
    }

    const profile = {
      name: name,
      email: user.email,
      role: role,
      createdAt: new Date(),
      createdBy: 'login-direct',
      active: true
    };

    // Tentar salvar perfil, mas não travar se falhar
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, profile);
      console.log('Perfil salvo no Firestore');
    } catch (saveError) {
      console.warn('Erro ao salvar perfil, continuando com perfil temporário:', saveError);
    }

    console.log('Login concluído com sucesso');
    return { user: user, profile: profile };

  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}


// Logout
async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
    userProfile = null;
  } catch (error) {
    console.error('Erro no logout:', error);
    throw error;
  }
}

// Criar usuário (apenas admin)
async function createUser(email, password, userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
      createdBy: (currentUser && currentUser.uid) || 'system',
      active: true
    });

    return user;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

// Buscar perfil do usuário
async function getUserProfile(uid) {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Se o perfil não existe, criar automaticamente baseado no email
      console.log('Perfil não encontrado, criando automaticamente...');

      const user = auth.currentUser;
      if (!user) return null;

      // Determinar role baseado no email
      let role = 'viewer'; // padrão
      let name = user.displayName || 'Usuário';

      if (user.email === 'admin.condominio@gmail.com') {
        role = 'admin';
        name = 'Administrador Sistema';
      } else if (user.email === 'operador.condominio@gmail.com') {
        role = 'operator';
        name = 'Operador Pagamentos';
      } else if (user.email === 'viewer.condominio@gmail.com') {
        role = 'viewer';
        name = 'Usuário Visualização';
      } else if (user.email === 'admin@condominio.com') {
        // Manter compatibilidade com emails antigos
        role = 'admin';
        name = 'Administrador Sistema';
      } else if (user.email === 'operador@condominio.com') {
        role = 'operator';
        name = 'Operador Pagamentos';
      } else if (user.email === 'viewer@condominio.com') {
        role = 'viewer';
        name = 'Usuário Visualização';
      }

      // Criar perfil automaticamente
      const newProfile = {
        name: name,
        email: user.email,
        role: role,
        createdAt: new Date(),
        createdBy: 'auto-system',
        active: true
      };

      try {
        await setDoc(docRef, newProfile);
        console.log('Perfil criado automaticamente:', role);
        return newProfile;
      } catch (createError) {
        console.error('Erro ao criar perfil automaticamente:', createError);
        // Retornar perfil temporário se não conseguir criar no Firestore
        return newProfile;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
}

// Atualizar perfil do usuário
async function updateUserProfile(uid, updates) {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
      updatedBy: currentUser && currentUser.uid
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}

// Verificar permissão
function hasPermission(permission) {
  console.log('🔍 hasPermission chamada para:', permission);
  console.log('👤 userProfile:', userProfile);

  if (!userProfile || !userProfile.role) {
    console.log('❌ Sem perfil de usuário ou role');
    return false;
  }

  const permissions = PERMISSIONS[userProfile.role];
  console.log('🔑 Permissões do role', userProfile.role, ':', permissions);

  const hasAccess = permissions && permissions[permission] === true;
  console.log('✅ Resultado da verificação:', hasAccess);

  return hasAccess;
}

// Verificar se é admin
function isAdmin() {
  return userProfile && userProfile.role === USER_ROLES.ADMIN;
}

// Verificar se é operador ou admin
function isOperatorOrAdmin() {
  return userProfile && (userProfile.role === USER_ROLES.OPERATOR || userProfile.role === USER_ROLES.ADMIN);
}

// Obter usuário atual
function getCurrentUser() {
  return currentUser;
}

// Obter perfil atual
function getCurrentProfile() {
  return userProfile;
}

export {
  initAuthListener,
  loginWithEmail,
  logout,
  createUser,
  getUserProfile,
  updateUserProfile,
  hasPermission,
  isAdmin,
  isOperatorOrAdmin,
  getCurrentUser,
  getCurrentProfile
};
