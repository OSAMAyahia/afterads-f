// Translation Diagnostic Script
// Add this to your browser console to check translation status

console.log('=== Translation Diagnostic ===');

// Check current language
console.log('Current language:', i18n.language);

// Check if translations are loaded
console.log('Available languages:', Object.keys(i18n.services.resourceStore.data));

// Check specific translation keys
const checkoutKeys = [
  'checkout.checkout',
  'checkout.reviewOrder', 
  'checkout.backToCart',
  'checkout.deliveryInfo',
  'checkout.fullName',
  'checkout.phone',
  'checkout.addressPlaceholder',
  'checkout.addressNote',
  'checkout.notes',
  'checkout.notesPlaceholder',
  'checkout.paymentMethod',
  'checkout.cashOnDelivery',
  'checkout.cashOnDeliveryDesc',
  'checkout.confirmOrder',
  'checkout.termsAgreement'
];

console.log('=== Checking Checkout Translations ===');
checkoutKeys.forEach(key => {
  const translation = i18n.t(key);
  const exists = translation !== key;
  console.log(`${exists ? '✅' : '❌'} ${key}: "${translation}"`);
});

// Check for missing keys
console.log('=== Missing Keys ===');
const missingKeys = checkoutKeys.filter(key => i18n.t(key) === key);
if (missingKeys.length > 0) {
  console.log('Missing translation keys:', missingKeys);
} else {
  console.log('All translation keys found!');
}

// Check translation structure
console.log('=== Translation Structure ===');
console.log('English translations structure:', i18n.services.resourceStore.data.en);
console.log('Arabic translations structure:', i18n.services.resourceStore.data.ar);

// Force reload translations
console.log('=== Force Reload ===');
i18n.reloadResources().then(() => {
  console.log('Translations reloaded');
  
  // Check again after reload
  console.log('=== After Reload ===');
  checkoutKeys.forEach(key => {
    const translation = i18n.t(key);
    const exists = translation !== key;
    console.log(`${exists ? '✅' : '❌'} ${key}: "${translation}"`);
  });
});