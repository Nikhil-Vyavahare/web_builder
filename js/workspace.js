// js/workspace.js
import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const codeEditor = document.getElementById('code-editor');
    const previewFrame = document.getElementById('preview-frame');
    const editLockBtn = document.getElementById('edit-lock-btn');
    const editAiBtn = document.getElementById('edit-ai-btn');
    const saveBtn = document.getElementById('save-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const userNameDisplay = document.getElementById('user-name');
    const userAvatarDisplay = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    let isLocked = true;

    // 1. Setup Theme Toggle
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') document.documentElement.classList.add('dark');

    themeToggleBtn?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if(sunIcon) { sunIcon.style.opacity = isDark ? '0' : '1'; sunIcon.style.transform = isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0) scale(1)'; }
        if(moonIcon) { moonIcon.style.opacity = isDark ? '1' : '0'; moonIcon.style.transform = isDark ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)'; }
    });

    // 2. Auth & Session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const email = session.user.email;
        if(userNameDisplay) userNameDisplay.textContent = email.split('@')[0];
        if(userAvatarDisplay) userAvatarDisplay.textContent = email.charAt(0).toUpperCase();
    } else {
        if(userNameDisplay) userNameDisplay.textContent = "Guest";
        logoutBtn?.classList.add('hidden');
    }

    logoutBtn?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'auth.html';
    });

    // 3. Edit Lock/Unlock Logic
    codeEditor.readOnly = true;
    codeEditor.classList.add('opacity-80', 'cursor-not-allowed');

    editLockBtn?.addEventListener('click', () => {
        isLocked = !isLocked;
        codeEditor.readOnly = isLocked;
        codeEditor.classList.toggle('opacity-80', isLocked);
        codeEditor.classList.toggle('cursor-not-allowed', isLocked);
        
        editLockBtn.innerHTML = isLocked 
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-blue-500"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>`;
    });

    // 4. Preview Generator
    function updatePreview() {
        let htmlCode = codeEditor.value;
        const frameDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

        if (!htmlCode.includes('cdn.tailwindcss.com')) {
            const tailwind = '<script src="https://cdn.tailwindcss.com"></script>';
            htmlCode = htmlCode.includes('<head>') 
                ? htmlCode.replace('<head>', `<head>\n  ${tailwind}`) 
                : `${tailwind}\n${htmlCode}`;
        }

        frameDoc.open();
        frameDoc.write(htmlCode);
        frameDoc.close();
    }

    codeEditor.addEventListener('input', updatePreview);

    // 5. Typewriter Effect Logic
    const savedCode = localStorage.getItem('generatedCode');
    
    function typeWriterEffect(text, speed = 1) {
        let i = 0;
        codeEditor.value = "";
        function type() {
            if (i < text.length) {
                codeEditor.value += text.slice(i, i + 10);
                i += 10;
                updatePreview();
                setTimeout(type, speed);
            }
        }
        type();
    }

    if (savedCode) {
        if (localStorage.getItem('isNewGeneration') === 'true') {
            typeWriterEffect(savedCode);
            localStorage.setItem('isNewGeneration', 'false');
        } else {
            codeEditor.value = savedCode;
            updatePreview();
        }
    }

    // 6. Action Buttons
    editAiBtn?.addEventListener('click', async () => {
        const refinement = prompt("What changes should AI make to this code?");
        if (!refinement) return;

        editAiBtn.disabled = true;
        const original = editAiBtn.innerHTML;
        editAiBtn.innerHTML = '...';

        try {
            const { data, error } = await supabase.functions.invoke('generate-website', {
                body: { prompt: `Refine this code: ${refinement}\n\nCode:\n${codeEditor.value}` }
            });
            if (error) throw error;
            codeEditor.value = data.html;
            updatePreview();
            localStorage.setItem('generatedCode', data.html);
        } catch (err) {
            alert(err.message);
        } finally {
            editAiBtn.disabled = false;
            editAiBtn.innerHTML = original;
        }
    });

    copyBtn?.addEventListener('click', () => {
        navigator.clipboard.writeText(codeEditor.value);
        copyBtn.innerHTML = '✅';
        setTimeout(() => copyBtn.innerHTML = '📋', 2000);
    });

    downloadBtn?.addEventListener('click', () => {
        const blob = new Blob([codeEditor.value], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nva-project.html';
        a.click();
    });

    saveBtn?.addEventListener('click', async () => {
        if (!session) return alert("Log in to save!");
        const { error } = await supabase.from('generated_sites').insert([{
            user_id: session.user.id,
            html_content: codeEditor.value,
            prompt: "Manual Save"
        }]);
        alert(error ? error.message : "Saved to cloud!");
    });
});