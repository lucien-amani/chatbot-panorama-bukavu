/**
 * migrate.mjs — Panorama Assist PocketBase Migration
 * Usage: node migrate.mjs <superadmin_email> <superadmin_password>
 */

const PB_URL = 'http://127.0.0.1:8090';
const [,, email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node migrate.mjs <email> <password>');
  process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────────────
async function api(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = token;
  const res = await fetch(`${PB_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function createCollection(token, payload) {
  try {
    const result = await api('/api/collections', 'POST', payload, token);
    console.log(`  ✅ ${payload.name} (id: ${result.id})`);
    return result;
  } catch (e) {
    console.error(`  ❌ ${payload.name}: ${e.message}`);
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────
async function authenticate(email, password) {
  // PocketBase v0.23+ uses _superusers collection
  const endpoints = [
    { url: '/api/collections/_superusers/auth-with-password', body: { identity: email, password } },
    // Fallback for some v0.38 builds
    { url: '/api/superusers/auth-with-password', body: { identity: email, password } },
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${PB_URL}${ep.url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ep.body),
      });
      if (res.ok) {
        const data = await res.json();
        return data.token;
      }
    } catch (_) {}
  }
  throw new Error(
    'Authentification échouée. Avez-vous créé le compte superadmin sur http://127.0.0.1:8090/_/ ?'
  );
}

async function main() {
  // 1. Auth
  console.log('\n🔐 Authenticating...');
  const token = await authenticate(email, password);
  console.log('✅ Authenticated\n');

  // 2. Create base collections (no relations) first
  console.log('📦 Step 1: Creating base collections...');

  const utilisateurs = await createCollection(token, {
    name: 'utilisateurs', type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id = id || @request.auth.est_admin = true",
    createRule: '', updateRule: "@request.auth.id = id", deleteRule: null,
    indexes: [
      'CREATE UNIQUE INDEX idx_util_google ON utilisateurs (identifiant_google)',
      'CREATE UNIQUE INDEX idx_util_email ON utilisateurs (email)',
    ],
    fields: [
      { name: 'identifiant_google', type: 'text', required: true, max: 255 },
      { name: 'email', type: 'email', required: true },
      { name: 'nom_affiche', type: 'text', required: true, max: 255 },
      { name: 'url_avatar', type: 'url', required: false },
      { name: 'est_admin', type: 'bool', required: false },
      { name: 'derniere_connexion', type: 'date', required: false },
    ],
  });

  const types_chambres = await createCollection(token, {
    name: 'types_chambres', type: 'base',
    listRule: '', viewRule: '',
    createRule: '@request.auth.est_admin = true',
    updateRule: '@request.auth.est_admin = true',
    deleteRule: '@request.auth.est_admin = true',
    indexes: ['CREATE UNIQUE INDEX idx_tc_nom ON types_chambres (nom)'],
    fields: [
      { name: 'nom', type: 'text', required: true, max: 100 },
      { name: 'description', type: 'editor', required: false },
      { name: 'prix_base_nuit', type: 'number', required: true, min: 0 },
      { name: 'capacite_adultes', type: 'number', required: true, min: 1, max: 10, onlyInt: true },
      { name: 'capacite_enfants', type: 'number', required: true, min: 0, max: 10, onlyInt: true },
      { name: 'equipements', type: 'json', required: false },
    ],
  });

  const plats = await createCollection(token, {
    name: 'plats', type: 'base',
    listRule: '', viewRule: '',
    createRule: '@request.auth.est_admin = true',
    updateRule: '@request.auth.est_admin = true',
    deleteRule: '@request.auth.est_admin = true',
    indexes: [
      'CREATE UNIQUE INDEX idx_plats_nom ON plats (nom)',
      'CREATE INDEX idx_plats_cat ON plats (categorie)',
    ],
    fields: [
      { name: 'nom', type: 'text', required: true, max: 255 },
      { name: 'description', type: 'text', required: false },
      { name: 'categorie', type: 'select', required: true, maxSelect: 1, values: ['entree','plat_principal','dessert','boisson','vin'] },
      { name: 'prix', type: 'number', required: true, min: 0 },
      { name: 'disponible', type: 'bool', required: false },
      { name: 'url_image', type: 'file', required: false, maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg','image/png','image/webp'], thumbs: ['400x300','100x100'] },
    ],
  });

  // 3. Collections with relations
  console.log('\n📦 Step 2: Creating collections with relations...');

  const profils = await createCollection(token, {
    name: 'profils', type: 'base',
    listRule: "@request.auth.id != '' && @request.auth.est_admin = true",
    viewRule: '@request.auth.id = utilisateur_id || @request.auth.est_admin = true',
    createRule: "@request.auth.id != ''",
    updateRule: '@request.auth.id = utilisateur_id',
    deleteRule: null,
    indexes: ['CREATE UNIQUE INDEX idx_profils_util ON profils (utilisateur_id)'],
    fields: [
      { name: 'utilisateur_id', type: 'relation', required: true, collectionId: utilisateurs?.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'telephone', type: 'text', required: true, max: 20 },
      { name: 'type_document_identite', type: 'select', required: true, maxSelect: 1, values: ['passeport','cni'] },
      { name: 'numero_document_identite', type: 'text', required: true, max: 50 },
      { name: 'nationalite', type: 'text', required: true, max: 100 },
      { name: 'pays_residence', type: 'text', required: true, max: 100 },
    ],
  });

  const chambres = await createCollection(token, {
    name: 'chambres', type: 'base',
    listRule: '', viewRule: '',
    createRule: '@request.auth.est_admin = true',
    updateRule: '@request.auth.est_admin = true',
    deleteRule: '@request.auth.est_admin = true',
    indexes: ['CREATE UNIQUE INDEX idx_ch_num ON chambres (numero_chambre)'],
    fields: [
      { name: 'numero_chambre', type: 'text', required: true, max: 10 },
      { name: 'type_chambre_id', type: 'relation', required: true, collectionId: types_chambres?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'etage', type: 'number', required: false, min: 0, max: 99, onlyInt: true },
      { name: 'statut', type: 'select', required: true, maxSelect: 1, values: ['disponible','occupee','nettoyage','maintenance'] },
      { name: 'notes', type: 'text', required: false },
    ],
  });

  const reservations = await createCollection(token, {
    name: 'reservations', type: 'base',
    listRule: '@request.auth.id = utilisateur_id || @request.auth.est_admin = true',
    viewRule: '@request.auth.id = utilisateur_id || @request.auth.est_admin = true',
    createRule: "@request.auth.id != ''",
    updateRule: '@request.auth.id = utilisateur_id || @request.auth.est_admin = true',
    deleteRule: null,
    indexes: [
      'CREATE INDEX idx_res_util ON reservations (utilisateur_id)',
      'CREATE INDEX idx_res_statut ON reservations (statut)',
    ],
    fields: [
      { name: 'utilisateur_id', type: 'relation', required: true, collectionId: utilisateurs?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'statut', type: 'select', required: true, maxSelect: 1, values: ['en_attente','confirmee','payee','en_sejour','terminee','annulee'] },
      { name: 'montant_total', type: 'number', required: false, min: 0 },
      { name: 'date_arrivee', type: 'date', required: true },
      { name: 'date_depart', type: 'date', required: true },
      { name: 'nombre_voyageurs', type: 'number', required: false, min: 1, max: 20, onlyInt: true },
      { name: 'demandes_speciales', type: 'text', required: false },
    ],
  });

  await createCollection(token, {
    name: 'lignes_reservation', type: 'base',
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''", updateRule: '@request.auth.est_admin = true', deleteRule: null,
    fields: [
      { name: 'reservation_id', type: 'relation', required: true, collectionId: reservations?.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'chambre_id', type: 'relation', required: true, collectionId: chambres?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'prix_par_nuit', type: 'number', required: true, min: 0 },
      { name: 'lit_supplementaire', type: 'bool', required: false },
    ],
  });

  const commandes = await createCollection(token, {
    name: 'commandes', type: 'base',
    listRule: '@request.auth.id = utilisateur_id || @request.auth.est_admin = true',
    viewRule: '@request.auth.id = utilisateur_id || @request.auth.est_admin = true',
    createRule: "@request.auth.id != ''",
    updateRule: '@request.auth.id = utilisateur_id || @request.auth.est_admin = true',
    deleteRule: null,
    fields: [
      { name: 'utilisateur_id', type: 'relation', required: true, collectionId: utilisateurs?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'reservation_id', type: 'relation', required: false, collectionId: reservations?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'chambre_id', type: 'relation', required: false, collectionId: chambres?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'type_commande', type: 'select', required: true, maxSelect: 1, values: ['room_service','restaurant','blanchisserie','navette'] },
      { name: 'statut', type: 'select', required: true, maxSelect: 1, values: ['en_attente','en_preparation','prete','livree','terminee','annulee'] },
      { name: 'montant_total', type: 'number', required: false, min: 0 },
      { name: 'notes', type: 'text', required: false },
    ],
  });

  await createCollection(token, {
    name: 'lignes_commande', type: 'base',
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''", updateRule: '@request.auth.est_admin = true', deleteRule: null,
    fields: [
      { name: 'commande_id', type: 'relation', required: true, collectionId: commandes?.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'type_article', type: 'select', required: true, maxSelect: 1, values: ['plat','boisson','autre'] },
      { name: 'plat_id', type: 'relation', required: false, collectionId: plats?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'nom_article', type: 'text', required: true, max: 255 },
      { name: 'quantite', type: 'number', required: true, min: 1, max: 99, onlyInt: true },
      { name: 'prix_unitaire', type: 'number', required: true, min: 0 },
      { name: 'instructions_speciales', type: 'text', required: false },
    ],
  });

  await createCollection(token, {
    name: 'journaux_chat', type: 'base',
    listRule: '@request.auth.est_admin = true',
    viewRule: '@request.auth.id = utilisateur_id || @request.auth.est_admin = true',
    createRule: '', updateRule: null, deleteRule: null,
    fields: [
      { name: 'utilisateur_id', type: 'relation', required: false, collectionId: utilisateurs?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'session_id', type: 'text', required: true, max: 100 },
      { name: 'role', type: 'select', required: true, maxSelect: 1, values: ['utilisateur','assistant','fonction'] },
      { name: 'contenu', type: 'text', required: true },
      { name: 'nom_fonction', type: 'text', required: false, max: 100 },
    ],
  });

  await createCollection(token, {
    name: 'notifications', type: 'base',
    listRule: '@request.auth.est_admin = true', viewRule: '@request.auth.est_admin = true',
    createRule: '', updateRule: '@request.auth.est_admin = true', deleteRule: '@request.auth.est_admin = true',
    fields: [
      { name: 'commande_id', type: 'relation', required: false, collectionId: commandes?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'reservation_id', type: 'relation', required: false, collectionId: reservations?.id, cascadeDelete: false, maxSelect: 1 },
      { name: 'type', type: 'select', required: true, maxSelect: 1, values: ['nouvelle_commande','commande_prete','arrivee_aujourd_hui','nettoyage_chambre'] },
      { name: 'message', type: 'text', required: true },
      { name: 'est_lue', type: 'bool', required: false },
    ],
  });

  console.log('\n🎉 Migration terminée avec succès !');
  console.log('   Ouvrez http://127.0.0.1:8090/_/ pour visualiser vos collections.');
}

main().catch(e => { console.error('💥 Erreur fatale:', e.message); process.exit(1); });
