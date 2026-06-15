// Interactive Git Command Visualizer & Sandbox - Core JS Logic

// ── Git Repository State ─────────────────────────────────────────────────────
class GitRepository {
    constructor() {
        this.resetToDefault();
    }

    resetToDefault() {
        // Initial setup: c1 (Initial commit)
        this.commits = {
            'c1': {
                id: 'c1',
                message: 'Initial commit',
                parents: [],
                branches: ['main'],
                x: 0,
                y: 0,
                branchTrack: 'main',
                timestamp: new Date(Date.now() - 3600000).toLocaleTimeString()
            }
        };
        this.branches = {
            'main': 'c1'
        };
        this.head = 'main'; // Points to branch name 'main', or direct commit id e.g. 'c1' (detached)
        
        // Workspace Files
        this.workingDir = ['index.html', 'style.css'];
        this.stagingArea = [];
        this.modifiedFiles = [];
        this.stash = [];
        this.commitCounter = 1;
    }

    getCurrentCommitId() {
        if (this.branches[this.head]) {
            return this.branches[this.head]; // HEAD points to branch
        }
        return this.head; // Detached HEAD, points directly to commit
    }

    createCommit(message) {
        this.commitCounter++;
        const newId = 'c' + this.commitCounter;
        const parentId = this.getCurrentCommitId();
        
        // Determine branch track
        let track = 'main';
        if (this.branches[this.head]) {
            track = this.head;
        } else {
            // Detached
            track = 'detached';
        }

        const newCommit = {
            id: newId,
            message: message || `Commit #${this.commitCounter}`,
            parents: [parentId],
            branches: [],
            x: 0,
            y: 0,
            branchTrack: track,
            timestamp: new Date().toLocaleTimeString()
        };

        this.commits[newId] = newCommit;

        // Move active branch pointer to new commit
        if (this.branches[this.head]) {
            this.branches[this.head] = newId;
        } else {
            // Detached HEAD moves directly
            this.head = newId;
        }

        // Clean staging area
        this.stagingArea = [];
        this.modifiedFiles = [];

        return newCommit;
    }

    createBranch(name) {
        if (!name || name.trim() === '') {
            throw new Error("Branch name cannot be empty");
        }
        name = name.trim();
        if (this.branches[name]) {
            throw new Error(`Branch '${name}' already exists`);
        }
        const currentCommit = this.getCurrentCommitId();
        this.branches[name] = currentCommit;
        return name;
    }

    checkout(target) {
        target = target.trim();
        if (this.branches[target]) {
            this.head = target; // Point to branch
            return `Switched to branch '${target}'`;
        } else if (this.commits[target]) {
            this.head = target; // Detached HEAD
            return `Note: checking out '${target}'. You are in 'detached HEAD' state.`;
        } else {
            throw new Error(`pathspec '${target}' did not match any file(s) known to git`);
        }
    }

    // Returns a list of ancestor commit IDs for a given commit
    getAncestors(commitId) {
        const ancestors = new Set();
        const queue = [commitId];
        while (queue.length > 0) {
            const current = queue.shift();
            if (current && !ancestors.has(current)) {
                ancestors.add(current);
                const commit = this.commits[current];
                if (commit && commit.parents) {
                    queue.push(...commit.parents);
                }
            }
        }
        return Array.from(ancestors);
    }

    // Merges targetBranch into current branch
    merge(targetBranch) {
        if (!this.branches[targetBranch]) {
            throw new Error(`Branch '${targetBranch}' does not exist`);
        }

        const currentBranch = this.branches[this.head] ? this.head : null;
        if (!currentBranch) {
            throw new Error("Cannot merge while in detached HEAD state");
        }

        const currentCommitId = this.branches[currentBranch];
        const targetCommitId = this.branches[targetBranch];

        if (currentCommitId === targetCommitId) {
            return "Already up to date.";
        }

        // Check if current is ancestor of target -> Fast-Forward merge
        const targetAncestors = this.getAncestors(targetCommitId);
        if (targetAncestors.includes(currentCommitId)) {
            this.branches[currentBranch] = targetCommitId;
            return `Fast-forward: Switched current branch pointer to '${targetBranch}' head.`;
        }

        // Otherwise, 3-way merge commit
        this.commitCounter++;
        const mergeCommitId = 'c' + this.commitCounter;
        
        const mergeCommit = {
            id: mergeCommitId,
            message: `Merge branch '${targetBranch}' into ${currentBranch}`,
            parents: [currentCommitId, targetCommitId],
            branches: [],
            x: 0,
            y: 0,
            branchTrack: currentBranch,
            timestamp: new Date().toLocaleTimeString()
        };

        this.commits[mergeCommitId] = mergeCommit;
        this.branches[currentBranch] = mergeCommitId;

        return `Merge made by the 'recursive' strategy. Created merge commit ${mergeCommitId}.`;
    }

