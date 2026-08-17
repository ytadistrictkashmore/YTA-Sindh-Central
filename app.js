document.addEventListener("DOMContentLoaded", async () => {

  // ==============================
  // Supabase
  // ==============================

  const supabaseClient = window.supabase.createClient(
    window.YTA_CONFIG.supabaseUrl,
    window.YTA_CONFIG.supabaseAnonKey
  );


  // ==============================
  // Elements
  // ==============================

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


  // ==============================
  // Messages
  // ==============================

  function showMessage(text, error = false) {

    if (!loginMessage) return;

    loginMessage.textContent = text;

    loginMessage.style.color =
      error ? "#b91c1c" : "#15803d";
  }


  function showMembersMessage(text, error = false) {

    if (!membersMessage) return;

    membersMessage.textContent = text;

    membersMessage.style.color =
      error ? "#b91c1c" : "#15803d";
  }


  // ==============================
  // Dashboard
  // ==============================

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


  // ==============================
  // User Profile / Role
  // ==============================

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


  // ==============================
  // Dashboard Statistics
  // ==============================

  async function loadStats() {

    try {

      const totalResult =
        await supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          });

      const pendingResult =
        await supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq("status", "Under Review");

      const approvedResult =
        await supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq("status", "Approved");

      const rejectedResult =
        await supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq("status", "Rejected");


      if (totalResult.error) {
        console.error(totalResult.error);
      }

      if (pendingResult.error) {
        console.error(pendingResult.error);
      }

      if (approvedResult.error) {
        console.error(approvedResult.error);
      }

      if (rejectedResult.error) {
        console.error(rejectedResult.error);
      }


      if (totalMembers) {
        totalMembers.textContent =
          totalResult.count ?? 0;
      }

      if (pendingMembers) {
        pendingMembers.textContent =
          pendingResult.count ?? 0;
      }

      if (approvedMembers) {
        approvedMembers.textContent =
          approvedResult.count ?? 0;
      }

      if (rejectedMembers) {
        rejectedMembers.textContent =
          rejectedResult.count ?? 0;
      }

    } catch (error) {

      console.error(
        "Statistics error:",
        error
      );

    }
  }


  // ==============================
  // Security
  // ==============================

  function escapeHTML(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  // ==============================
  // Status Style
  // ==============================

  function getStatusClass(status) {

    if (status === "Approved") {
      return "status-approved";
    }

    if (status === "Rejected") {
      return "status-rejected";
    }

    return "status-pending";
  }


  // ==============================
  // Render Members
  // ==============================

  function renderMembers(members) {

    if (!membersTableBody) {
      return;
    }


    membersTableBody.innerHTML = "";


    if (!members.length) {

      membersTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center;">
            No members found.
          </td>
        </tr>
      `;

      return;
    }


    members.forEach(member => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          ${escapeHTML(member.registration_no)}
        </td>

        <td>
          ${escapeHTML(member.full_name)}
        </td>

        <td>
          ${escapeHTML(member.father_name)}
        </td>

        <td>
          ${escapeHTML(member.cnic)}
        </td>

        <td>
          ${escapeHTML(member.mobile)}
        </td>

        <td>
          ${escapeHTML(member.district_id)}
        </td>

        <td>
          ${escapeHTML(member.taluka_id)}
        </td>

        <td>
          ${escapeHTML(member.school_name)}
        </td>

        <td>
          <span class="${getStatusClass(member.status)}">
            ${escapeHTML(
              member.status || "Under Review"
            )}
          </span>
        </td>

        <td>

          <div class="member-action">

            <button
              class="view-btn"
              data-action="view"
              data-id="${member.id}">
              View
            </button>

            <button
              class="approve-btn"
              data-action="approve"
              data-id="${member.id}">
              Approve
            </button>

            <button
              class="reject-btn"
              data-action="reject"
              data-id="${member.id}">
              Reject
            </button>

          </div>

        </td>
      `;


      membersTableBody.appendChild(row);

    });

  }


  // ==============================
  // Load Members
  // ==============================

  async function loadMembers() {

    if (!membersTableBody) {
      return;
    }


    showMembersMessage(
      "Members loading..."
    );


    const { data, error } =
      await supabaseClient
        .from("members")
        .select(`
          id,
          registration_no,
          full_name,
          father_name,
          cnic,
          mobile,
          division_id,
          district_id,
          taluka_id,
          school_name,
          semis_code,
          designation,
          bps,
          joining_date,
          address,
          photo_url,
          status,
          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "Members error:",
        error
      );

      showMembersMessage(
        "Members load nahi ho sake: " +
        error.message,
        true
      );

      return;
    }


    allMembers = data || [];


    showMembersMessage(
      `${allMembers.length} members loaded.`
    );


    renderMembers(allMembers);

  }


  // ==============================
  // Search / Filter
  // ==============================

  function filterMembers() {

    const search =
      (
        memberSearch?.value || ""
      )
        .toLowerCase()
        .trim();


    const selectedStatus =
      memberStatus?.value || "";


    const filtered =
      allMembers.filter(member => {


        const searchableText = [

          member.registration_no,

          member.full_name,

          member.father_name,

          member.cnic,

          member.mobile,

          member.school_name,

          member.semis_code,

          member.designation

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        const searchMatch =
          !search ||
          searchableText.includes(search);


        const statusMatch =
          !selectedStatus ||
          member.status === selectedStatus;


        return (
          searchMatch &&
          statusMatch
        );

      });


    renderMembers(filtered);

  }


  // ==============================
  // Update Member Status
  // ==============================

  async function updateMemberStatus(
    memberId,
    newStatus
  ) {

    const { error } =
      await supabaseClient
        .from("members")
        .update({
          status: newStatus,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          memberId
        );


    if (error) {

      console.error(
        "Status update error:",
        error
      );

      alert(
        "Status update nahi ho saka.\n\n" +
        error.message
      );

      return;
    }


    await loadMembers();

    await loadStats();

  }


  // ==============================
  // View Member
  // ==============================

  function viewMember(memberId) {

    const member =
      allMembers.find(
        item => item.id === memberId
      );


    if (!member) {
      return;
    }


    alert(

      "Registration: " +
      (member.registration_no || "") +

      "\n\nName: " +
      (member.full_name || "") +

      "\n\nFather Name: " +
      (member.father_name || "") +

      "\n\nCNIC: " +
      (member.cnic || "") +

      "\n\nMobile: " +
      (member.mobile || "") +

      "\n\nSchool: " +
      (member.school_name || "") +

      "\n\nSEMIS Code: " +
      (member.semis_code || "") +

      "\n\nDesignation: " +
      (member.designation || "") +

      "\n\nBPS: " +
      (member.bps || "") +

      "\n\nJoining Date: " +
      (member.joining_date || "") +

      "\n\nAddress: " +
      (member.address || "") +

      "\n\nStatus: " +
      (member.status || "")

    );

  }


  // ==============================
  // Members Buttons
  // ==============================

  if (loadMembersBtn) {

    loadMembersBtn.addEventListener(
      "click",
      loadMembers
    );

  }


  if (memberSearch) {

    memberSearch.addEventListener(
      "input",
      filterMembers
    );

  }


  if (memberStatus) {

    memberStatus.addEventListener(
      "change",
      filterMembers
    );

  }


  if (membersTableBody) {

    membersTableBody.addEventListener(
      "click",
      async event => {


        const button =
          event.target.closest(
            "button[data-action]"
          );


        if (!button) {
          return;
        }


        const memberId =
          button.dataset.id;


        const action =
          button.dataset.action;


        if (action === "view") {

          viewMember(memberId);

          return;
        }


        if (action === "approve") {

          const confirmed =
            confirm(
              "Kya aap is member ko Approve karna chahte hain?"
            );


          if (!confirmed) {
            return;
          }


          await updateMemberStatus(
            memberId,
            "Approved"
          );

          return;
        }


        if (action === "reject") {

          const confirmed =
            confirm(
              "Kya aap is member ko Reject karna chahte hain?"
            );


          if (!confirmed) {
            return;
          }


          await updateMemberStatus(
            memberId,
            "Rejected"
          );

        }

      }
    );

  }


  // ==============================
  // Login
  // ==============================

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          document
            .getElementById("email")
            ?.value
            .trim();


        const password =
          document
            .getElementById("password")
            ?.value;


        if (!email || !password) {

          showMessage(
            "Email aur password darj karein.",
            true
          );

          return;
        }


        showMessage(
          "Login ho raha hai..."
        );


        const { data, error } =
          await supabaseClient.auth
            .signInWithPassword({

              email: email,

              password: password

            });


        if (error) {

          showMessage(
            error.message,
            true
          );

          return;
        }


        try {

          const profile =
            await getUserProfile(
              data.user.id
            );


          if (
            !profile ||
            profile.role !==
              "central_owner"
          ) {

            await supabaseClient.auth
              .signOut();


            showMessage(
              "Access denied. Central Owner account required.",
              true
            );

            return;
          }


          showDashboard(
            data.user.email
          );


          showMessage(
            "Login successful."
          );


          await loadStats();


        } catch (error) {

          console.error(
            "Role verification:",
            error
          );


          await supabaseClient.auth
            .signOut();


          showMessage(
            "User role verify nahi ho saka.",
            true
          );

        }

      }
    );

  }


  // ==============================
  // Logout
  // ==============================

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async () => {

        await supabaseClient.auth
          .signOut();


        showLogin();


        showMessage(
          "Logout successful."
        );

      }
    );

  }


  // ==============================
  // Existing Session
  // ==============================

  try {

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();


    if (sessionError) {

      console.error(
        sessionError
      );

      return;
    }


    const session =
      sessionData?.session;


    if (!session) {

      showLogin();

      return;
    }


    const profile =
      await getUserProfile(
        session.user.id
      );


    if (
      profile &&
      profile.role ===
        "central_owner"
    ) {

      showDashboard(
        session.user.email
      );


      await loadStats();

    } else {

      await supabaseClient.auth
        .signOut();


      showLogin();

    }

  } catch (error) {

    console.error(
      "Session error:",
      error
    );

    await supabaseClient.auth
      .signOut();

    showLogin();

  }

});
