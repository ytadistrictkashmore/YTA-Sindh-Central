// YTA Sindh Central Secretariat
// Main application

const { createClient } = window.supabase;

const supabaseClient = createClient(
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


// ----------------------------------------------------
// Load Supabase library
// ----------------------------------------------------

function loadSupabaseScript() {
  return new Promise((resolve, reject) => {

    if (window.supabase) {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = resolve;

    script.onerror = () => {
      reject(new Error("Supabase library could not be loaded."));
    };

    document.head.appendChild(script);
  });
}


// ----------------------------------------------------
// Show login message
// ----------------------------------------------------

function showMessage(message, isError = false) {

  loginMessage.textContent = message;

  loginMessage.style.color =
    isError ? "#b91c1c" : "#15803d";
}


// ----------------------------------------------------
// Show dashboard
// ----------------------------------------------------

function showDashboard(email) {

  loginCard.classList.add("hidden");

  dashboard.classList.remove("hidden");

  userEmail.textContent = email;
}


// ----------------------------------------------------
// Show login
// ----------------------------------------------------

function showLogin() {

  loginCard.classList.remove("hidden");

  dashboard.classList.add("hidden");

  userEmail.textContent = "";
}


// ----------------------------------------------------
// Get current user role
// ----------------------------------------------------

async function getUserRole(userId) {

  const { data, error } = await supabaseClient
    .from("user_profiles")
    .select("role, full_name")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}


// ----------------------------------------------------
// Load dashboard statistics
// ----------------------------------------------------

async function loadDashboardStats() {

  try {

    const { count: total, error: totalError } =
      await supabaseClient
        .from("members")
        .select("*", {
          count: "exact",
          head: true
        });

    if (totalError) throw totalError;


    const { count: pending, error: pendingError } =
      await supabaseClient
        .from("members")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("status", "Under Review");

    if (pendingError) throw pendingError;


    const { count: approved, error: approvedError } =
      await supabaseClient
        .from("members")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("status", "Approved");

    if (approvedError) throw approvedError;


    const { count: rejected, error: rejectedError } =
      await supabaseClient
        .from("members")
        .select("*", {
          count: "exact",
          head: true
       