    // Rebases current branch on top of targetBranch
    rebase(targetBranch) {
        if (!this.branches[targetBranch]) {
            throw new Error(`Branch '${targetBranch}' does not exist`);
        }

        const currentBranch = this.branches[this.head] ? this.head : null;
        if (!currentBranch) {
            throw new Error("Cannot rebase while in detached HEAD state");
        }

        const currentCommitId = this.branches[currentBranch];
        const targetCommitId = this.branches[targetBranch];

        if (currentCommitId === targetCommitId) {
            return "Already up to date.";
        }

        // Find common ancestor (merge base)
        const currentAncestors = this.getAncestors(currentCommitId);
        const targetAncestors = this.getAncestors(targetCommitId);
        
        let commonAncestor = null;
        let curr = currentCommitId;
        const queue = [curr];
        while (queue.length > 0) {
            const node = queue.shift();
            if (targetAncestors.includes(node)) {
                commonAncestor = node;
                break;
            }
            const commit = this.commits[node];
            if (commit && commit.parents) {
                queue.push(...commit.parents);
            }
        }

        if (!commonAncestor) {
            throw new Error("No common ancestor found. Cannot rebase.");
        }

        // Gather all commits on current branch back to common ancestor
        const commitsToReapply = [];
        curr = currentCommitId;
        while (curr && curr !== commonAncestor) {
            commitsToReapply.push(curr);
            const commit = this.commits[curr];
            curr = commit.parents[0];
        }
        commitsToReapply.reverse();

        if (commitsToReapply.length === 0) {
            this.branches[currentBranch] = targetCommitId;
            return `Fast-forwarded current branch on top of '${targetBranch}'.`;
        }

        // Reapply commits on top of target commit
        let parentId = targetCommitId;
        for (const origId of commitsToReapply) {
            this.commitCounter++;
            const newId = 'c' + this.commitCounter;
            const origCommit = this.commits[origId];
            
            this.commits[newId] = {
                id: newId,
                message: `${origCommit.message} (rebased)`,
                parents: [parentId],
                branches: [],
                x: 0,
                y: 0,
                branchTrack: currentBranch,
                timestamp: new Date().toLocaleTimeString()
            };
            parentId = newId;
        }

        this.branches[currentBranch] = parentId;
        return `Successfully rebased and updated refs/heads/${currentBranch}.`;
    }

    resetHard(targetCommit) {
        targetCommit = targetCommit.trim();
        if (!this.commits[targetCommit]) {
            throw new Error(`Commit '${targetCommit}' does not exist`);
        }

        if (this.branches[this.head]) {
            this.branches[this.head] = targetCommit;
        } else {
            this.head = targetCommit;
        }

        this.stagingArea = [];
        this.modifiedFiles = [];
        return `HEAD is now at ${targetCommit}`;
    }

    stashSave(msg) {
        if (this.stagingArea.length === 0 && this.modifiedFiles.length === 0) {
            throw new Error("No local changes to save");
        }
        const stashEntry = {
            id: 'stash@{' + this.stash.length + '}',
            message: msg || `WIP on ${this.head}: ${this.getCurrentCommitId().substring(0, 7)}`,
            stagingArea: [...this.stagingArea],
            modifiedFiles: [...this.modifiedFiles],
            timestamp: new Date().toLocaleTimeString()
        };
        this.stash.unshift(stashEntry); // Push to the top of stash stack
        // Re-index remaining stashes
        this.stash.forEach((s, idx) => {
            s.id = `stash@{${idx}}`;
        });
        this.stagingArea = [];
        this.modifiedFiles = [];
        return `Saved working directory and index state "${stashEntry.message}"`;
    }

    stashPop() {
        if (this.stash.length === 0) {
            throw new Error("No stash entries found");
        }
        const popped = this.stash.shift();
        // Re-index remaining stashes
        this.stash.forEach((s, idx) => {
            s.id = `stash@{${idx}}`;
        });
        this.stagingArea = [...new Set([...this.stagingArea, ...popped.stagingArea])];
        this.modifiedFiles = [...new Set([...this.modifiedFiles, ...popped.modifiedFiles])];
        return `Dropped ${popped.id}. Restored changes to working directory/staging area.`;
    }

    stashList() {
        if (this.stash.length === 0) {
            return "No stash entries found";
        }
        return this.stash.map(s => `${s.id}: ${s.message}`).join('\n');
    }

    stashClear() {
        this.stash = [];
        return "Stash stack cleared.";
    }

    deleteBranch(name) {
        name = name.trim();
        if (!this.branches[name]) {
            throw new Error(`Branch '${name}' not found.`);
        }
        if (this.head === name) {
            throw new Error(`Cannot delete branch '${name}' which you are currently on.`);
        }
        delete this.branches[name];
        return `Deleted branch ${name}.`;
    }

    cherryPick(commitId) {
        commitId = commitId.trim();
        const sourceCommit = this.commits[commitId];
        if (!sourceCommit) {
            throw new Error(`Commit '${commitId}' not found.`);
        }
        
        this.commitCounter++;
        const newId = 'c' + this.commitCounter;
        const parentId = this.getCurrentCommitId();
        
        let track = 'main';
        if (this.branches[this.head]) {
            track = this.head;
        } else {
            track = 'detached';
        }

        const newCommit = {
            id: newId,
            message: `${sourceCommit.message} (cherry-picked)`,
            parents: [parentId],
            branches: [],
            x: 0,
            y: 0,
            branchTrack: track,
            timestamp: new Date().toLocaleTimeString()
        };

        this.commits[newId] = newCommit;

        if (this.branches[this.head]) {
            this.branches[this.head] = newId;
        } else {
            this.head = newId;
        }

        return newCommit;
    }
}

