export function createAuthApp({ authApi, userApi, onAuthChange }) {
  let currentUser = null;
  let nicknameCheckTimeout = null;

  const elements = {
    authButtons: document.getElementById("authButtons"),
    userSection: document.getElementById("userSection"),
    userNickname: document.getElementById("userNickname"),
    userIcon: document.getElementById("userIcon"),
    notificationBadge: document.getElementById("notificationBadge"),
    
    menuToggle: document.getElementById("menuToggle"),
    mobileMenu: document.getElementById("mobileMenu"),
    closeMobileMenu: document.getElementById("closeMobileMenu"),
    mobileUserSection: document.getElementById("mobileUserSection"),
    mobileUserNickname: document.getElementById("mobileUserNickname"),
    mobileAuthButtons: document.getElementById("mobileAuthButtons"),
    mobileLoginBtn: document.getElementById("mobileLoginBtn"),
    mobileSignupBtn: document.getElementById("mobileSignupBtn"),
    aboutBtn: document.getElementById("aboutBtn"),
    aboutBtnDesktop: document.getElementById("aboutBtnDesktop"),
    aboutModal: document.getElementById("aboutModal"),
    closeAboutModal: document.getElementById("closeAboutModal"),
    
    loginBtn: document.getElementById("loginBtn"),
    signupBtn: document.getElementById("signupBtn"),
    loginModal: document.getElementById("loginModal"),
    signupModal: document.getElementById("signupModal"),
    profileModal: document.getElementById("profileModal"),
    
    closeLoginModal: document.getElementById("closeLoginModal"),
    closeSignupModal: document.getElementById("closeSignupModal"),
    closeProfileModal: document.getElementById("closeProfileModal"),
    
    loginForm: document.getElementById("loginForm"),
    signupForm: document.getElementById("signupForm"),
    
    switchToSignup: document.getElementById("switchToSignup"),
    switchToLogin: document.getElementById("switchToLogin"),
    
    signupNickname: document.getElementById("signupNickname"),
    nicknameAvailability: document.getElementById("nicknameAvailability"),
    
    logoutBtn: document.getElementById("logoutBtn"),
    
    profileNickname: document.getElementById("profileNickname"),
    profileEmail: document.getElementById("profileEmail"),
    userStories: document.getElementById("userStories"),
    userChapters: document.getElementById("userChapters"),
    userNotifications: document.getElementById("userNotifications"),
    inboxBadge: document.getElementById("inboxBadge"),
  };

  function showModal(modal) {
    modal.classList.remove("hidden");
  }

  function hideModal(modal) {
    modal.classList.add("hidden");
  }

  function showError(message) {
    alert(message);
  }

  function showSuccess(message) {
    alert(message);
  }

  function updateUI() {
    if (currentUser) {
      elements.authButtons.classList.add("hidden");
      elements.userSection.classList.remove("hidden");
      elements.userNickname.textContent = currentUser.nickname;
      
      if (elements.mobileUserSection) {
        elements.mobileUserSection.classList.remove("hidden");
        elements.mobileUserNickname.textContent = currentUser.nickname;
      }
      if (elements.mobileAuthButtons) {
        elements.mobileAuthButtons.classList.add("hidden");
      }
      
      updateNotificationBadge();
    } else {
      elements.authButtons.classList.remove("hidden");
      elements.userSection.classList.add("hidden");
      
      if (elements.mobileUserSection) {
        elements.mobileUserSection.classList.add("hidden");
      }
      if (elements.mobileAuthButtons) {
        elements.mobileAuthButtons.classList.remove("hidden");
      }
    }
  }

  async function updateNotificationBadge() {
    if (!currentUser) return;
    
    try {
      const count = await userApi.getUnreadNotificationCount();
      if (count > 0) {
        elements.notificationBadge.textContent = count;
        elements.notificationBadge.classList.remove("hidden");
      } else {
        elements.notificationBadge.classList.add("hidden");
      }
    } catch (error) {
      console.error("Error updating notification badge:", error);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      currentUser = await authApi.login({ email, password });
      hideModal(elements.loginModal);
      elements.loginForm.reset();
      updateUI();
      onAuthChange(currentUser);
      showSuccess("Sesión iniciada correctamente");
    } catch (error) {
      showError(error.message);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const nickname = document.getElementById("signupNickname").value;

    try {
      currentUser = await authApi.signup({ email, password, nickname });
      hideModal(elements.signupModal);
      elements.signupForm.reset();
      updateUI();
      onAuthChange(currentUser);
      showSuccess("Cuenta creada correctamente");
    } catch (error) {
      showError(error.message);
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout();
      currentUser = null;
      hideModal(elements.profileModal);
      updateUI();
      onAuthChange(null);
      showSuccess("Sesión cerrada");
    } catch (error) {
      showError(error.message);
    }
  }

  async function checkNicknameAvailability() {
    const nickname = elements.signupNickname.value.trim();
    
    if (nickname.length < 3) {
      elements.nicknameAvailability.textContent = "";
      return;
    }

    try {
      const available = await authApi.checkNicknameAvailable(nickname);
      if (available) {
        elements.nicknameAvailability.textContent = "✓ Nickname disponible";
        elements.nicknameAvailability.style.color = "green";
      } else {
        elements.nicknameAvailability.textContent = "✗ Nickname ya en uso";
        elements.nicknameAvailability.style.color = "red";
      }
    } catch (error) {
      elements.nicknameAvailability.textContent = "";
    }
  }

  async function loadProfile() {
    if (!currentUser) return;

    try {
      const profile = await userApi.getProfile();
      elements.profileNickname.textContent = profile.nickname;
      elements.profileEmail.textContent = profile.email;

      elements.userStories.innerHTML = profile.stories.length > 0
        ? profile.stories.map(story => `
            <div class="profile-item">
              <h4>${story.title}</h4>
              <p>${story.chapterCount} capítulos</p>
              <small>${new Date(story.createdAt).toLocaleDateString()}</small>
            </div>
          `).join("")
        : "<p>No has creado historias aún</p>";

      elements.userChapters.innerHTML = profile.chapters.length > 0
        ? profile.chapters.map(chapter => `
            <div class="profile-item">
              <h4>${chapter.storyTitle}</h4>
              <p>Capítulo ${chapter.chapterNumber}</p>
              <small>${new Date(chapter.createdAt).toLocaleDateString()}</small>
            </div>
          `).join("")
        : "<p>No has colaborado en capítulos aún</p>";

      await loadNotifications();
    } catch (error) {
      showError(error.message);
    }
  }

  async function loadNotifications() {
    if (!currentUser) return;

    try {
      const notifications = await userApi.getNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;

      if (unreadCount > 0) {
        elements.inboxBadge.textContent = unreadCount;
        elements.inboxBadge.classList.remove("hidden");
      } else {
        elements.inboxBadge.classList.add("hidden");
      }

      elements.userNotifications.innerHTML = notifications.length > 0
        ? notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
              <p>${notif.message}</p>
              <small>${notif.storyTitle} - ${new Date(notif.createdAt).toLocaleDateString()}</small>
              ${!notif.read ? '<button class="mark-read-btn">Marcar como leído</button>' : ''}
            </div>
          `).join("")
        : "<p>No tienes notificaciones</p>";

      elements.userNotifications.querySelectorAll(".mark-read-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const notifId = e.target.closest(".notification-item").dataset.id;
          await markNotificationRead(notifId);
        });
      });
    } catch (error) {
      showError(error.message);
    }
  }

  async function markNotificationRead(notificationId) {
    try {
      await userApi.markNotificationAsRead(notificationId);
      await loadNotifications();
      await updateNotificationBadge();
    } catch (error) {
      showError(error.message);
    }
  }

  function bindEvents() {
    if (elements.menuToggle) {
      elements.menuToggle.addEventListener("click", () => {
        elements.mobileMenu.classList.remove("hidden");
      });
    }
    
    if (elements.closeMobileMenu) {
      elements.closeMobileMenu.addEventListener("click", () => {
        elements.mobileMenu.classList.add("hidden");
      });
    }
    
    if (elements.mobileLoginBtn) {
      elements.mobileLoginBtn.addEventListener("click", () => {
        elements.mobileMenu.classList.add("hidden");
        showModal(elements.loginModal);
      });
    }
    
    if (elements.mobileSignupBtn) {
      elements.mobileSignupBtn.addEventListener("click", () => {
        elements.mobileMenu.classList.add("hidden");
        showModal(elements.signupModal);
      });
    }
    
    if (elements.aboutBtn) {
      elements.aboutBtn.addEventListener("click", () => {
        elements.mobileMenu.classList.add("hidden");
        showModal(elements.aboutModal);
      });
    }
    
    if (elements.aboutBtnDesktop) {
      elements.aboutBtnDesktop.addEventListener("click", () => {
        showModal(elements.aboutModal);
      });
    }
    
    if (elements.closeAboutModal) {
      elements.closeAboutModal.addEventListener("click", () => hideModal(elements.aboutModal));
    }
    
    if (elements.aboutModal) {
      elements.aboutModal.addEventListener("click", (e) => {
        if (e.target === elements.aboutModal) hideModal(elements.aboutModal);
      });
    }
    
    elements.loginBtn.addEventListener("click", () => showModal(elements.loginModal));
    elements.signupBtn.addEventListener("click", () => showModal(elements.signupModal));
    
    elements.closeLoginModal.addEventListener("click", () => hideModal(elements.loginModal));
    elements.closeSignupModal.addEventListener("click", () => hideModal(elements.signupModal));
    elements.closeProfileModal.addEventListener("click", () => hideModal(elements.profileModal));
    
    elements.loginModal.addEventListener("click", (e) => {
      if (e.target === elements.loginModal) hideModal(elements.loginModal);
    });
    elements.signupModal.addEventListener("click", (e) => {
      if (e.target === elements.signupModal) hideModal(elements.signupModal);
    });
    elements.profileModal.addEventListener("click", (e) => {
      if (e.target === elements.profileModal) hideModal(elements.profileModal);
    });
    
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.signupForm.addEventListener("submit", handleSignup);
    
    elements.switchToSignup.addEventListener("click", (e) => {
      e.preventDefault();
      hideModal(elements.loginModal);
      showModal(elements.signupModal);
    });
    
    elements.switchToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      hideModal(elements.signupModal);
      showModal(elements.loginModal);
    });
    
    elements.signupNickname.addEventListener("input", () => {
      clearTimeout(nicknameCheckTimeout);
      nicknameCheckTimeout = setTimeout(checkNicknameAvailability, 500);
    });
    
    elements.userIcon.addEventListener("click", async () => {
      await loadProfile();
      showModal(elements.profileModal);
    });
    
    elements.logoutBtn.addEventListener("click", handleLogout);
    
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        
        btn.classList.add("active");
        document.getElementById(`${tab}Tab`).classList.add("active");
      });
    });
  }

  async function init() {
    bindEvents();
    
    try {
      currentUser = await authApi.getCurrentUser();
      updateUI();
      onAuthChange(currentUser);
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  }

  function getCurrentUser() {
    return currentUser;
  }

  return {
    init,
    getCurrentUser,
    updateNotificationBadge,
  };
}
