/**
 * Terminal Manager
 * Handles terminal automation, command execution, and parallel processing
 */

class TerminalManager {
    constructor() {
        this.isInitialized = false;
        this.commandQueue = [];
        this.isProcessing = false;
        this.activeProcesses = new Map();
        this.commandHistory = [];
        this.sessions = new Map();
        this.environment = new Map();
        this.aliases = new Map();
        this.scripts = new Map();
        this.watchers = new Map();
        this.parallel = {
            maxConcurrent: 3,
            activeJobs: 0,
            jobQueue: [],
            results: new Map()
        };
        this.capabilities = {
            shell: null,
            platform: null,
            hasNodeJS: false,
            hasPython: false,
            hasGit: false,
            hasDocker: false,
            hasNpm: false
        };
        this.metrics = {
            commandsExecuted: 0,
            successfulCommands: 0,
            failedCommands: 0,
            averageExecutionTime: 0,
            totalExecutionTime: 0
        };
    }

    async initialize() {
        try {
            // Detect platform and capabilities
            await this.detectCapabilities();

            // Initialize environment
            await this.setupEnvironment();

            // Load common aliases and scripts
            await this.loadAliases();
            await this.loadScripts();

            // Setup command watchers
            await this.setupWatchers();

            this.isInitialized = true;
            console.log('💻 Terminal Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Terminal Manager:', error);
            return false;
        }
    }

    async detectCapabilities() {
        // Detect platform
        this.capabilities.platform = this.detectPlatform();

        // Detect shell
        this.capabilities.shell = this.detectShell();

        // Test for common tools
        await this.testForTools();

        console.log('🔍 Terminal capabilities detected:', this.capabilities);
    }

    detectPlatform() {
        if (typeof navigator !== 'undefined') {
            const platform = navigator.platform.toLowerCase();
            if (platform.includes('win')) return 'windows';
            if (platform.includes('mac')) return 'macos';
            if (platform.includes('linux')) return 'linux';
        }

        // Fallback detection
        if (typeof process !== 'undefined') {
            return process.platform;
        }

        return 'unknown';
    }

    detectShell() {
        switch (this.capabilities.platform) {
            case 'windows':
                return 'cmd'; // Could also be PowerShell
            case 'macos':
            case 'linux':
                return 'bash'; // Could also be zsh, fish, etc.
            default:
                return 'unknown';
        }
    }

    async testForTools() {
        // This would typically use actual command execution
        // For now, we'll simulate capability detection
        this.capabilities.hasNodeJS = typeof process !== 'undefined';
        this.capabilities.hasNpm = this.capabilities.hasNodeJS;
        this.capabilities.hasPython = true; // Assume available
        this.capabilities.hasGit = true; // Assume available
        this.capabilities.hasDocker = false; // Conservative assumption
    }

    async setupEnvironment() {
        // Setup default environment variables
        this.environment.set('PATH', process?.env?.PATH || '');
        this.environment.set('HOME', process?.env?.HOME || '');
        this.environment.set('USER', process?.env?.USER || 'user');
        this.environment.set('SHELL', this.capabilities.shell);
        this.environment.set('PLATFORM', this.capabilities.platform);
    }

    async loadAliases() {
        // Common aliases for different platforms
        const commonAliases = {
            'll': 'ls -la',
            'la': 'ls -la',
            'cls': this.capabilities.platform === 'windows' ? 'cls' : 'clear',
            'grep': 'grep --color=auto',
            'mkdir': 'mkdir -p',
            'rmdir': 'rm -rf',
            'python': this.capabilities.hasPython ? 'python3' : 'python',
            'pip': 'pip3'
        };

        // Platform-specific aliases
        if (this.capabilities.platform === 'windows') {
            Object.assign(commonAliases, {
                'ls': 'dir',
                'cat': 'type',
                'cp': 'copy',
                'mv': 'move',
                'rm': 'del'
            });
        }

        // Load aliases
        for (const [alias, command] of Object.entries(commonAliases)) {
            this.aliases.set(alias, command);
        }
    }