// ── Application UI & Controller ──────────────────────────────────────────────
class GitVisualizerApp {
    constructor() {
        this.repo = new GitRepository();
        this.currentLevel = 1;
        
        // UI References
        this.terminalOutput = document.getElementById('terminal-output');
        this.terminalInput = document.getElementById('terminal-input');
        this.clearTerminalBtn = document.getElementById('clear-terminal');
        
        // Buttons
        this.btnCreateFile = document.getElementById('btn-create-file');
        this.btnGitAdd = document.getElementById('btn-git-add');
        this.btnResetFiles = document.getElementById('btn-git-reset-files');
        this.btnVerify = document.getElementById('btn-check-challenge');
        this.btnResetChallenge = document.getElementById('btn-reset-challenge');
        
        // Challenge Elements
        this.selectLevel = document.getElementById('select-level');
        this.challengeTitle = document.getElementById('challenge-title');
        this.challengeDesc = document.getElementById('challenge-desc');
        this.challengeGoalsList = document.getElementById('challenge-goals-list');
        this.levelIndicator = document.getElementById('level-indicator');

        // Modal Elements
        this.helpToggle = document.getElementById('help-toggle');
        this.helpModal = document.getElementById('help-modal');
        this.modalCloseBtn = document.getElementById('modal-close-btn');

        // Dialog Modal Input
        this.inputModal = document.getElementById('input-modal');
        this.inputModalTitle = document.getElementById('input-modal-title');
        this.inputModalLabel = document.getElementById('input-modal-label');
        this.inputModalField = document.getElementById('input-modal-field');
        this.inputModalSubmit = document.getElementById('input-modal-submit');
        this.inputModalClose = document.getElementById('input-modal-close');
        this.activeInputCallback = null;

        this.challenges = {
            1: {
                title: "Your First Commit",
                desc: "Create a new file, stage it, and record your first commit. Every snapshot starts with a commit to keep files saved in git history.",
                goals: [
                    { text: "Create/Modify at least one file", check: (repo) => repo.modifiedFiles.length > 0 || repo.stagingArea.length > 0 || repo.commitCounter > 1 },
                    { text: "Stage all files using git add", check: (repo) => repo.stagingArea.length > 0 || repo.commitCounter > 1 },
                    { text: "Record a new commit with git commit", check: (repo) => repo.commitCounter > 1 }
                ]
            },
            2: {
                title: "Branching Out",
                desc: "Branches allow us to develop features in isolation. Create a new branch called 'feature' and switch (checkout) into it.",
                goals: [
                    { text: "Create a new branch named 'feature'", check: (repo) => repo.branches['feature'] !== undefined },
                    { text: "Switch active HEAD to point to the 'feature' branch", check: (repo) => repo.head === 'feature' }
                ]
            },
            3: {
                title: "Diverging Timelines",
                desc: "Create a branch called 'bugfix', checkout into it, make a commit. Then, checkout back to 'main' and make a commit there. Notice how both branches branch off from the same ancestor!",
                goals: [
                    { text: "Create and checkout branch 'bugfix'", check: (repo) => repo.branches['bugfix'] !== undefined },
                    { text: "Commit at least once on branch 'bugfix'", check: (repo) => {
                        const bugfixCommit = repo.branches['bugfix'];
                        return bugfixCommit && bugfixCommit !== 'c1' && repo.commits[bugfixCommit].branchTrack === 'bugfix';
                    }},
                    { text: "Checkout back to 'main' and commit there", check: (repo) => {
                        const mainCommit = repo.branches['main'];
                        return mainCommit && mainCommit !== 'c1' && repo.head === 'main';
                    }}
                ]
            },
            4: {
                title: "Fast-Forward & Merge",
                desc: "Merge development branch 'feature' into 'main'. In this challenge, checkout to 'main' first, and merge the 'feature' branch. This will combine the work completed in both branches.",
                goals: [
                    { text: "Ensure branch 'feature' exists and has new commits", check: (repo) => repo.branches['feature'] && repo.branches['feature'] !== 'c1' },
                    { text: "Checkout to 'main'", check: (repo) => repo.head === 'main' },
                    { text: "Merge 'feature' into 'main' using git merge feature", check: (repo) => {
                        const mainHead = repo.branches['main'];
                        const featHead = repo.branches['feature'];
                        const mainAncestors = repo.getAncestors(mainHead);
                        return mainAncestors.includes(featHead);
                    }}
                ]
            },
            5: {
                title: "The Power of Rebase",
                desc: "Rebasing takes the commits on your current branch and replays them on top of another branch. Checkout to 'feature', and run 'git rebase main'. Check how it makes history perfectly linear!",
                goals: [
                    { text: "Ensure 'main' has commits ahead of 'c1'", check: (repo) => repo.branches['main'] !== 'c1' },
                    { text: "Checkout to 'feature' and commit there", check: (repo) => repo.head === 'feature' && repo.branches['feature'] !== repo.branches['main'] },
                    { text: "Rebase 'feature' onto 'main'", check: (repo) => {
                        const mainHead = repo.branches['main'];
                        const featHead = repo.branches['feature'];
                        const featAncestors = repo.getAncestors(featHead);
                        return featAncestors.includes(mainHead);
                    }}
                ]
            }
        };

        this.init();
    }

