document.addEventListener("DOMContentLoaded", () => {

  const supabaseClient = window.supabase.createClient(
    window.YTA_CONFIG.supabaseUrl,
    window.YTA_CONFIG.supabaseAnonKey
  );

  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  const dashboard = document.getElementById("dashboard");
  const loginCard = document.querySelector(".login-card");

  const logoutBtn = document.getElementById("logoutBtn");
  const userEmail = document.getElementById("userEmail");

  const totalMembers = document.getElementById("totalMembers");
  const pendingMembers = document.getElementById("pendingMembers");
  const approvedMembers = document.getElementById("approvedMembers");
  const rejectedMembers = document.getElementById("rejectedMembers");

  const loadMembersBtn =
    document.getElementById("loadMembersBtn");

  const memberSearch =
    document.getElementById("memberSearch");

  const memberStatus =
    document.getElementById("memberStatus");

  const membersTableBody =
    document.getElementById("membersTableBody");

  const membersMessage =
    document.getElementById("membersMessage");


  let allMembers = [];


  function showMessage(text, error = false) {

    if (!loginMessage) return;

    loginMessage.textContent = text;

    loginMessage.style.color =
      error ? "#b91c1c" : "#15803d";
  }


  function showDashboard(email) {

    if (loginCard) {
      loginCard.classList.add("hidden");
    }

    if (dashboard) {
      dashboard.classList.remove("hidden");
    }

    if (userEmail) {
      userEmail.textContent = email || "";
    }
  }


  function showLogin() {

    if (loginCard) {
      loginCard.classList.remove("hidden");
    }

    if (dashboard) {
      dashboard.classList.add("hidden");
    }
  }


  async function getUserProfile(userId) {

    const { data, error } =
      await supabaseClient
        .from("user_profiles")
        .select("id, full_name, role")
        .eq("id", userId)
        .single();

    if (error) {
      throw error;
    }

    return data;
  }


  async function
