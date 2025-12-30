
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../prisma/seed.ts');
let content = fs.readFileSync(seedPath, 'utf-8');

// Blocks to replace
// 1. Translations
const transStart = '// 6. Translations (Extensive)';
const transEnd = '// 5. Sample Volume Discounts';
const transReplace = `    // 6. Translations (FROM FILE)
    console.log('Seeding Translations from JSON...');
    const translations = loadJSON('translations.json');
    if (translations && translations.length > 0) {
        for (const t of translations) {
             await prisma.translation.upsert({
                where: { lang_key: { lang: t.lang, key: t.key } },
                update: { value: t.value },
                create: { lang: t.lang, key: t.key, value: t.value }
            });
        }
    }
`;

// 2. Pages
const pagesStart = '// 8. Default Informational Pages (Multilingual)';
const pagesEnd = '// 7. Help Center Data';
const pagesReplace = `    // 8. Pages (FROM FILE)
    console.log('Seeding Pages from JSON...');
    const pages = loadJSON('pages.json');
    if (pages && pages.length > 0) {
        for (const p of pages) {
             await prisma.page.upsert({
                where: { slug_lang: { slug: p.slug, lang: p.lang } },
                update: { title: p.title, description: p.description, content: p.content },
                create: { slug: p.slug, lang: p.lang, title: p.title, description: p.description, content: p.content }
            });
        }
    }

`;

// 3. Settings
const settingsStart = '// 11. General Settings';
const settingsEnd = "console.log('Seeding finished.')";
const settingsReplace = `    // 11. General Settings (FROM FILE)
    console.log('Seeding Settings from JSON...');
    const settings = loadJSON('settings.json');
    if (settings && settings.length > 0) {
        for (const s of settings) {
            await prisma.setting.upsert({
                where: { key: s.key },
                update: { value: s.value },
                create: { key: s.key, value: s.value, description: s.description || s.key }
            });
        }
    }

    `;

function replaceBlock(name, startMarker, endMarker, replacement) {
    const idxStart = content.indexOf(startMarker);
    const idxEnd = content.indexOf(endMarker, idxStart);

    if (idxStart === -1) {
        console.error(`❌ Marker not found: ${startMarker}`);
        return;
    }
    if (idxEnd === -1) {
        console.error(`❌ Marker not found: ${endMarker}`);
        return;
    }

    console.log(`✅ Replacing block: ${name}`);
    const before = content.substring(0, idxStart);
    const after = content.substring(idxEnd);
    content = before + replacement + "\n" + after;
}

replaceBlock('Translations', transStart, transEnd, transReplace);
replaceBlock('Pages', pagesStart, pagesEnd, pagesReplace);
replaceBlock('Settings', settingsStart, settingsEnd, settingsReplace);

// Cleanup duplicate Magnets if found
const dupMagStart = '// 9. Magnet Prices';
const dupMagEnd = '// 10. Order Sequence';
// Only replace if it's the SECOND occurrence (index > 1000)
// But searching from specific index is safer. 
// We know Help Center starts around 800.
// Duplicate magnets are near end.
const helpIdx = content.indexOf('// 7. Help Center Data');
const dupMagIdx = content.indexOf(dupMagStart, helpIdx); // search AFTER Help Center
if (dupMagIdx !== -1) {
    const dupMagEndIdx = content.indexOf(dupMagEnd, dupMagIdx);
    if (dupMagEndIdx !== -1) {
        console.log('✅ Removing duplicate Magnet Prices section');
        const before = content.substring(0, dupMagIdx);
        const after = content.substring(dupMagEndIdx);
        content = before + after;
    }
}

fs.writeFileSync(seedPath, content, 'utf-8');
console.log('Successfully patched seed.ts');
