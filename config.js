// ============================================================
//  KZO InspectPro - Configuration API
//  Ce fichier configure l'accès à l'IA de votre application.
//  Ne partagez JAMAIS ce fichier avec des tiers.
// ============================================================

const KZO_CONFIG = {
    provider: 'gemini',
    apiKey: '',
    SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycby6XAR9XXWCFMqFAiyF7bjK5RQZxkoclv7KLVuDwJrW2YiNzeVlHr11pfnk3U7l_Nrv/exec',
    GOOGLE_DRIVE_CLIENT_ID: '' // À remplir : Google Cloud Console → OAuth 2.0 Client ID
};

// ============================================================
//  PROFIL ENTREPRISE PERMANENT (Version propriétaire)
//  Ces valeurs s'appliquent toujours à cette installation.
// ============================================================
const KZO_OWNER_PROFILE = {
    name:          'KZO InspectPro',
    inspectorName: 'Jean Eveillard Cazeau',
    address:       'Terrebonne, Québec, Canada',
    phone:         '438-378-6703',
    email:         'kzoinspectpro@gmail.com',
    tps:           '',
    tvq:           ''
};
