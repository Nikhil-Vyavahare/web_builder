// js/app.js
import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const enhanceBtn = document.getElementById('enhance-btn');
    const micBtn = document.getElementById('mic-btn');
    
    // Image Elements
    const attachBtn = document.getElementById('attach-btn');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    // Auth Elements
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userNameDisplay = document.getElementById('user-name');
    const userAvatarDisplay = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    let uploadedImageBase64 = null;
    let currentUser = null;

    // --- 1. AUTHENTICATION LOGIC ---
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            userMenu.classList.add('flex');
            
            const email = currentUser.email;
            userNameDisplay.textContent = email.split('@')[0];
            userAvatarDisplay.textContent = email.charAt(0).toUpperCase();
        }
    } catch (e) {
        console.error("Supabase config error", e);
    }

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });

    // --- 2. INPUT VALIDATION ---
    promptInput.addEventListener('input', () => {
        generateBtn.disabled = promptInput.value.trim().length === 0 && !uploadedImageBase64;
    });

    // --- 3. IMAGE UPLOAD LOGIC ---
    attachBtn.addEventListener('click', () => imageUpload.click());

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImageBase64 = event.target.result; // Saves as data:image/png;base64,...
            imagePreview.src = uploadedImageBase64;
            imagePreviewContainer.classList.remove('hidden');
            generateBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    });

    removeImageBtn.addEventListener('click', () => {
        uploadedImageBase64 = null;
        imageUpload.value = "";
        imagePreviewContainer.classList.add('hidden');
        generateBtn.disabled = promptInput.value.trim().length === 0;
    });

    // --- 4. MIC (SPEECH TO TEXT) LOGIC ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        
        micBtn.addEventListener('click', () => {
            micBtn.classList.add('text-red-500', 'animate-pulse');
            recognition.start();
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            promptInput.value = (promptInput.value + " " + transcript).trim();
            generateBtn.disabled = false;
        };

        recognition.onend = () => {
            micBtn.classList.remove('text-red-500', 'animate-pulse');
        };
    } else {
        micBtn.style.display = 'none'; // Hide if browser doesn't support speech recognition
    }

    // --- 5. ENHANCE PROMPT ---
    enhanceBtn.addEventListener('click', () => {
        const currentPrompt = promptInput.value.trim();
        if (!currentPrompt) return alert("Type a basic idea first!");
        
        enhanceBtn.classList.add('animate-spin');
        
        // Fast frontend enhancement fallback
        setTimeout(() => {
            promptInput.value = `Create a highly professional, modern, and beautiful webpage for: "${currentPrompt}". Use Tailwind CSS for styling via CDN. Include a stunning hero section, elegant typography, interactive hover states, and fully responsive mobile-first design. Ensure all HTML is clean and completely contained in one file.`;
            enhanceBtn.classList.remove('animate-spin');
            generateBtn.disabled = false;
        }, 500);
    });

   // --- 6. GENERATE CODE (SUPABASE EDGE FUNCTION CALL) ---
    generateBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt && !uploadedImageBase64) return;

        const originalBtn = generateBtn.innerHTML;
        generateBtn.innerHTML = `<svg class="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        generateBtn.disabled = true;

        try {
            // CALL YOUR SUPABASE EDGE FUNCTION
            const { data, error } = await supabase.functions.invoke('generate-website', {
                body: { 
                    prompt: prompt,
                    image: uploadedImageBase64 // Sends base64 image if attached
                }
            });

            if (error) throw error;
            if (!data || !data.html) throw new Error("No HTML received from Edge Function");

            // Save the generated HTML to localStorage for the workspace
            localStorage.setItem('generatedCode', data.html);

            // Save to Database History if user is logged in
            if (currentUser) {
                await supabase.from('generated_sites').insert([{ 
                    user_id: currentUser.id,
                    prompt: prompt, 
                    html_content: data.html 
                }]);
            }

            // Redirect to the workspace page
            window.location.href = 'workspace.html';

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            generateBtn.innerHTML = originalBtn;
            generateBtn.disabled = false;
        }
    });
});