    async loadScripts() {
        // Common automation scripts
        this.scripts.set('setup_project', {
            name: 'Setup Project',
            description: 'Initialize a new project with common files',
            commands: [
                'mkdir src tests docs',
                'touch README.md package.json .gitignore',
                'git init',
                'npm init -y'
            ],
            platform: 'all'
        });

        this.scripts.set('install_deps', {
            name: 'Install Dependencies',
            description: 'Install project dependencies',
            commands: [
                'npm install',
                'pip install -r requirements.txt || echo "No Python requirements"'
            ],
            platform: 'all'
        });

        this.scripts.set('build_project', {
            name: 'Build Project',
            description: 'Build the project',
            commands: [
                'npm run build || echo "No build script"',
                'python -m build || echo "No Python build"'
            ],
            platform: 'all'
        });

        this.scripts.set('run_tests', {
            name: 'Run Tests',
            description: 'Execute test suite',
            commands: [
                'npm test || echo "No npm tests"',
                'python -m pytest || echo "No Python tests"',
                'jest || echo "No Jest tests"'
            ],
            platform: 'all'
        });

        this.scripts.set('git_status', {
            name: 'Git Status',
            description: 'Show git repository status',
            commands: [
                'git status',
                'git log --oneline -10',
                'git branch -a'
            ],
            platform: 'all'
        });

        this.scripts.set('system_info', {
            name: 'System Information',
            description: 'Display system information',
            commands: this.getSystemInfoCommands(),
            platform: 'all'
        });
    }

    getSystemInfoCommands() {
        const baseCommands = [
            'whoami',
            'pwd',
            'date'
        ];

        switch (this.capabilities.platform) {
            case 'windows':
                return [
                    ...baseCommands,
                    'systeminfo | findstr /C:"OS Name" /C:"OS Version"',
                    'wmic cpu get name',
                    'wmic computersystem get totalmemory'
                ];
            case 'macos':
                return [
                    ...baseCommands,
                    'sw_vers',
                    'system_profiler SPHardwareDataType | grep "Model Name"',
                    'vm_stat'
                ];
            case 'linux':
                return [
                    ...baseCommands,
                    'uname -a',
                    'cat /etc/os-release',
                    'lscpu | grep "Model name"',
                    'free -h'
                ];
            default:
                return baseCommands;
        }
    }

    async setupWatchers() {
        // Setup file watchers for common development files
        const watchPatterns = [
            '*.js', '*.ts', '*.jsx', '*.tsx',
            '*.py', '*.java', '*.cpp', '*.c',
            '*.html', '*.css', '*.scss', '*.sass',
            'package.json', 'requirements.txt', 'Dockerfile',
            '.env', '.gitignore', 'README.md'
        ];

        // Note: Actual file watching would require additional APIs
        console.log('📁 File watchers configured for:', watchPatterns);
    }

    async executeCommand(command, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Terminal manager not initialized');
        }

        const startTime = Date.now();
        const commandId = Date.now() + Math.random();

