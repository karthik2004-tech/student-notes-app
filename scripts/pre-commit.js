/**
 * Pre-commit hook validator script
 * Checks projects.json format and prevents committing code with unresolved git merge conflict markers.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running pre-commit quality checks...');

// 1. Validate projects.json
try {
    const projectsPath = path.join(__dirname, '..', 'projects.json');
    if (fs.existsSync(projectsPath)) {
        const content = fs.readFileSync(projectsPath, 'utf8');
        JSON.parse(content);
        console.log('✅ projects.json structure is valid JSON.');
    }
} catch (err) {
    console.error('❌ Error: projects.json validation failed: ' + err.message);
    process.exit(1);
}

// 2. Check for merge conflict markers in modified files
try {
    const gitDiff = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    if (gitDiff) {
        const files = gitDiff.split('\n');
        const conflictMarkers = ['<<<<<<<', '=======', '>>>>>>>'];
        
        for (const file of files) {
            if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
                const content = fs.readFileSync(file, 'utf8');
                for (const marker of conflictMarkers) {
                    if (content.includes(marker)) {
                        console.error(`❌ Error: Git conflict marker "${marker}" detected in file: ${file}`);
                        console.error('Please resolve conflict markers before committing.');
                        process.exit(1);
                    }
                }
            }
        }
        console.log('✅ No git conflict markers detected in staged files.');
    }
} catch (err) {
    console.error('❌ Warning during conflict marker check:', err.message);
}

console.log('🚀 Pre-commit checks passed!');
process.exit(0);
