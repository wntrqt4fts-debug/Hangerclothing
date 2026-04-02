// --- 1. CORE SYSTEM & MEMORY ---
let bag = JSON.parse(localStorage.getItem('the_hangers_premium_bag')) || [];

// --- 2. UNIVERSAL UI UPDATER ---
function updateSystemUI() {
    const countBubbles = document.querySelectorAll('.cart-count-display');
    countBubbles.forEach(bubble => { bubble.textContent = bag.length; });

    const cartList = document.getElementById('cart-items');
    if(cartList) {
        cartList.innerHTML = '';
        if(bag.length === 0) {
            cartList.innerHTML = '<p style="text-align:center; color:#888; margin-top:50px; font-size: 13px; font-weight: 500;">Your bag is empty.</p>';
        } else {
            bag.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    <div>
                        <p style="font-weight:800; font-size:13px; margin-bottom:3px; text-transform: uppercase;">${item.name}</p>
                        <small style="color:#666; font-weight: 500;">${item.color} | Size: ${item.size}</small>
                    </div>
                    <div style="text-align:right;">
                        <p style="font-size:14px; font-weight:800; margin-bottom:5px;">₹${item.price.toLocaleString('en-IN')}</p>
                        <button onclick="removeFromBag(${index})" style="color:#ff4f4f; background:none; border:none; cursor:pointer; font-size:10px; font-weight:800; text-transform: uppercase;">Remove</button>
                    </div>
                `;
                cartList.appendChild(li);
            });
        }
    }

    const totalDisplay = document.getElementById('cart-total');
    if(totalDisplay) {
        const total = bag.reduce((sum, item) => sum + item.price, 0);
        totalDisplay.textContent = total.toLocaleString('en-IN');
    }

    const emailHiddenField = document.getElementById('form-details');
    if(emailHiddenField) {
        emailHiddenField.value = bag.map(i => `${i.name} (${i.color}/${i.size}) - ₹${i.price}`).join(' || ');
    }
}

// --- 3. ADD / REMOVE FUNCTIONS ---
function addToBag(btnElement) {
    const card = btnElement.closest('.glass-card');
    if(!card) return;

    const name = card.querySelector('.product-title').textContent;
    const priceRaw = card.querySelector('.product-price').textContent;
    const price = parseInt(priceRaw.replace(/[^\d]/g, '')); 
    
    const activeColor = card.querySelector('.color-dot.active');
    const activeSize = card.querySelector('.size-btn.active');
    
    const color = activeColor ? activeColor.getAttribute('data-color-name') : 'Standard';
    const size = activeSize ? activeSize.textContent : 'M';

    bag.push({ name, price, color, size, id: Date.now() });
    localStorage.setItem('the_hangers_premium_bag', JSON.stringify(bag));
    updateSystemUI();

    const originalText = btnElement.textContent;
    btnElement.textContent = "✓ SECURED";
    btnElement.style.background = "#fff";
    btnElement.style.color = "#000";
    
    setTimeout(() => { 
        btnElement.textContent = originalText; 
        btnElement.style.background = ""; 
        btnElement.style.color = "";
    }, 2000);
}

function removeFromBag(index) {
    bag.splice(index, 1);
    localStorage.setItem('the_hangers_premium_bag', JSON.stringify(bag));
    updateSystemUI();
}

// --- 4. SIDEBAR & MODAL CONTROLS ---
function toggleSidebar() { document.getElementById('left-sidebar').classList.toggle('open'); }
function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('open'); }

function openCheckout() { 
    if(bag.length === 0) { alert("Your bag is empty."); return; }
    const modal = document.getElementById('checkout-modal');
    if(modal) { modal.style.display = 'flex'; toggleCart(); }
}
function closeCheckout() { document.getElementById('checkout-modal').style.display = 'none'; }


// --- 5. INITIALIZATION & CHECKOUT LOGIC ---
window.onload = updateSystemUI;

document.addEventListener('DOMContentLoaded', function() {
    updateLoginUI(); 
    
    // Welcome Video Logic
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const introVideo = document.getElementById('intro-video');

    if (welcomeOverlay && introVideo) {
        if (!sessionStorage.getItem('seen_welcome')) {
            welcomeOverlay.style.display = 'flex';
            introVideo.onended = function() { closeWelcome(); };
        } else {
            welcomeOverlay.style.display = 'none';
        }
    }

    // Checkout / UPI Logic
    const checkoutForm = document.getElementById('checkout-form');
    const submitBtn = document.getElementById('submit-btn');
    const successMessage = document.getElementById('form-success-message');

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            const totalAmount = bag.reduce((sum, item) => sum + item.price, 0);
            const upiId = "YOURNAME@okaxis"; // MAKE SURE TO CHANGE THIS
            const merchantName = "The Hangers";

            const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${totalAmount}&cu=INR`;
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                submitBtn.innerHTML = "OPENING GOOGLE PAY...";
                window.location.href = upiUrl;

                const data = new FormData(checkoutForm);
                data.append("Order_Status", "Payment Attempted via UPI");
                data.append("Total_Amount", "₹" + totalAmount);

                try {
                    await fetch(checkoutForm.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } });
                    checkoutForm.style.display = 'none';
                    successMessage.style.display = 'block';

                    setTimeout(() => {
                        localStorage.removeItem('the_hangers_premium_bag');
                        location.reload();
                    }, 6000);
                } catch (error) { console.log("Silent form error:", error); }
            } else {
                alert(`Please use a mobile phone for Google Pay. On Desktop, please pay ₹${totalAmount} to UPI: ${upiId}`);
            }
        });
    }
});

