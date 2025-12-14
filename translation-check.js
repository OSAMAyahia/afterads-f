// Translation diagnostic script
import fs from 'fs';
import path from 'path';

// Read translation files
const arCommon = JSON.parse(fs.readFileSync('src/i18n/locales/ar/common.json', 'utf8'));
const enCommon = JSON.parse(fs.readFileSync('src/i18n/locales/en/common.json', 'utf8'));

// Blog translation keys used in components
const blogTranslationKeys = [
  'blog.hero_title',
  'blog.hero_highlight', 
  'blog.hero_description',
  'blog.search_placeholder',
  'blog.all_categories',
  'blog.latest_articles',
  'blog.no_results_title',
  'blog.no_results_hint',
  'blog.cta_title',
  'blog.cta_subtitle',
  'blog.cta_button',
  'blog.system_error',
  'blog.retry',
  'blog.loading_post',
  'blog.article_not_found',
  'blog.article_not_found_description',
  'blog.back_to_blog',
  'blog.back',
  'blog.related_posts',
  'blog.content_writer',
  'blog.content_not_available',
  'blog.enjoyed_article',
  'blog.discover_more_articles',
  'blog.browse_all_articles',
  'blog.blog_title',
  'blog.sidebar_left',
  'blog.sidebar_right'
];

console.log('=== Blog Translation Status Check ===\n');

console.log('Arabic translations:');
blogTranslationKeys.forEach(key => {
  const value = key.split('.').reduce((obj, k) => obj?.[k], arCommon);
  console.log(`✓ ${key}: ${value || '❌ MISSING'}`);
});

console.log('\nEnglish translations:');
blogTranslationKeys.forEach(key => {
  const value = key.split('.').reduce((obj, k) => obj?.[k], enCommon);
  console.log(`✓ ${key}: ${value || '❌ MISSING'}`);
});

console.log('\n=== Translation Check Complete ===');