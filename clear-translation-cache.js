// Browser Cache Clear and Translation Fix
// Run these commands in your browser console (F12 → Console tab)

// 1. Clear browser cache for translations
console.log('Clearing translation cache...');
localStorage.removeItem('selectedLanguage');
localStorage.removeItem('i18nextLng');
localStorage.removeItem('i18next');

// 2. Force reload translations
if (window.i18n) {
  console.log('Reloading translations...');
  window.i18n.reloadResources().then(() => {
    console.log('Translations reloaded');
    
    // 3. Check current language
    console.log('Current language:', window.i18n.language);
    
    // 4. Test specific translations
    const testKeys = [
      'checkout.checkout',
      'checkout.addressPlaceholder',
      'checkout.phone',
      'checkout.fullName'
    ];
    
    console.log('Testing translations:');
    testKeys.forEach(key => {
      const translation = window.i18n.t(key);
      console.log(`${key}: "${translation}"`);
    });
    
    // 5. If translations are missing, try switching languages
    if (window.i18n.t('checkout.checkout') === 'checkout.checkout') {
      console.log('Translations missing, switching to English...');
      window.i18n.changeLanguage('en').then(() => {
        console.log('Switched to English');
        console.log('Testing again:');
        testKeys.forEach(key => {
          const translation = window.i18n.t(key);
          console.log(`${key}: "${translation}"`);
        });
      });
    }
  });
} else {
  console.error('i18n not found on window object');
}

// 6. Alternative: Force page reload with cache busting
console.log('Forcing page reload...');
setTimeout(() => {
  window.location.reload(true); // Force reload from server
}, 2000);