function closeWelcome() {
    const overlay = document.getElementById('welcome-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
        const vid = document.getElementById('intro-video');
        if(vid) vid.pause(); 
    }, 500); 
    sessionStorage.setItem('seen_welcome', 'true'); 
}

// --- 6. OTP LOGIN & MY PROFILE SYSTEM ---
function openLoginModal() { document.getElementById('login-modal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('login-modal').style.display = 'none'; resetLogin(); }

function sendOTP() {
    const phoneInput = document.getElementById('mobile-number').value;
    if(phoneInput.length === 10 && !isNaN(phoneInput)) {
        document.getElementById('phone-step').style.display = 'none';
        document.getElementById('otp-step').style.display = 'block';
        document.getElementById('display-number').innerText = "+91 " + phoneInput;
        setTimeout(() => { alert("DEMO MODE: Your OTP is 1234"); }, 500);
    } else {
        alert("Please enter a valid 10-digit mobile number.");
    }
}

function verifyOTP() {
    const otpInput = document.getElementById('otp-input').value;
    if(otpInput === "1234") {
        localStorage.setItem('hangers_user_logged_in', 'true');
        localStorage.setItem('hangers_user_phone', document.getElementById('mobile-number').value);
        closeLoginModal();
        updateLoginUI();
    } else { alert("Incorrect OTP. Please try '1234'."); }
}

function resetLogin() {
    document.getElementById('phone-step').style.display = 'block';
    document.getElementById('otp-step').style.display = 'none';
    document.getElementById('mobile-number').value = '';
    document.getElementById('otp-input').value = '';
}

function openAccountModal() {
    document.getElementById('account-modal').style.display = 'flex';
    document.getElementById('profile-phone').value = localStorage.getItem('hangers_user_phone') || '';
    document.getElementById('profile-name').value = localStorage.getItem('hangers_user_name') || '';
    document.getElementById('profile-email').value = localStorage.getItem('hangers_user_email') || '';
    document.getElementById('profile-address').value = localStorage.getItem('hangers_user_address') || '';
    document.getElementById('profile-city').value = localStorage.getItem('hangers_user_city') || '';
    document.getElementById('profile-country').value = localStorage.getItem('hangers_user_country') || 'India';
}

function closeAccountModal() { document.getElementById('account-modal').style.display = 'none'; }

function saveUserProfile() {
    localStorage.setItem('hangers_user_name', document.getElementById('profile-name').value);
    localStorage.setItem('hangers_user_email', document.getElementById('profile-email').value);
    localStorage.setItem('hangers_user_address', document.getElementById('profile-address').value);
    localStorage.setItem('hangers_user_city', document.getElementById('profile-city').value);
    localStorage.setItem('hangers_user_country', document.getElementById('profile-country').value);
    alert("Profile details saved successfully!");
    closeAccountModal();
}

function logoutUser() {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('hangers_user_logged_in');
        closeAccountModal();
        updateLoginUI();
    }
}

function updateLoginUI() {
    const isLoggedIn = localStorage.getItem('hangers_user_logged_in');
    const loginBtn = document.getElementById('user-login-btn');
    if(isLoggedIn === 'true' && loginBtn) {
        loginBtn.innerText = "MY PROFILE";
        loginBtn.onclick = openAccountModal; 
    } else if (loginBtn) {
        loginBtn.innerText = "LOGIN";
        loginBtn.onclick = openLoginModal;
    }
}
