document.addEventListener("DOMContentLoaded", () => {
    
    const screen = document.getElementById('crt-wrapper');
    const input = document.getElementById('cli-input');
    const output = document.getElementById('cli-output');
    const promptSpan = document.querySelector('.prompt-symbol');
    const bootScreen = document.getElementById('boot-screen');
    const feedContainer = document.getElementById('feed-container');
    let loginStep = 0; 
    let cmdTimeout = null; 
    let cmdHistory = JSON.parse(sessionStorage.getItem('term_history')) || [];
    let historyIndex = cmdHistory.length;

    function renderFeed() {
        if (!feedContainer || typeof blogEntries === 'undefined') return;
        
        feedContainer.innerHTML = '';
        const isRoot = localStorage.getItem('user') === 'root';

        blogEntries.forEach(post => {
            const lines = post.content.split('\n');
            let preview = lines.slice(0, 3).join('<br>') + '...';
            let titlePrefix = "";
            let titleStyle = "";

            if (post.restricted) {
                titlePrefix = "[LOCKED] ";
                titleStyle = "color: #ff3333;"; 
                if (!isRoot) {
                    preview = "<span style='color:#555'>[ENCRYPTED CONTENT] - Auth Required</span>";
                } else {
                    titlePrefix = ""; 
                    titleStyle = "color: var(--accent-cyan);"; 
                }
            }

            const article = document.createElement('article');
            article.className = 'post';
            article.innerHTML = `
                <span class="post-meta">${post.date} | ${post.time} | ${post.author}</span>
                <h2 class="post-title">
                    <a href="#" class="cat-trigger" data-file="${post.filename}" style="${titleStyle}">
                        ${titlePrefix}${post.filename}
                    </a>
                </h2>
                <div class="post-content">
                    <p>${preview}</p>
                    <p style="font-size:0.8em; color:#555">
                        <span style="color:var(--accent-pink)">></span> Type <code>cat ${post.filename}</code> to read.
                    </p>
                </div>
            `;
            feedContainer.appendChild(article);
        });

        document.querySelectorAll('.cat-trigger').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const filename = this.getAttribute('data-file');
                if(input) input.value = `cat ${filename}`;
                handleCommand(`cat ${filename}`);
            });
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if(e.key === '/' && document.activeElement !== input) {
            e.preventDefault();
            input.focus();
        }
    });

    if (input) {
        input.focus(); 
        input.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    input.value = cmdHistory[historyIndex];
                }
            } 
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < cmdHistory.length) {
                    historyIndex++;
                    input.value = (historyIndex === cmdHistory.length) ? '' : cmdHistory[historyIndex];
                }
            }
            else if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val) {
                    cmdHistory.push(val);
                    if (cmdHistory.length > 50) cmdHistory.shift();
                    historyIndex = cmdHistory.length;
                    
                    // CHANGED: Save to Session Storage
                    sessionStorage.setItem('term_history', JSON.stringify(cmdHistory));
                }
                input.value = '';
                if (loginStep > 0) handleLogin(val);
                else handleCommand(val);
            }
        });
    }

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const target = this.getAttribute('href');
            if(!target || target.startsWith('#') || target.startsWith('mailto:') || this.target === '_blank' || this.hasAttribute('download') || this.classList.contains('cat-trigger')) return;
            e.preventDefault();
            navigate(target);
        });
    });

    document.addEventListener('click', (e) => {
        
        if (input && !e.target.closest('a') && window.getSelection().toString().length === 0) {
            input.focus();
        }
    });

    if (screen) {
        screen.classList.add('fade-in');
        setTimeout(() => { screen.classList.remove('fade-in'); }, 650);
    }

    renderFeed();

    try {
        if (localStorage.getItem('user') === 'root') activateAdminMode(false);
    } catch (err) { localStorage.removeItem('user'); }


    function navigate(target) {
        if (screen) screen.classList.add('fade-out');
        setTimeout(() => { window.location.href = target; }, 600);
    }

    function print(text, color = 'var(--accent-green)') {
        if (!output) return;
        if (cmdTimeout) clearTimeout(cmdTimeout);
        output.style.display = 'block';
        output.style.color = color;
        output.innerHTML = text;
        cmdTimeout = setTimeout(() => { output.style.display = 'none'; }, 120000);
    }

    function activateAdminMode(showMsg = true) {
        localStorage.setItem('user', 'root');
        if (promptSpan) {
            promptSpan.innerHTML = "root@sys:~#";
            promptSpan.style.color = "var(--accent-pink)";
        }
        if(screen) screen.style.backgroundColor = '#110005';
        if(showMsg) print("ACCESS GRANTED. Welcome, Administrator.", "var(--accent-pink)");
        renderFeed(); 
    }

    function handleLogin(val) {
        if (loginStep === 1) {
            if (val === 'root') {
                print("Password required:", "yellow");
                input.type = "password";
                loginStep = 2;
            } else {
                print("User not found.", "red");
                loginStep = 0;
            }
        } else if (loginStep === 2) {
            if (val === 'password123') { 
                activateAdminMode();
            } else {
                print("Access Denied.", "red");
            }
            input.type = "text";
            loginStep = 0;
        }
    }

    function triggerKernelPanic() {
        if (screen) screen.style.display = 'none'; 
        if (bootScreen) {
            bootScreen.style.display = "block";
            bootScreen.innerHTML = ""; 
            
            const panicText = `
<span style="color:red; font-weight:bold;">KERNEL PANIC: CRITICAL SYSTEM FAILURE</span>
----------------------------------------
Init process killed (pid 1)
Filesystem corrupted: /dev/sda1
VFS: Unable to mount root fs on unknown-block(0,0)

[ 0.000000] Call Trace:
[ 0.000000]  <TASK>
[ 0.000000]  sys_destroy+0x12/0x40
[ 0.000000]  recursive_delete+0x99/0x1a
[ 0.000000]  </TASK>

 System halted.
[SYSTEM] Initiating recovery protocols...
 ACCIDENTAL DELETION: FALSE
 MALICIOUS INTENT: TRUE
 ROOT-LIMIT TRIGGER: REVERT OS
[SYSTEM] Auto restarting....
            `;
            bootScreen.innerHTML = panicText;
        }
        
        setTimeout(() => { location.reload(); }, 8000);
    }

    function runRebootSequence() {
        if (screen) screen.style.display = 'none'; 
        if (bootScreen) {
            bootScreen.style.display = "block";
            const lines = [
                "BIOS DATE 01/15/2026 14:22:01 VER 1.0.2",
                "CPU: NEC V20, SPEED: 8 MHz",
                "640K RAM SYSTEM... OK",
                "Loading Kernel...",
                "Mounting File System...",
                "Checking Disk Quotas...",
                "Starting System Services...",
                "SYSTEM REBOOT INITIATED"
            ];
            let i = 0;
            const interval = setInterval(() => {
                if (i >= lines.length) {
                    clearInterval(interval);
                    location.reload(); 
                } else {
                    bootScreen.innerHTML += lines[i] + "<br>";
                    i++;
                }
            }, 500);
        } else { location.reload(); }
    }

    function handleCommand(rawCmd) {
        if (!rawCmd) return;
        const parts = rawCmd.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const arg1 = parts[1];
        const arg2 = parts[2];
        const isRoot = localStorage.getItem('user') === 'root';

        const commands = {
            'help': () => {
                const common = "CMDS: cd [dir], cat [file], ls, clear, date, history, github, resume";
                const admin = "<br><span style='color:var(--accent-pink)'>ROOT CMDS: color [hex code], logs, reboot, rm, exit</span>";
                return isRoot ? common + admin : common;
            },
            
            'ls': () => {
                let files = [];
                files.push("about/", "projects/");
                if (typeof blogEntries !== 'undefined') {
                    blogEntries.forEach(p => files.push(p.filename));
                }
                files.push("resume.pdf");
                return files.join("  ");
            },

            'cd': () => {
                if (!arg1) return "Usage: cd [directory]";
                if (arg1 === '..') {
                    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
                        navigate('index.html');
                        return "Navigating up...";
                    }
                    return "Already at root.";
                }
                const validPages = ['about', 'projects', 'home', 'index'];
                let target = arg1;
                if (target === 'home' || target === 'index') target = 'index.html';
                else if (!target.endsWith('.html')) target += '.html';

                if (['about.html', 'projects.html', 'index.html'].includes(target)) {
                    navigate(target);
                    return `Changing directory to ${target}...`;
                }
                return `Directory not found: ${arg1}`;
            },

            'cat': () => {
                if (!arg1) return "Usage: cat [file]";
                
                const post = blogEntries.find(p => p.filename === arg1);
                if (post) {
                    if (post.restricted && !isRoot) {
                        return `<span style="color:#ff3333">PERMISSION DENIED: Level 5 Clearance Required.</span><br>You must be root.`;
                    }
                    return `TITLE: ${post.title}\nDATE: ${post.date}\nAUTHOR: ${post.author}\n\n[FULL CONTENT]\n${post.content}`;
                }
                if (arg1 === 'resume.pdf') {
                    window.open('resume.pdf', '_blank');
                    return "Opening resume...";
                }
                return `File not found: ${arg1}`;
            },

            'clear': () => { if(output) output.style.display = "none"; return ""; },
            'date': new Date().toLocaleString(),
            
            // --- UPDATED HISTORY COMMAND ---
            'history': () => {
                // Manual Clear Flag
                if (arg1 === '-c') {
                    cmdHistory = [];
                    historyIndex = 0;
                    sessionStorage.removeItem('term_history');
                    return "History cleared.";
                }
                
                if (cmdHistory.length === 0) return "No history yet.";
                return cmdHistory.map((c, i) => `${i + 1}&nbsp;&nbsp;${c}`).join('<br>');
            },
            
            'github': () => { window.open('https://github.com/itsbibby', '_blank'); return "Opening Personal GitHub..."; },
            'resume': () => { window.open('resume.pdf', '_blank'); return "Opening resume.pdf..."; },

            'su': () => { 
                if(isRoot) return "You are already logged in.";
                loginStep = 1; 
                return "Enter Username:"; 
            },
            'exit': () => {
                localStorage.removeItem('user');
                location.reload(); 
                return "Logging out...";
            },
            'reboot': () => {
                if(!isRoot) return "Permission denied.";
                runRebootSequence(); 
                return "Initiating shutdown sequence...";
            },
            'logs': () => {
                if(!isRoot) return "Permission denied.";
                return `[SYSTEM] Kernel 5.15.0-generic loaded\n[AUTH] User 'root' logged in\n[ERROR] Unauthorized access detected.\n[SYSTEM] ROOT-LIMIT PROTOCOL: ACTIVE`;
            },
            'color': () => {
                if(!isRoot) return "Permission denied.";
                if(screen) screen.style.backgroundColor = arg1;
                return `Background set to ${arg1}`;
            },
            'rm': () => {
                if (!isRoot) return "Permission denied.";
                if (arg1 === '-rf' && arg2 === '/') {
                    setTimeout(triggerKernelPanic, 1000); 
                    return "Deleting all files and directories...";
                }
                return `Cannot remove '${arg1}': Read-only filesystem.`;
            }
        };

        if (commands[cmd]) {
            const resp = typeof commands[cmd] === 'function' ? commands[cmd]() : commands[cmd];
            if(resp) print(`> ${rawCmd}<br>${resp}`);
        } else {
            print(`Command not found: ${cmd}`, "red");
        }
    }
});
/*
This site is written and developed by Bibby 
A place for fun, innovation, and learning.
© 2025-2026, Bibby John, All rights reserved.
*/