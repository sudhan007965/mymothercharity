let supabaseClient = null;
let isFallbackMode = true;

// Check if Supabase configuration is filled
if (typeof supabase !== "undefined" && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
  supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  isFallbackMode = false;
}

// UI State Management
document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.getElementById("login-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const fallbackBanner = document.getElementById("fallback-banner");
  
  if (isFallbackMode) {
    if (fallbackBanner) fallbackBanner.style.display = "block";
  } else {
    if (fallbackBanner) fallbackBanner.style.display = "none";
  }
  
  checkSession();
  
  // Icon creation
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

function checkSession() {
  const loginContainer = document.getElementById("login-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const adminUserEmail = document.getElementById("admin-user-email");
  
  if (!isFallbackMode && supabaseClient) {
    // Check Supabase session
    const session = supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loginContainer.style.display = "none";
        dashboardContainer.style.display = "block";
        adminUserEmail.textContent = session.user.email;
        loadDashboardPhotos();
      } else {
        loginContainer.style.display = "flex";
        dashboardContainer.style.display = "none";
      }
    });
  } else {
    // Check mock session in LocalStorage
    const isMockLogged = localStorage.getItem("charity_mock_session") === "true";
    if (isMockLogged) {
      loginContainer.style.display = "none";
      dashboardContainer.style.display = "block";
      adminUserEmail.textContent = "admin@charity.org (Demo)";
      loadDashboardPhotos();
    } else {
      loginContainer.style.display = "flex";
      dashboardContainer.style.display = "none";
    }
  }
}

// LOGIN EVENT
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const loginBtn = document.getElementById("btn-login");
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width: 18px; height: 18px; margin-right: 0.5rem;"></i> Logging in...`;
    if (typeof lucide !== "undefined") lucide.createIcons();
    
    if (!isFallbackMode && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
          showToast(error.message, "error");
        } else {
          showToast("Logged in successfully!", "success");
          checkSession();
        }
      } catch (err) {
        showToast("An error occurred during sign in.", "error");
        console.error(err);
      }
    } else {
      // Mock Login Validation
      setTimeout(() => {
        if (email === "admin@charity.org" && password === "password123") {
          localStorage.setItem("charity_mock_session", "true");
          showToast("Logged in successfully in local demo mode!", "success");
          checkSession();
        } else {
          showToast("Invalid email or password. Use credentials shown in the banner.", "error");
        }
      }, 500);
    }
    
    loginBtn.disabled = false;
    loginBtn.innerHTML = "Log In";
  });
}

// LOGOUT EVENT
const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (!isFallbackMode && supabaseClient) {
      await supabaseClient.auth.signOut();
    } else {
      localStorage.removeItem("charity_mock_session");
    }
    showToast("Logged out successfully.", "success");
    checkSession();
  });
}

// LOAD DASHBOARD PHOTOS LIST
let dashboardPhotos = [];

async function loadDashboardPhotos() {
  const photoListContainer = document.getElementById("admin-photos-list");
  if (!photoListContainer) return;
  
  photoListContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">
    <i data-lucide="loader-2" class="animate-spin" style="width: 24px; height: 24px; margin: 0 auto 0.5rem auto;"></i>
    <p>Loading photos...</p>
  </div>`;
  if (typeof lucide !== "undefined") lucide.createIcons();
  
  if (!isFallbackMode && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('gallery_photos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        dashboardPhotos = data;
      } else {
        showToast(error ? error.message : "Failed to load photos", "error");
        dashboardPhotos = [];
      }
    } catch (e) {
      showToast("Error connecting to Supabase.", "error");
      dashboardPhotos = [];
    }
  } else {
    // Load local mock photos + custom local storage uploads
    const defaultMocks = [
      { id: "mock-1", url: "img/image-4/blood.svg", category: "blood", caption: "Blood Donation Drive at Pulivalam" },
      { id: "mock-2", url: "img/image-4/cancer.svg", category: "cancer", caption: "Cancer Awareness Drive at Thiruvarur Bus Station" },
      { id: "mock-3", url: "img/image-5/eye.svg", category: "eye", caption: "Free Eye Care Diagnostic Camp" },
      { id: "mock-4", url: "img/image-5/sapling.svg", category: "sapling", caption: "Tree planting at Kitaramkondan" }
    ];
    
    // Load deleted default mocks list to filter them out if user deleted them in local session
    const deletedMocks = JSON.parse(localStorage.getItem("charity_deleted_mocks") || "[]");
    const activeMocks = defaultMocks.filter(m => !deletedMocks.includes(m.id));
    
    const customPhotos = JSON.parse(localStorage.getItem("charity_custom_photos") || "[]");
    dashboardPhotos = [...customPhotos, ...activeMocks];
  }
  
  renderDashboardPhotos();
}

function renderDashboardPhotos() {
  const photoListContainer = document.getElementById("admin-photos-list");
  if (!photoListContainer) return;
  
  photoListContainer.innerHTML = "";
  
  if (dashboardPhotos.length === 0) {
    photoListContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">
      No photos in gallery. Upload one to start!
    </div>`;
    return;
  }
  
  dashboardPhotos.forEach(photo => {
    const row = document.createElement("div");
    row.className = "admin-photo-row";
    
    let catName = photo.category;
    if (photo.category === "blood") catName = "Blood Donation";
    if (photo.category === "cancer") catName = "Cancer Awareness";
    if (photo.category === "eye") catName = "Eye Camp";
    if (photo.category === "sapling") catName = "Sapling Drive";
    
    row.innerHTML = `
      <img src="${photo.url}" alt="" class="admin-photo-thumb">
      <div class="admin-photo-details">
        <div class="admin-photo-caption">${photo.caption}</div>
        <div class="admin-photo-cat">${catName}</div>
      </div>
      <button class="btn-delete" data-id="${photo.id}" title="Delete Photo">
        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
      </button>
    `;
    
    // Delete event listener
    row.querySelector(".btn-delete").addEventListener("click", () => {
      deletePhoto(photo.id);
    });
    
    photoListContainer.appendChild(row);
  });
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// DELETE EVENT
async function deletePhoto(photoId) {
  const confirmDel = confirm("Are you sure you want to delete this photo from the gallery?");
  if (!confirmDel) return;
  
  if (!isFallbackMode && supabaseClient) {
    try {
      // First fetch the photo row to find the storage filename
      const { data: photoData } = await supabaseClient
        .from('gallery_photos')
        .select('*')
        .eq('id', photoId)
        .single();
        
      if (photoData) {
        // Delete row
        const { error } = await supabaseClient
          .from('gallery_photos')
          .delete()
          .eq('id', photoId);
          
        if (error) {
          showToast(error.message, "error");
        } else {
          showToast("Photo deleted from database successfully.", "success");
          loadDashboardPhotos();
        }
      }
    } catch (e) {
      showToast("Error deleting photo.", "error");
    }
  } else {
    // Delete mock photo
    if (photoId.startsWith("mock-")) {
      // Mark default mock as deleted in localstorage
      const deletedMocks = JSON.parse(localStorage.getItem("charity_deleted_mocks") || "[]");
      deletedMocks.push(photoId);
      localStorage.setItem("charity_deleted_mocks", JSON.stringify(deletedMocks));
      showToast("Mock photo hidden successfully.", "success");
    } else {
      // Delete custom uploaded photo from localStorage list
      let customPhotos = JSON.parse(localStorage.getItem("charity_custom_photos") || "[]");
      customPhotos = customPhotos.filter(p => p.id !== photoId);
      localStorage.setItem("charity_custom_photos", JSON.stringify(customPhotos));
      showToast("Custom photo deleted successfully.", "success");
    }
    loadDashboardPhotos();
  }
}

