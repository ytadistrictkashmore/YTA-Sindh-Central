document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================
     SUPABASE
  ========================================= */

  const supabaseClient = window.supabase.createClient(
    window.YTA_CONFIG.supabaseUrl,
    window.YTA_CONFIG.supabaseAnonKey
  );


  /* =========================================
     ELEMENT HELPER
  ========================================= */

  const $ = (id) => document.getElementById(id);


  const loginForm = $("loginForm");
  const loginMessage = $("loginMessage");

  const dashboard = $("dashboard");
  const loginCard = document.querySelector(".login-card");

  const logoutBtn = $("logoutBtn");
  const userEmail = $("userEmail");

  const totalMembers = $("totalMembers");
  const pendingMembers = $("pendingMembers");
  const approvedMembers = $("approvedMembers");
  const rejectedMembers = $("rejectedMembers");

  const loadMembersBtn = $("loadMembersBtn");
  const memberSearch = $("memberSearch");
  const memberStatus = $("memberStatus");
  const membersTableBody = $("membersTableBody");
  const membersMessage = $("membersMessage");


  let allMembers = [];


  /* =========================================
     BASIC HELPERS
  ========================================= */

  function message(text, error = false) {

    if (!loginMessage) return;

    loginMessage.textContent = text;

    loginMessage.style.color =
      error ? "#b91c1c" : "#15803d";
  }


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

    if (userEmail) {
      userEmail.textContent = "";
    }
  }


  /* =========================================
     USER PROFILE
  ========================================= */

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


  /* =========================================
     STATISTICS
  ========================================= */

  async function loadStats() {

    try {

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


      if (totalMembers) {
        totalMembers.textContent =
          total.count ?? 0;
      }


      if (pendingMembers) {
        pendingMembers.textContent =
          pending.count ?? 0;
      }


      if (approvedMembers) {
        approvedMembers.textContent =
          approved.count ?? 0;
      }


      if (rejectedMembers) {
        rejectedMembers.textContent =
          rejected.count ?? 0;
      }

    } catch (error) {

      console.error(
        "Statistics error:",
        error
      );

    }
  }


  /* =========================================
     MEMBERS
  ========================================= */

  function renderMembers(members) {

    if (!membersTableBody) return;

    membersTableBody.innerHTML = "";


    if (!members.length) {

      membersTableBody.innerHTML = `
        <tr>
          <td
            colspan="10"
            style="text-align:center;padding:25px;"
          >
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
          ${escapeHTML(
            member.registration_no
          )}
        </td>

        <td>
          ${escapeHTML(
            member.full_name
          )}
        </td>

        <td>
          ${escapeHTML(
            member.father_name
          )}
        </td>

        <td>
          ${escapeHTML(
            member.cnic
          )}
        </td>

        <td>
          ${escapeHTML(
            member.mobile
          )}
        </td>

        <td>
          ${escapeHTML(
            member.district_id
          )}
        </td>

        <td>
          ${escapeHTML(
            member.taluka_id
          )}
        </td>

        <td>
          ${escapeHTML(
            member.school_name
          )}
        </td>

        <td>
          ${escapeHTML(
            member.status
          )}
        </td>

        <td>

          <button
            class="view-btn"
            data-member-view="${member.id}">
            View
          </button>

          <button
            class="approve-btn"
            data-member-approve="${member.id}">
            Approve
          </button>

          <button
            class="reject-btn"
            data-member-reject="${member.id}">
            Reject
          </button>

        </td>
      `;


      membersTableBody.appendChild(row);

    });

  }


  async function loadMembers() {

    if (membersMessage) {
      membersMessage.textContent =
        "Loading members...";
    }


    const {
      data,
      error
    } =
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

      if (membersMessage) {
        membersMessage.textContent =
          error.message;
      }

      return;
    }


    allMembers = data || [];


    if (membersMessage) {

      membersMessage.textContent =
        `${allMembers.length} members loaded.`;
    }


    if (membersTableBody) {

      renderMembers(allMembers);

    }

  }


  function filterMembers() {

    const search =
      (
        memberSearch?.value ||
        ""
      )
        .toLowerCase()
        .trim();


    const status =
      memberStatus?.value ||
      "";


    const result =
      allMembers.filter(member => {

        const text = [

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


        return (

          (!search ||
            text.includes(search))

          &&

          (!status ||
            member.status === status)

        );

      });


    renderMembers(result);

  }


  async function changeMemberStatus(
    id,
    status
  ) {

    const {
      error
    } =
      await supabaseClient
        .from("members")
        .update({

          status: status,

          updated_at:
            new Date().toISOString()

        })
        .eq("id", id);


    if (error) {

      alert(error.message);

      return;
    }


    await loadMembers();

    await loadStats();

  }


  /* =========================================
     MEMBER EVENTS
  ========================================= */

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

        const approve =
          event.target.closest(
            "[data-member-approve]"
          );


        const reject =
          event.target.closest(
            "[data-member-reject]"
          );


        const view =
          event.target.closest(
            "[data-member-view]"
          );


        if (approve) {

          if (
            confirm(
              "Approve this member?"
            )
          ) {

            await changeMemberStatus(
              approve.dataset.memberApprove,
              "Approved"
            );

          }

          return;
        }


        if (reject) {

          if (
            confirm(
              "Reject this member?"
            )
          ) {

            await changeMemberStatus(
              reject.dataset.memberReject,
              "Rejected"
            );

          }

          return;
        }


        if (view) {

          const member =
            allMembers.find(
              item =>
                item.id ===
                view.dataset.memberView
            );


          if (member) {

            openDetails(
              "Member Details",
              member
            );

          }

        }

      }
    );

  }


  /* =========================================
     DETAILS MODAL
  ========================================= */

  function openDetails(
    title,
    data
  ) {

    const oldModal =
      document.getElementById(
        "ytaUniversalModal"
      );


    if (oldModal) {
      oldModal.remove();
    }


    const modal =
      document.createElement("div");


    modal.id =
      "ytaUniversalModal";


    modal.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.55);
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    `;


    let rows = "";


    Object.entries(data || {})
      .forEach(
        ([key, value]) => {

          if (
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {

            rows += `

              <tr>

                <th
                  style="
                    text-align:left;
                    padding:10px;
                    border-bottom:1px solid #ddd;
                  "
                >
                  ${escapeHTML(
                    key.replaceAll(
                      "_",
                      " "
                    )
                  )}
                </th>

                <td
                  style="
                    padding:10px;
                    border-bottom:1px solid #ddd;
                  "
                >
                  ${escapeHTML(
                    value
                  )}
                </td>

              </tr>

            `;

          }

        }
      );


    modal.innerHTML = `

      <div
        style="
          background:white;
          width:min(900px,100%);
          max-height:90vh;
          overflow:auto;
          border-radius:14px;
          padding:25px;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:20px;
          "
        >

          <h2>
            ${escapeHTML(title)}
          </h2>

          <button
            id="ytaCloseModal"
          >
            Close
          </button>

        </div>


        <table
          style="
            width:100%;
            border-collapse:collapse;
          "
        >

          ${rows}

        </table>

      </div>

    `;


    document.body.appendChild(
      modal
    );


    document
      .getElementById(
        "ytaCloseModal"
      )
      .onclick = () =>
        modal.remove();

  }


  /* =========================================
     GENERIC TABLE
  ========================================= */

  async function openTable(
    tableName,
    title,
    columns
  ) {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(tableName)
        .select("*");


    if (error) {

      alert(
        `${title}\n\n${error.message}`
      );

      return;
    }


    const oldModal =
      document.getElementById(
        "ytaUniversalModal"
      );


    if (oldModal) {
      oldModal.remove();
    }


    const modal =
      document.createElement("div");


    modal.id =
      "ytaUniversalModal";


    modal.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.55);
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    `;


    let headers = "";


    columns.forEach(
      column => {

        headers += `

          <th
            style="
              padding:10px;
              text-align:left;
              background:#f1f5f9;
            "
          >
            ${escapeHTML(
              column.label
            )}
          </th>

        `;

      }
    );


    let body = "";


    (data || []).forEach(
      row => {

        body += "<tr>";


        columns.forEach(
          column => {

            body += `

              <td
                style="
                  padding:10px;
                  border-bottom:1px solid #ddd;
                "
              >
                ${escapeHTML(
                  row[column.key]
                )}
              </td>

            `;

          }
        );


        body += "</tr>";

      }
    );


    if (
      !data ||
      !data.length
    ) {

      body = `

        <tr>

          <td
            colspan="${columns.length}"
            style="
              padding:30px;
              text-align:center;
              color:#64748b;
            "
          >
            No records found.
          </td>

        </tr>

      `;

    }


    modal.innerHTML = `

      <div
        style="
          background:white;
          width:min(1100px,100%);
          max-height:90vh;
          overflow:auto;
          border-radius:14px;
          padding:25px;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:20px;
          "
        >

          <h2>
            ${escapeHTML(title)}
          </h2>


          <button
            id="ytaCloseModal"
          >
            Close
          </button>

        </div>


        <div
          style="
            overflow-x:auto;
          "
        >

          <table
            style="
              width:100%;
              border-collapse:collapse;
              min-width:700px;
            "
          >

            <thead>

              <tr>
                ${headers}
              </tr>

            </thead>


            <tbody>
              ${body}
            </tbody>

          </table>

        </div>

      </div>

    `;


    document.body.appendChild(
      modal
    );


    document
      .getElementById(
        "ytaCloseModal"
      )
      .onclick = () =>
        modal.remove();

  }


  /* =========================================
     CENTRAL
  ========================================= */

  async function openCentral() {

    await openTable(
      "organization_settings",
      "Central Organization",
      [

        {
          key:
            "organization_name",
          label:
            "Organization Name"
        },

        {
          key:
            "organization_short_name",
          label:
            "Short Name"
        },

        {
          key:
            "updated_at",
          label:
            "Updated"
        }

      ]
    );

  }


  /* =========================================
     DIVISIONS
  ========================================= */

  async function openDivisions() {

    await openTable(
      "divisions",
      "Divisions",
      [

        {
          key:"name",
          label:"Division Name"
        },

        {
          key:"created_at",
          label:"Created"
        }

      ]
    );

  }


  /* =========================================
     DISTRICTS
  ========================================= */

  async function openDistricts() {

    await openTable(
      "districts",
      "Districts",
      [

        {
          key:"name",
          label:"District Name"
        },

        {
          key:"division_id",
          label:"Division ID"
        },

        {
          key:"created_at",
          label:"Created"
        }

      ]
    );

  }


  /* =========================================
     TALUKAS
  ========================================= */

  async function openTalukas() {

    await openTable(
      "talukas",
      "Talukas",
      [

        {
          key:"name",
          label:"Taluka Name"
        },

        {
          key:"district_id",
          label:"District ID"
        },

        {
          key:"created_at",
          label:"Created"
        }

      ]
    );

  }


  /* =========================================
     DISTRICT ADMINS
  ========================================= */

  async function openAdmins() {

    await openTable(
      "district_admins",
      "District Admins",
      [

        {
          key:"user_id",
          label:"User ID"
        },

        {
          key:"district_id",
          label:"District ID"
        },

        {
          key:"is_active",
          label:"Active"
        },

        {
          key:"created_at",
          label:"Created"
        }

      ]
    );

  }


  /* =========================================
     DYNAMIC POSITIONS
  ========================================= */

  async function openPositions() {

    await openTable(
      "dynamic_positions",
      "Dynamic Positions",
      [

        {
          key:
            "position_name",
          label:
            "Position"
        },

        {
          key:
            "level",
          label:
            "Level"
        },

        {
          key:
            "is_active",
          label:
            "Active"
        },

        {
          key:
            "created_at",
          label:
            "Created"
        }

      ]
    );

  }


  /* =========================================
     OFFICE BEARERS
  ========================================= */

  async function openOfficeBearers() {

    await openTable(
      "dynamic_office_bearers",
      "Dynamic Office Bearers",
      [

        {
          key:"name",
          label:"Name"
        },

        {
          key:"father_name",
          label:"Father Name"
        },

        {
          key:"designation",
          label:"Designation"
        },

        {
          key:"bps",
          label:"BPS"
        },

        {
          key:"mobile",
          label:"Mobile"
        },

        {
          key:"is_active",
          label:"Active"
        },

        {
          key:"created_at",
          label:"Created"
        }

      ]
    );

  }


  /* =========================================
     MEMBERS OPEN
  ========================================= */

  async function openMembers() {

    await openTable(
      "members",
      "Members Management",
      [

        {
          key:
            "registration_no",
          label:
            "Registration"
        },

        {
          key:
            "full_name",
          label:
            "Name"
        },

        {
          key:
            "father_name",
          label:
            "Father Name"
        },

        {
          key:
            "cnic",
          label:
            "CNIC"
        },

        {
          key:
            "mobile",
          label:
            "Mobile"
        },

        {
          key:
            "division_id",
          label:
            "Division ID"
        },

        {
          key:
            "district_id",
          label:
            "District ID"
        },

        {
          key:
            "taluka_id",
          label:
            "Taluka ID"
        },

        {
          key:
            "school_name",
          label:
            "School"
        },

        {
          key:
            "status",
          label:
            "Status"
        }

      ]
    );

  }


  /* =========================================
     OPEN BUTTON HANDLER
  ========================================= */

  document.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "button"
        );


      if (!button) return;


      const text =
        button.textContent
          .trim()
          .toLowerCase();


      if (text !== "open") {
        return;
      }


      const parent =
        button.closest(
          ".nav-card, .card, .dashboard-card, .option-card"
        );


      const area =
        (
          parent?.innerText ||
          button.parentElement?.innerText ||
          ""
        ).toLowerCase();


      try {

        if (
          area.includes("central")
        ) {

          await openCentral();

        }

        else if (
          area.includes("division")
        ) {

          await openDivisions();

        }

        else if (
          area.includes("district")
        ) {

          await openDistricts();

        }

        else if (
          area.includes("taluka")
        ) {

          await openTalukas();

        }

        else if (
          area.includes("office bearer")
        ) {

          await openOfficeBearers();

        }

        else if (
          area.includes("position")
        ) {

          await openPositions();

        }

        else if (
          area.includes("admin")
        ) {

          await openAdmins();

        }

        else if (
          area.includes("member")
        ) {

          await openMembers();

        }

      }

      catch (error) {

        console.error(
          "Open button error:",
          error
        );

        alert(
          error.message ||
          "Unable to open this section."
        );

      }

    }
  );


  /* =========================================
     LOGIN
  ========================================= */

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          $("email")?.value.trim();


        const password =
          $("password")?.value;


        if (
          !email ||
          !password
        ) {

          message(
            "Email aur password darj karein.",
            true
          );

          return;
        }


        message(
          "Login ho raha hai..."
        );


        const {
          data,
          error
        } =
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


            message(
              "Central Owner access required.",
              true
            );

            return;
          }


          showDashboard(
            data.user.email
          );


          message(
            "Login successful."
          );


          await loadStats();

        }

        catch (error) {

          console.error(
            "Role verification:",
            error
          );


          await supabaseClient.auth
            .signOut();


          message(
            "User role verify nahi ho saka.",
            true
          );

        }

      }
    );

  }


  /* =========================================
     LOGOUT
  ========================================= */

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async () => {

        await supabaseClient.auth
          .signOut();

        showLogin();

      }
    );

  }


  /* =========================================
     EXISTING SESSION
  ========================================= */

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {
      throw error;
    }


    if (
      data &&
      data.session
    ) {

      const profile =
        await getUserProfile(
          data.session.user.id
        );


      if (
        profile &&
        profile.role ===
          "central_owner"
      ) {

        showDashboard(
          data.session.user.email
        );


        await loadStats();

      }

      else {

        await supabaseClient.auth
          .signOut();

        showLogin();

      }

    }

    else {

      showLogin();

    }

  }

  catch (error) {

    console.error(
      "Session error:",
      error
    );

    showLogin();

  }

});
