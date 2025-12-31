const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// === LOGGING SETUP ===
const LOG_FILE = path.join(process.cwd(), 'deploy_log.txt');

// Initialize log file
try {
    fs.writeFileSync(LOG_FILE, `=== DEPLOYMENT STARTED AT ${new Date().toISOString()} ===\n`);
} catch (e) {
    console.error('Failed to create log file:', e);
}

// Helper to write to both Console and File
function log(message) {
    try {
        console.log(message); // Show in Plesk UI
        if (typeof message !== 'string') message = JSON.stringify(message, null, 2);
        fs.appendFileSync(LOG_FILE, message + '\n');
    } catch (e) {
        // silently fail logging if FS permissions are bad
    }
}

log('=== CONFIGURING PATHS ===');

// 1. Force-feed common Plesk paths into PATH
const PLESK_DIRS = [
    '/opt/plesk/node/20/bin',
    '/opt/plesk/node/20.19.6/bin',
    '/opt/plesk/node/22/bin',
    '/opt/plesk/node/18/bin'
];
const LOCAL_BIN = path.join(process.cwd(), 'node_modules', '.bin');

// Put Plesk dirs FIRST
process.env.PATH = `${PLESK_DIRS.join(':')}:${LOCAL_BIN}:${process.env.PATH}`;

log(`Modified PATH length: ${process.env.PATH.length}`);

// 2. Command Runner Helper (Captures Output)
function run(cmd) {
    log(`\n> ${cmd}`);
    try {
        // Use 'pipe' to capture output instead of 'inherit' so we can log it
        const output = execSync(cmd, {
            encoding: 'utf8',
            env: process.env,
            stdio: 'pipe' // capture stdout/stderr
        });
        log(output);
    } catch (e) {
        log(`\n!!! COMMAND FAILED: ${cmd}`);
        if (e.stdout) log(`STDOUT:\n${e.stdout.toString()}`);
        if (e.stderr) log(`STDERR:\n${e.stderr.toString()}`);
        throw new Error(`Command failed: ${cmd}`);
    }
}

log('=== STARTING ACTIONS ===');

try {
    // 3. Verify Node Version
    log('\nChecking "node" version in new PATH...');
    try {
        run('node -v');
        run('which node');
    } catch (e) { log('Could not verify node version (minor issue)'); }

    // 4. Clean Locks
    log('\nCleaning locks...');
    try {
        const nextDir = path.join(process.cwd(), '.next');
        const lock = path.join(nextDir, 'lock');
        const dev = path.join(nextDir, 'dev');
        if (fs.existsSync(lock)) fs.unlinkSync(lock);
        if (fs.existsSync(dev)) fs.rmSync(dev, { recursive: true, force: true });
        log('Locks cleaned.');
    } catch (e) { log(`Lock cleaning error: ${e.message}`); }

    // 5. Install
    log('\nRunning npm install...');
    run('npm install');

    // 6. DB (Re-enabled for full test, looking at logs if it fails)
    try {
        log('\nDB Setup...');
        process.env.PRISMA_CLI_BINARY_TARGETS = 'native,debian-openssl-1.1.x,debian-openssl-3.0.x'; // Try to help Prisma
        run('npx prisma generate');
        // run('npx prisma db push --accept-data-loss'); // Still risky, uncomment if build passes
        log('Skipping db push for safety, verify build first.');
    } catch (e) { log(`DB Setup Warning: ${e.message}`); }

    // 7. Build
    log('\nBuilding...');

    // Set env to disable telemetry
    process.env.NEXT_TELEMETRY_DISABLED = '1';

    // Explicitly find Next binary
    const nextJsFile = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

    if (fs.existsSync(nextJsFile)) {
        log(`Found Next.js CLI at: ${nextJsFile}`);
        // Run with increased memory limit just in case
        run(`node --max-old-space-size=4096 "${nextJsFile}" build`);
    } else {
        log('Could not find Next.js CLI at expected path. Trying "npm run build"...');
        run('npm run build');
    }

    // 8. Restart
    log('\nRestarting...');
    const tmp = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
    fs.writeFileSync(path.join(tmp, 'restart.txt'), new Date().toISOString());

    log('=== SUCCESS ===');

} catch (err) {
    log('\n!!! DEPLOY FAILED !!!');
    log(err.message);
    process.exit(1);
}