    init() {
        // Register Event Listeners
        this.terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.terminalInput.value;
                this.executeCommand(cmd);
                this.terminalInput.value = '';
            }
        });

        this.clearTerminalBtn.addEventListener('click', () => {
            this.terminalOutput.innerHTML = '';
        });

        // Quick Sandbox controls
        document.getElementById('action-commit').addEventListener('click', () => {
            this.promptInput("git commit", "Commit Message", "Enter commit message:", "work progress", (msg) => {
                this.executeCommand(`git commit -m "${msg}"`);
            });
        });

        document.getElementById('action-branch').addEventListener('click', () => {
            this.promptInput("git branch", "Branch Name", "Enter new branch name:", "feature-login", (branch) => {
                this.executeCommand(`git branch ${branch}`);
            });
        });

        document.getElementById('action-checkout').addEventListener('click', () => {
            this.promptInput("git checkout", "Checkout Reference", "Enter branch or commit hash:", "main", (target) => {
                this.executeCommand(`git checkout ${target}`);
            });
        });

        document.getElementById('action-merge').addEventListener('click', () => {
            this.promptInput("git merge", "Merge Branch", "Enter branch to merge into current:", "feature", (target) => {
                this.executeCommand(`git merge ${target}`);
            });
        });

        document.getElementById('action-rebase').addEventListener('click', () => {
            this.promptInput("git rebase", "Rebase target", "Reapply commits on top of branch:", "main", (target) => {
                this.executeCommand(`git rebase ${target}`);
            });
        });

        document.getElementById('action-reset').addEventListener('click', () => {
            this.promptInput("git reset", "Commit Hash", "Discard changes and reset current head to:", "c1", (target) => {
                this.executeCommand(`git reset --hard ${target}`);
            });
        });

        // Staging actions
        this.btnCreateFile.addEventListener('click', () => {
            const num = this.repo.workingDir.length + 1;
            const filename = `file_${num}.js`;
            this.repo.workingDir.push(filename);
            this.repo.modifiedFiles.push(filename);
            this.printTerminal(`Modified file '${filename}' in Working Directory.`, 'system-msg');
            this.updateWorkspaceUI();
        });

        this.btnGitAdd.addEventListener('click', () => {
            this.executeCommand('git add .');
        });

        this.btnResetFiles.addEventListener('click', () => {
            this.executeCommand('git restore --staged');
        });

        // Challenge Controls
        this.selectLevel.addEventListener('change', (e) => {
            this.currentLevel = parseInt(e.target.value);
            this.loadChallenge();
        });

        this.btnVerify.addEventListener('click', () => {
            this.verifyChallenge();
        });

        this.btnResetChallenge.addEventListener('click', () => {
            this.repo.resetToDefault();
            this.printTerminal("Repository sandbox reset to initial state.", "system-msg");
            this.updateWorkspaceUI();
            this.renderGraph();
            this.updateChallengeGoals();
            this.showToast("Sandbox Reset Successful!", "info");
        });

        // Modals
        this.helpToggle.addEventListener('click', () => this.toggleHelpModal(true));
        this.modalCloseBtn.addEventListener('click', () => this.toggleHelpModal(false));
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) this.toggleHelpModal(false);
        });

        // Dialog Modal Input Closures
        this.inputModalClose.addEventListener('click', () => this.toggleInputModal(false));
        this.inputModalSubmit.addEventListener('click', () => {
            const val = this.inputModalField.value.trim();
            if (this.activeInputCallback) {
                this.activeInputCallback(val);
            }
            this.toggleInputModal(false);
        });
        this.inputModalField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.inputModalSubmit.click();
            }
        });

        // Initialize display
        this.loadChallenge();
        this.updateWorkspaceUI();
        this.renderGraph();
    }

    promptInput(title, label, placeholder, defaultVal, callback) {
        this.inputModalTitle.textContent = title;
        this.inputModalLabel.textContent = label;
        this.inputModalField.placeholder = placeholder;
        this.inputModalField.value = defaultVal;
        this.activeInputCallback = callback;
        this.toggleInputModal(true);
        setTimeout(() => this.inputModalField.focus(), 150);
    }

    toggleInputModal(show) {
        if (show) {
            this.inputModal.classList.add('active');
        } else {
            this.inputModal.classList.remove('active');
            this.activeInputCallback = null;
        }
    }

    toggleHelpModal(show) {
        if (show) {
            this.helpModal.classList.add('active');
        } else {
            this.helpModal.classList.remove('active');
        }
    }

    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    printTerminal(text, type = 'output-msg') {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.innerText = text;
        this.terminalOutput.appendChild(line);
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }

    executeCommand(cmdRaw) {
        const cmd = cmdRaw.trim();
        if (cmd === '') return;
        this.printTerminal(cmd, 'cmd-input');

        try {
            const parts = cmd.split(/\s+/);
            if (parts[0] !== 'git') {
                throw new Error(`Command not recognized. Did you mean 'git ${cmd}'?`);
            }

            const operation = parts[1];
            switch (operation) {
                case 'add':
                    if (parts[2] === '.' || parts[2] === '-A') {
                        if (this.repo.modifiedFiles.length === 0) {
                            this.printTerminal("Nothing to add.", "system-msg");
                        } else {
                            this.repo.stagingArea.push(...this.repo.modifiedFiles);
                            this.repo.modifiedFiles = [];
                            this.printTerminal("Changes staged for commit.", "success-msg");
                        }
                    } else if (parts[2]) {
                        const file = parts[2];
                        const idx = this.repo.modifiedFiles.indexOf(file);
                        if (idx > -1) {
                            this.repo.stagingArea.push(file);
                            this.repo.modifiedFiles.splice(idx, 1);
                            this.printTerminal(`Staged file '${file}'.`, "success-msg");
                        } else {
                            throw new Error(`File '${file}' is not modified or untracked.`);
                        }
                    } else {
                        throw new Error("Nothing specified, nothing added. Maybe you want to run 'git add .'");
                    }
                    break;

                case 'commit':
                    let msg = "";
                    const mIdx = parts.indexOf('-m');
                    if (mIdx > -1 && parts[mIdx+1]) {
                        const quoteMatch = cmd.match(/-m\s+["']([^"']+)["']/);
                        if (quoteMatch) {
                            msg = quoteMatch[1];
                        } else {
                            msg = parts.slice(mIdx + 1).join(" ").replace(/["']/g, '');
                        }
                    }
                    if (this.repo.stagingArea.length === 0 && this.repo.commitCounter > 0) {
                        throw new Error("No files staged. Please run 'git add' to stage files first.");
                    }
                    const c = this.repo.createCommit(msg);
                    this.printTerminal(`[${this.repo.head} (root-commit) ${c.id}] ${c.message}`, "success-msg");
                    this.printTerminal(`Date: ${c.timestamp}\nCommit recorded successfully.`, "success-msg");
                    this.showToast(`Committed ${c.id} successfully!`);
                    break;

                case 'branch':
                    if (parts.length === 2) {
                        const list = Object.keys(this.repo.branches).map(b => {
                            return b === this.repo.head ? `* ${b}` : `  ${b}`;
                        }).join('\n');
                        this.printTerminal(list, "output-msg");
                    } else if (parts[2] === '-d' && parts[3]) {
                        const delRes = this.repo.deleteBranch(parts[3]);
                        this.printTerminal(delRes, "success-msg");
                        this.showToast(`Deleted branch ${parts[3]}`);
                    } else {
                        const bName = parts[2];
                        this.repo.createBranch(bName);
                        this.printTerminal(`Created branch '${bName}'.`, "success-msg");
                    }
                    break;

                case 'checkout':
                    if (parts[2] === '-b' && parts[3]) {
                        const bName = parts[3];
                        this.repo.createBranch(bName);
                        const checkoutRes = this.repo.checkout(bName);
                        this.printTerminal(`Created and switched to branch '${bName}'.\n${checkoutRes}`, "success-msg");
                    } else {
                        if (!parts[2]) {
                            throw new Error("Branch or commit reference required for checkout.");
                        }
                        const checkoutRes = this.repo.checkout(parts[2]);
                        this.printTerminal(checkoutRes, "success-msg");
                    }
                    break;

                case 'switch':
                    if (parts[2] === '-c' && parts[3]) {
                        const bName = parts[3];
                        this.repo.createBranch(bName);
                        const switchRes = this.repo.checkout(bName);
                        this.printTerminal(`Created and switched to branch '${bName}'.\n${switchRes}`, "success-msg");
                    } else {
                        if (!parts[2]) {
                            throw new Error("Branch name required for switch.");
                        }
                        const switchRes = this.repo.checkout(parts[2]);
                        this.printTerminal(switchRes, "success-msg");
                    }
                    break;

                case 'stash':
                    const subOp = parts[2];
                    if (!subOp || subOp === 'push' || subOp === 'save') {
                        const stashMsg = parts.slice(3).join(" ").replace(/["']/g, '');
                        const stashRes = this.repo.stashSave(stashMsg);
                        this.printTerminal(stashRes, "success-msg");
                        this.showToast("Changes stashed!");
                    } else if (subOp === 'pop') {
                        const stashRes = this.repo.stashPop();
                        this.printTerminal(stashRes, "success-msg");
                        this.showToast("Stash popped!");
                    } else if (subOp === 'list') {
                        const stashRes = this.repo.stashList();
                        this.printTerminal(stashRes, "output-msg");
                    } else if (subOp === 'clear') {
                        const stashRes = this.repo.stashClear();
                        this.printTerminal(stashRes, "success-msg");
                        this.showToast("Stashes cleared");
                    } else {
                        throw new Error(`stash subcommand '${subOp}' is not supported. Use: save, pop, list, clear.`);
                    }
                    break;

                case 'cherry-pick':
                    if (!parts[2]) {
                        throw new Error("Commit hash target required for cherry-pick.");
                    }
                    const cpCommit = this.repo.cherryPick(parts[2]);
                    this.printTerminal(`Successfully cherry-picked commit ${parts[2]} as new commit ${cpCommit.id}.`, "success-msg");
                    this.showToast(`Cherry-picked commit ${parts[2]}`);
                    break;

                case 'diff':
                    this.printTerminal("Displaying repository differences:\n", "system-msg");
                    if (this.repo.modifiedFiles.length === 0 && this.repo.stagingArea.length === 0) {
                        this.printTerminal("No changes detected between Working Directory, Staging Area, and HEAD.", "success-msg");
                    } else {
                        if (this.repo.modifiedFiles.length > 0) {
                            this.printTerminal("Changes in Working Directory (unstaged):", "error-msg");
                            this.repo.modifiedFiles.forEach(f => {
                                this.printTerminal(`  - ${f} (modified/untracked)`, "error-msg");
                            });
                        }
                        if (this.repo.stagingArea.length > 0) {
                            this.printTerminal("Changes in Staging Area (ready to commit):", "success-msg");
                            this.repo.stagingArea.forEach(f => {
                                this.printTerminal(`  + ${f} (staged)`, "success-msg");
                            });
                        }
                    }
                    break;

                case 'merge':
                    if (!parts[2]) {
                        throw new Error("Branch target reference required for merge.");
                    }
                    const mergeRes = this.repo.merge(parts[2]);
                    this.printTerminal(mergeRes, "success-msg");
                    this.showToast("Merge completed!");
                    break;

                case 'rebase':
                    if (!parts[2]) {
                        throw new Error("Branch target reference required for rebase.");
                    }
                    const rebaseRes = this.repo.rebase(parts[2]);
                    this.printTerminal(rebaseRes, "success-msg");
                    this.showToast("Rebase completed!");
                    break;

                case 'reset':
                    if (parts[2] === '--hard' && parts[3]) {
                        const resetRes = this.repo.resetHard(parts[3]);
                        this.printTerminal(resetRes, "success-msg");
                        this.showToast(`Reset HEAD to ${parts[3]}`);
                    } else {
                        throw new Error("Simulated environment supports 'git reset --hard <commit-hash>'");
                    }
                    break;

                case 'restore':
                    if (parts[2] === '--staged') {
                        if (this.repo.stagingArea.length === 0) {
                            this.printTerminal("Staging area is already clean.", "system-msg");
                        } else {
                            this.repo.modifiedFiles.push(...this.repo.stagingArea);
                            this.repo.stagingArea = [];
                            this.printTerminal("Staged changes restored.", "success-msg");
                        }
                    } else {
                        throw new Error("Use 'git restore --staged' to unstage files.");
                    }
                    break;

                case 'log':
                    this.printTerminal("Displaying commit logs:\n", "system-msg");
                    const currentId = this.repo.getCurrentCommitId();
                    const list = this.repo.getAncestors(currentId);
                    list.forEach(id => {
                        const commit = this.repo.commits[id];
                        this.printTerminal(`commit ${commit.id}\nAuthor: Developer\nDate: ${commit.timestamp}\n\n    ${commit.message}\n`, "output-msg");
                    });
                    break;

                case 'status':
                    const activeBranch = this.repo.branches[this.repo.head] ? this.repo.head : `HEAD detached at ${this.repo.head}`;
                    this.printTerminal(`On branch ${activeBranch}`, "output-msg");
                    if (this.repo.stagingArea.length > 0) {
                        this.printTerminal("Changes to be committed:\n" + this.repo.stagingArea.map(f => `  staged:   ${f}`).join('\n'), "success-msg");
                    }
                    if (this.repo.modifiedFiles.length > 0) {
                        this.printTerminal("Changes not staged for commit:\n" + this.repo.modifiedFiles.map(f => `  modified: ${f}`).join('\n'), "error-msg");
                    }
                    if (this.repo.stagingArea.length === 0 && this.repo.modifiedFiles.length === 0) {
                        this.printTerminal("nothing to commit, working tree clean", "success-msg");
                    }
                    break;

                default:
                    throw new Error(`Operation '${operation}' is not supported in the sandbox. Try commit, branch, checkout, merge, rebase, switch, stash, cherry-pick, diff, status or log.`);
            }

            this.updateWorkspaceUI();
            this.renderGraph();
            this.updateChallengeGoals();

        } catch (error) {
            this.printTerminal(`Error: ${error.message}`, 'error-msg');
        }
    }

    updateWorkspaceUI() {
        const wdContainer = document.getElementById('wd-files');
        const stagingContainer = document.getElementById('staging-files');
        const totalBadge = document.getElementById('files-count');

        wdContainer.innerHTML = '';
        stagingContainer.innerHTML = '';

        this.repo.workingDir.forEach(file => {
            const el = document.createElement('div');
            const isModified = this.repo.modifiedFiles.includes(file);
            el.className = `file-item ${isModified ? 'modified' : ''}`;
            el.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                ${file} ${isModified ? '*' : ''}
            `;
            el.addEventListener('click', () => {
                if (!isModified && !this.repo.stagingArea.includes(file)) {
                    this.repo.modifiedFiles.push(file);
                    this.printTerminal(`Modified file '${file}'`, 'system-msg');
                    this.updateWorkspaceUI();
                }
            });
            wdContainer.appendChild(el);
        });

        this.repo.stagingArea.forEach(file => {
            const el = document.createElement('div');
            el.className = `file-item staged`;
            el.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                ${file}
            `;
            stagingContainer.appendChild(el);
        });

        const modifiedCount = this.repo.modifiedFiles.length;
        const stagedCount = this.repo.stagingArea.length;
        
        this.btnGitAdd.disabled = modifiedCount === 0;
        this.btnResetFiles.disabled = stagedCount === 0;

        totalBadge.textContent = `${this.repo.workingDir.length} Files`;
    }

    renderGraph() {
        const svg = document.getElementById('git-graph');
        const nodesGroup = document.getElementById('graph-nodes');
        const linksGroup = document.getElementById('graph-links');
        const labelsGroup = document.getElementById('graph-labels');
        const gridGroup = document.getElementById('grid-lines');

        nodesGroup.innerHTML = '';
        linksGroup.innerHTML = '';
        labelsGroup.innerHTML = '';
        gridGroup.innerHTML = '';

        const currentBranchLabel = document.getElementById('current-branch-label');
        const headPointerLabel = document.getElementById('head-pointer-label');
        currentBranchLabel.textContent = this.repo.head;
        headPointerLabel.textContent = `${this.repo.head} (${this.repo.getCurrentCommitId()})`;

        const branchTracks = ['main'];
        Object.keys(this.repo.branches).forEach(b => {
            if (b !== 'main' && !branchTracks.includes(b)) {
                branchTracks.push(b);
            }
        });

        const startX = 80;
        const trackSpacing = 110;
        const startY = 80;
        const commitSpacing = 95;

        const commitQueue = ['c1'];
        const visited = new Set();
        const commitLayers = {};
        let levelCount = 0;

        while (commitQueue.length > 0) {
            const size = commitQueue.length;
            for (let i = 0; i < size; i++) {
                const node = commitQueue.shift();
                if (visited.has(node)) continue;
                visited.add(node);
                commitLayers[node] = levelCount;

                const children = Object.keys(this.repo.commits).filter(id => {
                    const cNode = this.repo.commits[id];
                    return cNode.parents && cNode.parents.includes(node);
                });
                commitQueue.push(...children);
            }
            levelCount++;
        }

        const getBranchColor = (track) => {
            if (track === 'main') return 'var(--color-main)';
            if (track === 'feature') return 'var(--color-feature)';
            if (track === 'bugfix') return 'var(--color-bugfix)';
            if (track === 'hotfix') return 'var(--color-hotfix)';
            return 'var(--color-detached)';
        };

        branchTracks.forEach((b, idx) => {
            const x = startX + idx * trackSpacing;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x);
            line.setAttribute("y1", 0);
            line.setAttribute("x2", x);
            line.setAttribute("y2", 1000);
            line.setAttribute("stroke", "var(--border-color)");
            line.setAttribute("stroke-dasharray", "4,4");
            gridGroup.appendChild(line);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", x);
            text.setAttribute("y", 20);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "var(--text-muted)");
            text.setAttribute("font-size", "10px");
            text.setAttribute("font-family", "Fira Code, monospace");
            text.textContent = b.toUpperCase();
            gridGroup.appendChild(text);
        });

        Object.keys(this.repo.commits).forEach(id => {
            const commit = this.repo.commits[id];
            let trackIdx = branchTracks.indexOf(commit.branchTrack);
            if (trackIdx === -1) {
                trackIdx = branchTracks.length;
            }
            commit.x = startX + trackIdx * trackSpacing;
            commit.y = startY + (commitLayers[id] || 0) * commitSpacing;
        });

        Object.keys(this.repo.commits).forEach(id => {
            const commit = this.repo.commits[id];
            if (commit.parents) {
                commit.parents.forEach(pId => {
                    const parent = this.repo.commits[pId];
                    if (parent) {
                        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        const x1 = parent.x;
                        const y1 = parent.y;
                        const x2 = commit.x;
                        const y2 = commit.y;
                        
                        let d = '';
                        if (x1 === x2) {
                            d = `M ${x1} ${y1} L ${x2} ${x2 === x1 ? y2 : y2 - 10}`;
                        } else {
                            const controlY = y1 + (y2 - y1) / 2;
                            d = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
                        }

                        path.setAttribute("d", d);
                        path.setAttribute("class", "connector-line");
                        path.setAttribute("stroke", getBranchColor(commit.branchTrack));
                        path.setAttribute("marker-start", "url(#arrow)");
                        linksGroup.appendChild(path);
                    }
                });
            }
        });

        Object.keys(this.repo.commits).forEach(id => {
            const commit = this.repo.commits[id];
            
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("class", "commit-node");
            g.setAttribute("transform", `translate(${commit.x}, ${commit.y})`);
            g.addEventListener('click', () => {
                this.executeCommand(`git checkout ${commit.id}`);
            });

            const currentHeadId = this.repo.getCurrentCommitId();
            if (id === currentHeadId) {
                const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                ring.setAttribute("r", "20");
                ring.setAttribute("fill", "none");
                ring.setAttribute("stroke", "var(--danger-color)");
                ring.setAttribute("stroke-width", "1.5");
                ring.setAttribute("stroke-dasharray", "4,2");
                g.appendChild(ring);
            }

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("class", "commit-circle");
            circle.setAttribute("r", "14");
            circle.setAttribute("fill", "var(--card-bg)");
            circle.setAttribute("stroke", getBranchColor(commit.branchTrack));
            g.appendChild(circle);

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("class", "commit-text");
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("y", "4");
            label.setAttribute("fill", varThemeValue('--text-color'));
            label.textContent = commit.id;
            g.appendChild(label);

            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `Hash: ${commit.id}\nMessage: ${commit.message}\nTime: ${commit.timestamp}`;
            g.appendChild(title);

            nodesGroup.appendChild(g);
        });

        const currentHeadCommitId = this.repo.getCurrentCommitId();
        let branchLabelHeights = {};

        Object.keys(this.repo.branches).forEach(bName => {
            const commitId = this.repo.branches[bName];
            const commit = this.repo.commits[commitId];
            if (!commit) return;

            if (!branchLabelHeights[commitId]) branchLabelHeights[commitId] = 0;
            const offset = branchLabelHeights[commitId];
            branchLabelHeights[commitId] += 26;

            const labelX = commit.x + 24;
            const labelY = commit.y - 10 + offset;

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.addEventListener('click', () => {
                this.executeCommand(`git checkout ${bName}`);
            });

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("class", "branch-pointer-rect");
            rect.setAttribute("x", labelX);
            rect.setAttribute("y", labelY);
            rect.setAttribute("width", bName.length * 7 + 16);
            rect.setAttribute("height", "20");
            rect.setAttribute("fill", getBranchColor(bName));
            g.appendChild(rect);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("class", "branch-pointer-text");
            text.setAttribute("x", labelX + 8);
            text.setAttribute("y", labelY + 14);
            text.textContent = bName;
            g.appendChild(text);

            labelsGroup.appendChild(g);
        });

        const headTargetCommit = this.repo.commits[currentHeadCommitId];
        if (headTargetCommit) {
            const isDetached = !this.repo.branches[this.repo.head];
            const headLabel = isDetached ? `HEAD (detached)` : `HEAD -> ${this.repo.head}`;
            
            if (!branchLabelHeights[currentHeadCommitId]) branchLabelHeights[currentHeadCommitId] = 0;
            const offset = branchLabelHeights[currentHeadCommitId];
            
            const labelX = headTargetCommit.x + 24;
            const labelY = headTargetCommit.y - 10 + offset;

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("class", "head-pointer-rect");
            rect.setAttribute("x", labelX);
            rect.setAttribute("y", labelY);
            rect.setAttribute("width", headLabel.length * 7 + 16);
            rect.setAttribute("height", "20");
            g.appendChild(rect);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("class", "head-pointer-text");
            text.setAttribute("x", labelX + 8);
            text.setAttribute("y", labelY + 14);
            text.textContent = headLabel;
            g.appendChild(text);

            labelsGroup.appendChild(g);
        }

        const logsTableBody = document.getElementById('log-table-body');
        logsTableBody.innerHTML = '';
        const currentId = this.repo.getCurrentCommitId();
        const ancestors = this.repo.getAncestors(currentId);
        
        ancestors.forEach(id => {
            const commit = this.repo.commits[id];
            const branchesAtCommit = Object.keys(this.repo.branches).filter(b => this.repo.branches[b] === id);
            let refs = '';
            if (branchesAtCommit.length > 0) {
                refs = `(${branchesAtCommit.join(', ')})`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${commit.id}</code></td>
                <td>${commit.message}</td>
                <td style="color: var(--primary-color); font-weight:bold;">${refs}</td>
            `;
            logsTableBody.appendChild(tr);
        });
    }

    loadChallenge() {
        const ch = this.challenges[this.currentLevel];
        this.challengeTitle.textContent = ch.title;
        this.challengeDesc.textContent = ch.desc;
        this.levelIndicator.textContent = `Quest ${this.currentLevel}/${Object.keys(this.challenges).length}`;
        
        this.selectLevel.value = this.currentLevel.toString();
        this.updateChallengeGoals();
    }

    updateChallengeGoals() {
        const ch = this.challenges[this.currentLevel];
        this.challengeGoalsList.innerHTML = '';

        ch.goals.forEach(goal => {
            const li = document.createElement('li');
            const isCompleted = goal.check(this.repo);
            if (isCompleted) {
                li.className = 'completed';
            }
            li.textContent = goal.text;
            this.challengeGoalsList.appendChild(li);
        });
    }

    verifyChallenge() {
        const ch = this.challenges[this.currentLevel];
        const allDone = ch.goals.every(goal => goal.check(this.repo));

        if (allDone) {
            this.printTerminal(`\n*** QUEST COMPLETED: ${ch.title} ***`, 'success-msg');
            this.printTerminal("Great work! You have successfully fulfilled all objectives.", 'success-msg');
            this.showToast("Quest Completed! 🚀", "success");
            
            if (this.currentLevel < Object.keys(this.challenges).length) {
                setTimeout(() => {
                    this.currentLevel++;
                    this.loadChallenge();
                    this.printTerminal(`\nLoading next level: Quest ${this.currentLevel}...`, 'system-msg');
                }, 2000);
            } else {
                this.printTerminal("\nCongratulations! You have completed all Git Quests!", "success-msg");
            }
        } else {
            this.printTerminal("\nQuest objectives not met yet. Check the tasks list and try again.", 'error-msg');
            this.showToast("Quest objectives not fully met.", "warning");
        }
    }
}

function varThemeValue(varName) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (varName === '--text-color') {
        return isDark ? '#f0f0f0' : '#333333';
    }
    return '#333333';
}

document.addEventListener('DOMContentLoaded', () => {
    window.gitApp = new GitVisualizerApp();
    
    window.addEventListener('globalThemeChange', () => {
        if (window.gitApp) {
            window.gitApp.renderGraph();
        }
    });
});
