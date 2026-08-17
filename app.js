document.addEventListener("DOMContentLoaded", async () => {

  // Wait for Supabase library
  if (!window.supabase) {
    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = () => startApp();
    script.onerror = () => {
      alert("Supabase library load nahi ho saki.");
    };

    document.head.appendChild(script);

    return;
  }

  startApp();


  async function startApp() {

    const supabaseClient = window.supabase.createClient(
      window.YTA_CONFIG.supabaseUrl,
      window.YTA_CONFIG.supabaseAnonKey
    );


    const loginForm =
      document.getElementById("loginForm");

    const loginMessage =
      document.getElementById("loginMessage");

    const dashboard =
      document.getElementById("dashboard");

    const loginCard =
      document.querySelector(".login-card");

    const logoutBtn =
      document.getElementById("logoutBtn");

    const userEmail =
      document.getElementById("userEmail");

    const totalMembers =
      document.getElementById("totalMembers");

    const pendingMembers =
      document.getElementById("pendingMembers");

    const approvedMembers =
      document.getElementById("approvedMembers");

    const rejectedMembers =
      document.getElementById("rejectedMembers");


    function message(text, error = false) {

      loginMessage.textContent = text;

      loginMessage.style.color =
        error ? "#b91c1c" : "#15803d";
    }


    function showDashboard(email) {

      loginCard.classList.add("hidden");

      dashboard.classList.remove("hidden");

      userEmail.textContent = email;
    }


    function showLogin() {

      loginCard.classList.remove("hidden");

      dashboard.classList.add("hidden");

      userEmail.textContent = "";
    }


    async function getRole(userId) {

      const { data, error } =
        await supabaseClient
          .from("user_profiles")
          .select("role, full_name")
          .eq("id", userId)
          .single();

      if (error) {
        throw error;
      }

      return data;
    }


    async function loadStats() {

      const total =
        await supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          });

      const pending =
        await supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq("status", "Under Review");

      const approved =
        await supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq("status", "Approved");

      const rejected =
        await supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq("status", "Rejected");


      totalMembers.textContent =
        total.count ?? 0;

      pendingMembers.textContent =
        pending.count ?? 0;

      approvedMembers.textContent =
        approved.count ?? 0;

      rejectedMembers.textContent =
        rejected.count ?? 0;
    }


    loginForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const email =
          document.getElementById("email")
            .value.trim();

        const password =
          document.getElementById("password")
            .value;


        if (!email || !password) {

          message(
            "Email aur password darj karein.",
            true
          );

          return;
        }


        message("Login ho raha hai...");


        const { data, error } =
          await supabaseClient.auth
            .signInWithPassword({
              email,
              password
            });


        if (error) {

          message(
            error.message,
            true
          );

          return;
        }


        try {

          const profile =
            await getRole(data.user.id);


          if (
            !profile ||
            profile.role !== "central_owner"
          ) {

            await supabaseClient.auth.signOut();

            message(
              "Access denied. Ye Central Owner account nahi hai.",
              true
            );

            return;
          }


          showDashboard(
            data.user.email
          );

          await loadStats();

        }

        catch (err) {

          console.error(err);

          await supabaseClient.auth.signOut();

          message(
            "User role verify nahi ho saka.",
            true
          );
        }

      }
    );


    logoutBtn.addEventListener(
      "click",
      async () => {

        await supabaseClient.auth.signOut();

        showLogin();

        message(
          "Logout successful."
        );
      }
    );


    // Check existing login
    const {
      data: sessionData
    } = await supabaseClient.auth
      .getSession();


    if (
      sessionData &&
      sessionData.session
    ) {

      try {

        const profile =
          await getRole(
            sessionData.session.user.id
          );


        if (
          profile &&
          profile.role === "central_owner"
        ) {

          showDashboard(
            sessionData.session.user.email
          );

          await loadStats();

        }

        else {

          await supabaseClient.auth.signOut();

          showLogin();
        }

      }

      catch (error) {

        console.error(error);

        await supabaseClient.auth.signOut();

        showLogin();
      }
    }

  }

});
