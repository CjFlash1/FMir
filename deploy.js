const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// === ROBUST DEPLOY SCRIPT (AUTO-HEALING) ===
// 1. Sets paths
// 2. Cleans corrupted node_modules if install fails
// 3. Hand-off for manual build

const LOG_FILE = path.join(process.cwd(), 'deploy_output.txt');

function log(msg) {
    if (typeof msg !== 'string') msg = JSON.stringify(msg, null, 2);
    console.log(msg); // To stdout
    // Write to file for checking via File Manager
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
    } catch (e) { }
}

function run(cmd, ignoreErrors = false) {
    log(`> ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit', env: process.env });
    } catch (e) {
        if (!ignoreErrors) throw e;
        log(`Warning: Command failed but ignored: ${e.message}`);
    }
}

console.log("\n=== DEPLOYMENT RESET ===");
// Clear previous log
try { fs.writeFileSync(LOG_FILE, "=== DEPLOY START " + new Date().toISOString() + " ===\n"); } catch (e) { }

try {
    // 1. PATH CONFIG
    // We determined Node 21 is correct for this server
    const PLESK_DIRS = ['/opt/plesk/node/21/bin', '/opt/plesk/node/20/bin'];
    const localBin = path.join(process.cwd(), 'node_modules', '.bin');
    process.env.PATH = `${PLESK_DIRS.join(':')}:${localBin}:${process.env.PATH}`;

    // 2. CHECK ENVIRONMENT
    run('node -v');
    run('npm -v');

    // 3. INSTALLATION WITH AUTO-HEAL
    console.log("\n--- INSTALLING DEPENDENCIES ---");
    try {
        // Try normal install first
        run('npm install --no-audit');
    } catch (e) {
        console.error("\n!!! INSTALL FAILED. STARTING AUTO-HEAL !!!");
        console.error("Error was: " + e.message);

        // Nuking node_modules to fix 'Permission Denied' errors
        console.log("Deleting node_modules and package-lock.json...");
        const nm = path.join(process.cwd(), 'node_modules');
        const pl = path.join(process.cwd(), 'package-lock.json');

        if (fs.existsSync(nm)) fs.rmSync(nm, { recursive: true, force: true });
        if (fs.existsSync(pl)) fs.unlinkSync(pl);

        console.log("Cleaning cache...");
        run('npm cache clean --force', true);

        console.log("Retrying install from scratch...");
        run('npm install --no-audit');
    }

    // 4. DATABASE
    console.log("\n--- DB SETUP ---");
    try {
        const prismaBin = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
        if (fs.existsSync(prismaBin)) {
            run(`${prismaBin} generate`);
        } else {
            // Fallback if bin not found (e.g. windows/path issues) but usually correct on linux
            run('npx prisma generate');
        }
    } catch (e) {
        log(`Prisma warning (non-fatal): ${e.message}`);
    }

    // 5. STORAGE SETUP
    console.log("\n--- VERIFYING STORAGE ---");
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    const tempPath = path.join(uploadsPath, 'temp');
    const thumbPath = path.join(uploadsPath, 'thumb');

    [uploadsPath, tempPath, thumbPath].forEach(dir => {
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
            // Try to set permissions to 775 (rwxrwxr-x)
            try { fs.chmodSync(dir, '775'); } catch (e) { }
        }
    });

    // 6. FIX DATA
    console.log("\n--- SEEDING TRANSLATIONS ---");
    try {
        // Force Prisma to use correct engine since auto-detect fails
        // IDENTIFIED: Ubuntu 22.04 (Kernel 5.15) -> Needs debian-openssl-3.0.x
        // CRITICAL FIX: Add system library paths to LD_LIBRARY_PATH because Plesk environments often hide them

        console.log(`Kernel release: ${require('os').release()}`);
        console.log(`Platform: ${require('os').platform()}`);

        const libPaths = [
            '/usr/lib/x86_64-linux-gnu',
            '/lib/x86_64-linux-gnu',
            '/usr/lib64',
            '/lib64',
            '/usr/lib',
            '/lib'
        ];
        const currentPath = process.env.LD_LIBRARY_PATH || '';
        process.env.LD_LIBRARY_PATH = `${libPaths.join(':')}:${currentPath}`;
        console.log(`Updated LD_LIBRARY_PATH: ${process.env.LD_LIBRARY_PATH}`);

        const prismaClientDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
        const engines = [
            'libquery_engine-debian-openssl-3.0.x.so.node', // Correct for Ubuntu 22.04
            'libquery_engine-rhel-openssl-3.0.x.so.node',
            'libquery_engine-linux-musl-openssl-3.0.x.so.node'
        ];

        let engineFound = false;
        for (const engineName of engines) {
            const enginePath = path.join(prismaClientDir, engineName);
            if (fs.existsSync(enginePath)) {
                console.log(`Force-setting engine to: ${engineName}`);
                process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
                engineFound = true;
                break;
            }
        }

        if (!engineFound) {
            console.log("Warning: No OpenSSL 3.0.x engine found. Prisma might fail if auto-detect picks 1.1.x.");
        }

        // Run plain JS script
        run('node src/scripts/seed-missing-translations.js');
    } catch (e) {
        log(`Translation seed warning (non-fatal): ${e.message}`);
    }

    // 5. RESTART
    console.log("\n--- RESTARTING SERVICE ---");
    const tmp = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
    fs.writeFileSync(path.join(tmp, 'restart.txt'), new Date().toISOString());

    console.log("\n=== DEPLOY SUCCESS (Install Only) ===");
    console.log("NOTE: If you changed code, please run 'npm run build' manually via terminal.");

} catch (e) {
    console.error("\n!!! DEPLOY CRITICAL FAILURE !!!");
    console.error(e.message);
    process.exit(1);
}
