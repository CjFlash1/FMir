const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== STARTING DEPLOYMENT (WITH DIAGNOSTICS) ===');

// --- DIAGNOSTICS ---
try {
    console.log('\n>>> LS /opt/plesk/node/:');
    // List folders to verify paths
    console.log(execSync('ls -F /opt/plesk/node/').toString());
    console.log('<<< END LS\n');
} catch (e) {
    console.log('LS failed:', e.message);
}
// -------------------

// === CONFIGURATION ===
const NODE_CANDIDATES = [
    // Try exact version
    '/opt/plesk/node/20.19.6/bin/node',
    '/opt/plesk/node/v20.19.6/bin/node',
    // Try short aliases
    '/opt/plesk/node/20/bin/node',
    '/opt/plesk/node/22/bin/node',
    '/opt/plesk/node/18/bin/node',
    // Standard system locations
    '/usr/local/bin/node',
    '/usr/bin/node',
    // Fallback
    'node'
];

// === UTILITIES ===

function findNodeBinary() {
    console.log('Searching for valid Node.js binary...');
    for (const candidate of NODE_CANDIDATES) {
        if (candidate === 'node') {
            // 'node' is a fallback, but we prefer absolute paths.
            // Only return if we haven't found anything else.
            continue;
        }
        if (fs.existsSync(candidate)) {
            console.log(`[OK] Found binary: ${candidate}`);
            return candidate;
        }
    }
    return 'node'; // Worst case
}

const NODE_BIN = findNodeBinary();
console.log('Selected Node Executable:', NODE_BIN);

// Add to PATH if it's an absolute path
if (NODE_BIN !== 'node') {
    const nodeDir = path.dirname(NODE_BIN);
    const localBin = path.join(process.cwd(), 'node_modules', '.bin');
    process.env.PATH = `${nodeDir}:${localBin}:${process.env.PATH}`;
}

// Command Runner
function run(command) {
    console.log(`\n> ${command}`);
    try {
        execSync(command, {
            stdio: 'inherit',
            encoding: 'utf-8',
            env: process.env
        });
    } catch (e) {
        throw new Error(`Command failed: ${command}`);
    }
}

try {
    // Check version
    try { run(`${NODE_BIN} -v`); } catch (e) { }

    // Cleanup Locks
    console.log('\n> Cleaning locks...');
    try {
        const nextDir = path.join(process.cwd(), '.next');
        const mkPath = (p) => path.join(nextDir, p);
        if (fs.existsSync(mkPath('lock'))) fs.unlinkSync(mkPath('lock'));
        if (fs.existsSync(mkPath('dev'))) fs.rmSync(mkPath('dev'), { recursive: true, force: true });
    } catch (e) { }

    // Install
    run('npm install');

    // DB Setup
    try {
        console.log('\n> DB Setup...');
        run('prisma generate');
        run('prisma db push --accept-data-loss');
        run('prisma db seed');
    } catch (e) {
        console.warn('! DB Setup Warning:', e.message);
        console.warn('Continuing...');
    }

    // Build
    console.log('\n> Building...');
    const nextCLI = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
    if (fs.existsSync(nextCLI)) {
        run(`${NODE_BIN} "${nextCLI}" build`);
    } else {
        run('next build');
    }

    // Restart
    console.log('\n> Triggering Restart...');
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    fs.writeFileSync(path.join(tmpDir, 'restart.txt'), new Date().toISOString());

    console.log('=== SUCCESS ===');

} catch (error) {
    console.error('\n!!! CRASH !!!', error.message);
    process.exit(1);
}