// UPLOAD FORM EVENT
const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById("photo-file");
    const category = document.getElementById("photo-category").value;
    const caption = document.getElementById("photo-caption").value.trim();
    const uploadBtn = document.getElementById("btn-upload");
    
    if (!fileInput.files || fileInput.files.length === 0) {
      showToast("Please choose an image file to upload.", "error");
      return;
    }
    
    const file = fileInput.files[0];
    
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width: 18px; height: 18px; margin-right: 0.5rem;"></i> Uploading...`;
    if (typeof lucide !== "undefined") lucide.createIcons();
    
    if (!isFallbackMode && supabaseClient) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;
        
        // 1. Upload to Supabase Storage
        const { error: storageError } = await supabaseClient.storage
          .from('gallery-images')
          .upload(filePath, file);
          
        if (storageError) {
          showToast(storageError.message, "error");
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = "Upload to Gallery";
          return;
        }
        
        // 2. Get Public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('gallery-images')
          .getPublicUrl(filePath);
          
        // 3. Insert Database Record
        const { error: dbError } = await supabaseClient
          .from('gallery_photos')
          .insert([{ url: publicUrl, category, caption }]);
          
        if (dbError) {
          showToast(dbError.message, "error");
        } else {
          showToast("Photo uploaded and added to database successfully!", "success");
          uploadForm.reset();
          loadDashboardPhotos();
        }
      } catch (err) {
        showToast("Error uploading file.", "error");
        console.error(err);
      }
    } else {
      // Mock File Upload (Data URL FileReader + localStorage)
      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64Url = evt.target.result;
        const newPhoto = {
          id: `custom-${Date.now()}`,
          url: base64Url,
          category: category,
          caption: caption,
          created_at: new Date().toISOString()
        };
        
        const customPhotos = JSON.parse(localStorage.getItem("charity_custom_photos") || "[]");
        customPhotos.unshift(newPhoto);
        localStorage.setItem("charity_custom_photos", JSON.stringify(customPhotos));
        
        showToast("Photo simulated upload successfully in demo mode!", "success");
        uploadForm.reset();
        loadDashboardPhotos();
      };
      
      reader.onerror = function() {
        showToast("Error reading file locally.", "error");
      };
      
      reader.readAsDataURL(file);
    }
    
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = `<i data-lucide="upload-cloud" style="width: 18px; height: 18px; margin-right: 0.5rem;"></i> Upload to Gallery`;
    if (typeof lucide !== "undefined") lucide.createIcons();
  });
}

// TOAST NOTIFICATIONS
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icon = type === "success" ? "check" : "alert-circle";
  
  toast.innerHTML = `
    <i data-lucide="${icon}" style="stroke: ${type === 'success' ? '#0F6E56' : '#D32F2F'}; width: 20px; height: 20px; flex-shrink: 0;"></i>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

// Spin animation style
const style = document.createElement("style");
style.textContent = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1.5s linear infinite;
}
`;
document.head.appendChild(style);
