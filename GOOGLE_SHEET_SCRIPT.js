// ================================================================
//  KZO InspectPro - Google Apps Script (Webhook)
//  À COLLER DANS : Google Sheet > Extensions > Apps Script
//
//  INSTRUCTIONS :
//  1. Ouvrir votre Google Sheet (créez-en un si nécessaire)
//  2. Menu : Extensions > Apps Script
//  3. Supprimez le code existant et collez TOUT ce fichier
//  4. Cliquez sur "Déployer" > "Nouveau déploiement"
//  5. Type : Application Web
//  6. Exécuter en tant que : Moi (kzoinspectpro@gmail.com)
//  7. Qui a accès : Tout le monde
//  8. Cliquez "Déployer" et copiez l'URL fournie
//  9. Collez cette URL dans config.js => SHEETS_WEBHOOK_URL
// ================================================================

function doPost(e) {
  try {
    // Accepte les données depuis un formulaire (e.parameter.data) OU JSON brut (e.postData.contents)
    let rawData = '';
    if (e.parameter && e.parameter.data) {
      rawData = e.parameter.data;
    } else if (e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    }
    const data = JSON.parse(rawData);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Inspections');
    
    // Créer la feuille si elle n'existe pas
    if (!sheet) {
      sheet = ss.insertSheet('Inspections');
      // Entêtes de colonnes
      sheet.appendRow([
        'Date',
        'Code Inspection',
        'Inspecteur',
        'Client(s)',
        'Adresse propriété',
        'Téléphone client',
        'Prix (avant taxes)',
        'TPS (5%)',
        'TVQ (9.975%)',
        'Total (avec taxes)',
        'Norme pratique',
        'Horodatage'
      ]);
      
      // Style des entêtes
      const headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setBackground('#1e3a5f');
      headerRange.setFontColor('#eab308');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      sheet.setFrozenRows(1);
    }
    
    // Calcul des taxes
    const prix = parseFloat(data.prix) || 0;
    const tps  = Math.round(prix * 0.05 * 100) / 100;
    const tvq  = Math.round(prix * 0.09975 * 100) / 100;
    const total = Math.round((prix + tps + tvq) * 100) / 100;
    
    // Ajouter la ligne de données
    sheet.appendRow([
      data.date          || new Date().toLocaleDateString('fr-CA'),
      data.codeInspection || '',
      data.inspecteur    || 'KZO InspectPro',
      data.client        || '',
      data.adresse       || '',
      data.telephone     || '',
      prix > 0 ? '$' + prix.toFixed(2) : '',
      prix > 0 ? '$' + tps.toFixed(2) : '',
      prix > 0 ? '$' + tvq.toFixed(2) : '',
      prix > 0 ? '$' + total.toFixed(2) : '',
      data.norme         || '',
      new Date().toLocaleString('fr-CA')
    ]);
    
    // Alternance de couleurs des lignes
    const lastRow = sheet.getLastRow();
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, 12).setBackground('#f0f4ff');
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test manuel depuis Apps Script
function testInsert() {
  const fakeData = {
    postData: {
      contents: JSON.stringify({
        date: '2026-04-12',
        codeInspection: 'KZO-12345',
        inspecteur: 'Jean Pelletier',
        client: 'Marc Tremblay',
        adresse: '123 Rue Principale, Québec',
        telephone: '418-555-1234',
        prix: '550',
        norme: 'Réseau IBC'
      })
    }
  };
  doPost(fakeData);
}