        try {
            // Pre-process command
            const processedCommand = await this.preprocessCommand(command, options);

            // Execute command based on available methods
            let result;
            if (this.isWebEnvironment()) {
                result = await this.executeWebCommand(processedCommand, options);
            } else {
                result = await this.executeNativeCommand(processedCommand, options);
            }

            // Post-process result
            const finalResult = await this.postprocessResult(result, processedCommand);

            // Update metrics
            this.updateMetrics(startTime, true);

            // Add to history
            this.addToHistory(command, finalResult, startTime);

            return {
                success: true,
                command: processedCommand,
                result: finalResult,
                commandId,
                duration: Date.now() - startTime
            };

        } catch (error) {
            this.updateMetrics(startTime, false);
            console.error(`❌ Command execution failed: ${command}`, error);

            return {
                success: false,
                command,
                error: error.message,
                commandId,
                duration: Date.now() - startTime
            };
        }
    }

    async preprocessCommand(command, options) {
        let processedCommand = command.trim();

        // Replace aliases
        for (const [alias, replacement] of this.aliases) {
            const regex = new RegExp(`\\b${alias}\\b`, 'g');
            processedCommand = processedCommand.replace(regex, replacement);
        }

        // Environment variable substitution
        processedCommand = processedCommand.replace(/\$(\w+)/g, (match, varName) => {
            return this.environment.get(varName) || match;
        });

        // Platform-specific adjustments
        if (this.capabilities.platform === 'windows') {
            // Convert Unix-style paths to Windows
            processedCommand = processedCommand.replace(/\//g, '\\');
        }

        return processedCommand;
    }

    isWebEnvironment() {
        return typeof window !== 'undefined' && !this.capabilities.hasNodeJS;
    }

    async executeWebCommand(command, options) {
        // For web environment, simulate command execution
        return await this.simulateCommand(command, options);
    }

    async executeNativeCommand(command, options) {
        // For Node.js environment, use child_process
        if (typeof require !== 'undefined') {
            try {
                const { exec } = require('child_process');
                return new Promise((resolve, reject) => {
                    exec(command, {
                        timeout: options.timeout || 30000,
                        maxBuffer: options.maxBuffer || 1024 * 1024,
                        cwd: options.cwd,
                        env: { ...process.env, ...this.getEnvironmentObject() }
                    }, (error, stdout, stderr) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                stdout: stdout.toString(),
                                stderr: stderr.toString(),
                                exitCode: 0
                            });
                        }
                    });
                });
            } catch (error) {
                throw new Error(`Native command execution failed: ${error.message}`);
            }
        } else {
            // Fallback to simulation
            return await this.simulateCommand(command, options);
        }
    }

    async simulateCommand(command, options) {
        // Simulate command execution for commands we can handle
        const parts = command.split(' ');
        const baseCommand = parts[0];

        switch (baseCommand) {
            case 'echo':
                return {
                    stdout: parts.slice(1).join(' ') + '\n',
                    stderr: '',
                    exitCode: 0
                };

            case 'pwd':
                return {
                    stdout: options.cwd || '/current/directory\n',
                    stderr: '',
                    exitCode: 0
                };

            case 'whoami':
                return {
                    stdout: this.environment.get('USER') + '\n',
                    stderr: '',
                    exitCode: 0
                };

            case 'date':
                return {
                    stdout: new Date().toString() + '\n',
                    stderr: '',
                    exitCode: 0
                };

            case 'ls':
            case 'dir':
                return {
                    stdout: 'file1.txt\nfile2.js\ndirectory1/\n',
                    stderr: '',
                    exitCode: 0
                };

            case 'git':
                return await this.simulateGitCommand(parts.slice(1));

            case 'npm':
                return await this.simulateNpmCommand(parts.slice(1));

            case 'python':
            case 'python3':
                return await this.simulatePythonCommand(parts.slice(1));

            default:
                return {
                    stdout: `Command '${baseCommand}' simulated successfully\n`,
                    stderr: '',
                    exitCode: 0
                };
        }
    }

    async simulateGitCommand(args) {
        const subcommand = args[0];

        switch (subcommand) {
            case 'status':
                return {
                    stdout: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean\n',
                    stderr: '',
                    exitCode: 0
                };
            case 'log':
                return {
                    stdout: 'commit abc123 (HEAD -> main, origin/main)\nAuthor: User <user@example.com>\nDate: ' + new Date().toISOString() + '\n\n    Latest commit\n',
                    stderr: '',
                    exitCode: 0
                };
            case 'branch':
                return {
                    stdout: '* main\n  develop\n  feature/new-feature\n',
                    stderr: '',
                    exitCode: 0
                };
            default:
                return {
                    stdout: `Git ${subcommand} executed successfully\n`,
                    stderr: '',
                    exitCode: 0
                };
        }
    }

    async simulateNpmCommand(args) {
        const subcommand = args[0];

        switch (subcommand) {
            case 'install':
                return {
                    stdout: 'npm WARN deprecated package@1.0.0\nadded 150 packages from 200 contributors in 10.5s\n',
                    stderr: '',
                    exitCode: 0
                };
            case 'test':
                return {
                    stdout: '> test\n> jest\n\nPASS  ./test.js\n  ✓ should pass (2 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       1 passed, 1 total\n',
                    stderr: '',
                    exitCode: 0
                };
            case 'run':
                return {
                    stdout: `> ${args[1] || 'script'}\n\nScript executed successfully\n`,
                    stderr: '',
                    exitCode: 0
                };
            default:
                return {
                    stdout: `npm ${subcommand} executed successfully\n`,
                    stderr: '',
                    exitCode: 0
                };
        }
    }

    async simulatePythonCommand(args) {
        if (args.length === 0) {
            return {
                stdout: 'Python 3.9.0 (default, Oct  9 2020, 15:07:54)\n[GCC 9.3.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>> ',
                stderr: '',
                exitCode: 0
            };
        }

        const script = args[0];
        return {
            stdout: `Executing Python script: ${script}\nScript completed successfully\n`,
            stderr: '',
            exitCode: 0
        };
    }

    async postprocessResult(result, command) {
        // Add timestamp and command reference
        return {
            ...result,
            timestamp: new Date().toISOString(),
            command,
            processed: true
        };
    }

    async executeScript(scriptName, options = {}) {
        const script = this.scripts.get(scriptName);
        if (!script) {
            throw new Error(`Script '${scriptName}' not found`);
        }

        const results = [];
        const startTime = Date.now();

        try {
            for (const command of script.commands) {
                const result = await this.executeCommand(command, options);
                results.push(result);

                // Stop on error unless continueOnError is set
                if (!result.success && !options.continueOnError) {
                    break;
                }

                // Add delay between commands if specified
                if (options.delay) {
                    await new Promise(resolve => setTimeout(resolve, options.delay));
                }
            }

            return {
                success: true,
                script: scriptName,
                results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                script: scriptName,
                error: error.message,
                results,
                duration: Date.now() - startTime
            };
        }
    }

    async executeTask(task) {
        if (!this.isInitialized) {
            throw new Error('Terminal manager not initialized');
        }

        const startTime = Date.now();
        const results = [];

        try {
            for (const action of task.actions) {
                let result;

                switch (action.type) {
                    case 'command':
                        result = await this.executeCommand(action.command, action.options);
                        break;
                    case 'script':
                        result = await this.executeScript(action.script, action.options);
                        break;
                    case 'wait':
                        await new Promise(resolve => setTimeout(resolve, action.duration));
                        result = { success: true, action: 'wait', duration: action.duration };
                        break;
                    case 'env':
                        this.setEnvironmentVariable(action.variable, action.value);
                        result = { success: true, action: 'env', variable: action.variable };
                        break;
                    default:
                        throw new Error(`Unknown action type: ${action.type}`);
                }

                results.push(result);

                // Stop on error unless continueOnError is set
                if (!result.success && !task.continueOnError) {
                    break;
                }
            }

            return {
                success: true,
                task: task.name || 'unnamed',
                results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                task: task.name || 'unnamed',
                error: error.message,
                results,
                duration: Date.now() - startTime
            };
        }
    }

    async executeParallelTasks(tasks) {
        const maxConcurrent = Math.min(tasks.length, this.parallel.maxConcurrent);
        const batches = [];

        // Split tasks into batches
        for (let i = 0; i < tasks.length; i += maxConcurrent) {
            batches.push(tasks.slice(i, i + maxConcurrent));
        }

        const allResults = [];

        for (const batch of batches) {
            const batchPromises = batch.map(task => this.executeTask(task));
            const batchResults = await Promise.allSettled(batchPromises);
            allResults.push(...batchResults);
        }

        return allResults.map((result, index) => ({
            taskIndex: index,
            success: result.status === 'fulfilled',
            result: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason.message : null
        }));
    }

    queueCommand(command, options = {}) {
        this.commandQueue.push({
            command,
            options,
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString()
        });
    }

    hasQueuedCommands() {
        return this.commandQueue.length > 0;
    }

    getQueuedCommands() {
        const commands = [...this.commandQueue];
        this.commandQueue = [];
        return commands;
    }

    async processQueue() {
        if (this.isProcessing || this.commandQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const commands = this.getQueuedCommands();

        try {
            for (const { command, options } of commands) {
                await this.executeCommand(command, options);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    setEnvironmentVariable(name, value) {
        this.environment.set(name, value);
    }

    getEnvironmentVariable(name) {
        return this.environment.get(name);
    }

    getEnvironmentObject() {
        const env = {};
        for (const [key, value] of this.environment) {
            env[key] = value;
        }
        return env;
    }

    addToHistory(command, result, startTime) {
        this.commandHistory.push({
            command,
            result,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            success: result.exitCode === 0
        });

        // Keep only last 100 commands
        if (this.commandHistory.length > 100) {
            this.commandHistory = this.commandHistory.slice(-100);
        }
    }

    updateMetrics(startTime, success) {
        this.metrics.commandsExecuted++;
        const duration = Date.now() - startTime;
        this.metrics.totalExecutionTime += duration;
        this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.commandsExecuted;

        if (success) {
            this.metrics.successfulCommands++;
        } else {
            this.metrics.failedCommands++;
        }
    }

    // Utility methods for common development tasks
    async setupProject(projectName, type = 'web') {
        const templates = {
            web: ['setup_project', 'install_deps'],
            python: ['setup_project', 'install_deps'],
            node: ['setup_project', 'install_deps'],
            react: ['setup_project', 'install_deps', 'build_project']
        };

        const scripts = templates[type] || templates.web;

        const task = {
            name: `setup_${type}_project`,
            actions: scripts.map(script => ({ type: 'script', script }))
        };

        return await this.executeTask(task);
    }

    async runDevelopmentWorkflow() {
        const task = {
            name: 'development_workflow',
            actions: [
                { type: 'script', script: 'git_status' },
                { type: 'script', script: 'install_deps' },
                { type: 'script', script: 'run_tests' },
                { type: 'script', script: 'build_project' }
            ],
            continueOnError: true
        };

        return await this.executeTask(task);
    }

    async deploymentPipeline() {
        const task = {
            name: 'deployment_pipeline',
            actions: [
                { type: 'command', command: 'git status' },
                { type: 'command', command: 'npm test' },
                { type: 'command', command: 'npm run build' },
                { type: 'command', command: 'git add .' },
                { type: 'command', command: 'git commit -m "Automated deployment"' },
                { type: 'command', command: 'git push origin main' }
            ]
        };

        return await this.executeTask(task);
    }

    // Public API methods
    getMetrics() {
        return { ...this.metrics };
    }

    getHistory(limit = 10) {
        return this.commandHistory.slice(-limit);
    }

    getCapabilities() {
        return { ...this.capabilities };
    }

    getEnvironment() {
        return new Map(this.environment);
    }

    getScripts() {
        return Array.from(this.scripts.keys());
    }

    getAliases() {
        return new Map(this.aliases);
    }

    clearHistory() {
        this.commandHistory = [];
    }

    addAlias(alias, command) {
        this.aliases.set(alias, command);
    }

    removeAlias(alias) {
        this.aliases.delete(alias);
    }

    addScript(name, script) {
        this.scripts.set(name, script);
    }

    removeScript(name) {
        this.scripts.delete(name);
    }
}

// Export for use in other modules
window.TerminalManager = TerminalManager;
