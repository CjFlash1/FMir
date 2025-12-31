const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== DEPLOYMENT STARTED (PATH PREPEND STRATEGY) ===');

// 1. Force-feed common Plesk paths into PATH
const PLESK_DIRS = [
    '/opt/plesk/node/20/bin',
    '/opt/plesk/node/20.19.6/bin',
    '/opt/plesk/node/22/bin',
    '/opt/plesk/node/18/bin'
];
const LOCAL_BIN = path.join(process.cwd(), 'node_modules', '.bin');

// Put Plesk dirs FIRST, then local bin, then existing PATH
process.env.PATH = `${PLESK_DIRS.join(':')}:${LOCAL_BIN}:${process.env.PATH}`;

console.log('Modified PATH length:', process.env.PATH.length);

// 2. Command Runner Helper
function run(cmd) {
    console.log(`\n> ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit', env: process.env });
    } catch (e) {
        throw new Error(`Failed: ${cmd}`);
    }
}

try {
    // 3. Verify Node Version
    console.log('\nChecking "node" version in new PATH...');
    try {
        run('node -v'); // Should print v20.x
        run('which node'); // Should print /opt/plesk/...
    } catch (e) { console.log('Could not verify node version (minor issue)'); }

    // 4. Clean Locks
    console.log('\nCleaning locks...');
    try {
        const nextDir = path.join(process.cwd(), '.next');
        const lock = path.join(nextDir, 'lock');
        const dev = path.join(nextDir, 'dev');
        if (fs.existsSync(lock)) fs.unlinkSync(lock);
        if (fs.existsSync(dev)) fs.rmSync(dev, { recursive: true, force: true });
    } catch (e) { }

    // 5. Install
    run('npm install');

    // 6. DB
    try {
        console.log('\nDB Setup...');
        run('prisma generate');
        run('prisma db push --accept-data-loss');
        // run('prisma db seed');
    } catch (e) { console.warn('DB Setup Warning:', e.message); }

    // 7. Build
    console.log('\nBuilding...');
    // We trust 'node' is now correct because of PATH prepending
    const nextJsFile = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
    run(`node "${nextJsFile}" build`);

    // 8. Restart
    console.log('\nRestarting...');
    const tmp = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
    fs.writeFileSync(path.join(tmp, 'restart.txt'), new Date().toISOString());

    console.log('=== SUCCESS ===');

} catch (err) {
    console.error('\n!!! DEPLOY FAILED !!!');
    console.error(err.message);
    process.exit(1);
}
