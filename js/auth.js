// js/auth.js
import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const toggleModeBtn = document.getElementById('toggle-mode-btn');
    const togglePasswordBtn = document.getElementById('toggle-password'); // Added reference
    const notification = document.getElementById('notification');
    let isLogin = true;

    // Redirect to chat if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) window.location.href = 'index.html';
    });

    if (toggleModeBtn) {
        toggleModeBtn.addEventListener('click', () => {
            isLogin = !isLogin;
            submitBtn.textContent = isLogin ? "Sign In" : "Sign Up";
            document.getElementById('form-title').textContent = isLogin ? "Welcome Back" : "Create Account";
        });
    }

    // --- PASSWORD VISIBILITY TOGGLE ---
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            // Toggle the type attribute
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle the eye icon (optional: swap icons if you have paths for both)
            const eyeIcon = togglePasswordBtn.querySelector('svg');
            if (type === 'text') {
                // Eye-off icon path
                eyeIcon.innerHTML = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line>';
            } else {
                // Normal eye icon path
                eyeIcon.innerHTML = '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>';
            }
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.textContent = "Loading...";

            try {
                if (isLogin) {
                    const { error } = await supabase.auth.signInWithPassword({
                        email: emailInput.value,
                        password: passwordInput.value
                    });
                    if (error) throw error;
                } else {
                    const { data, error } = await supabase.auth.signUp({
                        email: emailInput.value,
                        password: passwordInput.value
                    });
                    if (error) throw error;
                    // If email confirm is OFF, session is returned immediately
                    if (!data.session) throw new Error("Account created! Please Sign In.");
                }
                window.location.href = 'index.html'; // Instant redirect to chat
            } catch (err) {
                notification.textContent = err.message;
                notification.classList.remove('hidden');
                notification.className = "mt-4 p-3 rounded-md text-sm text-center bg-red-100 text-red-800";
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = isLogin ? "Sign In" : "Sign Up";
            }
        });
    }
});