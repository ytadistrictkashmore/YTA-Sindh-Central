document.addEventListener("DOMContentLoaded", async () => {

  /* =====================================================
     SUPABASE
  ===================================================== */

  const supabaseClient = window.supabase.createClient(
    window.YTA_CONFIG.supabaseUrl,
    window.YTA_CONFIG.supabaseAnonKey
  );

  const $ = (id) => document.getElementById(id);


  /* =====================================================
     ELEMENTS
  ===================================================== */

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
  const membersSection = document.querySelector(".members-section");


  /* =====================================================
     GLOBAL DATA
  ===================================================== */

  let allMembers = [];

  let divisionsMap = {};
  let districtsMap = {};
  let talukasMap = {};

  let currentUser = null;
  let currentProfile = null;

  let currentRole = null;
  let currentDistrictId = null;


  /* =====================================================
     MESSAGE
  ===================================================== */

  function message(text, error = false) {

    if (!loginMessage) {
      return;
    }

    loginMessage.textContent = text;

    loginMessage.style.color =
      error ? "#b91c1c" : "#15803d";
  }


  /* =====================================================
     ESCAPE HTML
  ===================================================== */

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


  /* =====================================================
     DASHBOARD
  ===================================================== */

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


  /* =====================================================
     LOAD DIVISION / DISTRICT / TALUKA MAPS
  ===================================================== */

  async function loadLocationMaps() {

    try {

      const [
        divisionsResult,
        districtsResult,
        talukasResult
      ] = await Promise.all([

        supabaseClient
          .from("divisions")
          .select("id,name"),

        supabaseClient
          .from("districts")
          .select("id,name,division_id"),

        supabaseClient
          .from("talukas")
          .select("id,name,district_id")

      ]);


      if (divisionsResult.error) {

        console.error(
          "Divisions Error:",
          divisionsResult.error
        );

      }


      if (districtsResult.error) {

        console.error(
          "Districts Error:",
          districtsResult.error
        );

      }


      if (talukasResult.error) {

        console.error(
          "Talukas Error:",
          talukasResult.error
        );

      }


      divisionsMap = {};

      (divisionsResult.data || []).forEach(
        item => {

          divisionsMap[item.id] =
            item.name;

        }
      );


      districtsMap = {};

      (districtsResult.data || []).forEach(
        item => {

          districtsMap[item.id] =
            item.name;

        }
      );


      talukasMap = {};

      (talukasResult.data || []).forEach(
        item => {

          talukasMap[item.id] =
            item.name;

        }
      );


    } catch (error) {

      console.error(
        "Location Maps Error:",
        error
      );

    }

  }


  /* =====================================================
     LOCATION NAME HELPERS
  ===================================================== */

  function divisionName(id) {

    if (!id) {
      return "";
    }

    return divisionsMap[id] || id;
  }


  function districtName(id) {

    if (!id) {
      return "";
    }

    return districtsMap[id] || id;
  }


  function talukaName(id) {

    if (!id) {
      return "";
    }

    return talukasMap[id] || id;
  }


  /* =====================================================
     USER PROFILE
  ===================================================== */

  async function getUserProfile(userId) {

    const {
      data,
      error
    } = await supabaseClient
      .from("user_profiles")
      .select(
        "id,full_name,role"
      )
      .eq(
        "id",
        userId
      )
      .single();


    if (error) {
      throw error;
    }


    return data;
  }


  /* =====================================================
     DISTRICT ADMIN ACCESS
  ===================================================== */

  async function getDistrictAdmin(userId) {

    const {
      data,
      error
    } = await supabaseClient
      .from("district_admins")
      .select(
        "id,user_id,district_id,is_active"
      )
      .eq(
        "user_id",
        userId
      )
      .eq(
        "is_active",
        true
      )
      .maybeSingle();


    if (error) {

      console.error(
        "District Admin Error:",
        error
      );

      return null;
    }


    return data;
  }


  /* =====================================================
     SET USER ACCESS
  ===================================================== */

  async function setupUserAccess(userId) {

    currentUser = userId;

    currentProfile =
      await getUserProfile(userId);


    if (!currentProfile) {

      throw new Error(
        "User profile not found."
      );

    }


    currentRole =
      currentProfile.role;


    currentDistrictId = null;


    /* ===============================================
       CENTRAL OWNER
    =============================================== */

    if (
      currentRole ===
      "central_owner"
    ) {

      return true;

    }


    /* ===============================================
       DISTRICT ADMIN
    =============================================== */

    if (
      currentRole ===
      "district_admin"
    ) {

      const districtAdmin =
        await getDistrictAdmin(
          userId
        );


      if (
        !districtAdmin ||
        !districtAdmin.district_id
      ) {

        throw new Error(
          "District Admin ka District assign nahi hai."
        );

      }


      currentDistrictId =
        districtAdmin.district_id;


      return true;

    }


    throw new Error(
      "Aapko dashboard access nahi hai."
    );

  }


  /* =====================================================
     ACCESS INFORMATION
  ===================================================== */

  function isCentralOwner() {

    return (
      currentRole ===
      "central_owner"
    );

  }


  function isDistrictAdmin() {

    return (
      currentRole ===
      "district_admin"
    );

  }


  /* =====================================================
     STATISTICS
  ===================================================== */

  async function loadStats() {

    try {

      let totalQuery =
        supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          });


      let pendingQuery =
        supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq(
            "status",
            "Under Review"
          );


      let approvedQuery =
        supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq(
            "status",
            "Approved"
          );


      let rejectedQuery =
        supabaseClient
          .from("members")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq(
            "status",
            "Rejected"
          );


      /*
        District Admin ko sirf
        apne District ka data.
      */

      if (
        isDistrictAdmin() &&
        currentDistrictId
      ) {

        totalQuery =
          totalQuery.eq(
            "district_id",
            currentDistrictId
          );


        pendingQuery =
          pendingQuery.eq(
            "district_id",
            currentDistrictId
          );


        approvedQuery =
          approvedQuery.eq(
            "district_id",
            currentDistrictId
          );


        rejectedQuery =
          rejectedQuery.eq(
            "district_id",
            currentDistrictId
          );

      }


      const [
        total,
        pending,
        approved,
        rejected
      ] = await Promise.all([

        totalQuery,
        pendingQuery,
        approvedQuery,
        rejectedQuery

      ]);


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
        "Statistics Error:",
        error
      );

    }

  }


  /* =====================================================
     RENDER MEMBERS
  ===================================================== */

  function renderMembers(members) {

    if (!membersTableBody) {
      return;
    }


    membersTableBody.innerHTML = "";


    if (!members.length) {

      membersTableBody.innerHTML = `
        <tr>
          <td
            colspan="11"
            style="
              text-align:center;
              padding:25px;
            "
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


      /*
        District Admin ko sirf
        apne district ke records.
      */

      const canManage =
        isCentralOwner() ||
        (
          isDistrictAdmin() &&
          member.district_id ===
          currentDistrictId
        );


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
            member._division_name
          )}
        </td>

        <td>
          ${escapeHTML(
            member._district_name
          )}
        </td>

        <td>
          ${escapeHTML(
            member._taluka_name
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
            data-member-view="${member.id}"
          >
            View
          </button>

          ${
            canManage
            ?
            `
              <button
                class="approve-btn"
                data-member-approve="${member.id}"
              >
                Approve
              </button>

              <button
                class="reject-btn"
                data-member-reject="${member.id}"
              >
                Reject
              </button>
            `
            :
            ""
          }

        </td>

      `;


      membersTableBody.appendChild(
        row
      );

    });

  }


  /* =====================================================
     LOAD MEMBERS
  ===================================================== */

  async function loadMembers() {

    if (!membersTableBody) {
      return;
    }


    if (membersMessage) {

      membersMessage.textContent =
        "Loading members...";

    }


    await loadLocationMaps();


    let query =
      supabaseClient
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


    /*
      IMPORTANT:
      District Admin ko sirf apna District.
    */

    if (
      isDistrictAdmin() &&
      currentDistrictId
    ) {

      query =
        query.eq(
          "district_id",
          currentDistrictId
        );

    }


    const {
      data,
      error
    } = await query;


    if (error) {

      console.error(
        "Members Error:",
        error
      );


      if (membersMessage) {

        membersMessage.textContent =
          "Error: " +
          error.message;

      }

      return;

    }


    allMembers =
      (data || []).map(
        member => ({

          ...member,

          _division_name:
            divisionName(
              member.division_id
            ),

          _district_name:
            districtName(
              member.district_id
            ),

          _taluka_name:
            talukaName(
              member.taluka_id
            )

        })
      );


    if (membersMessage) {

      membersMessage.textContent =
        `${allMembers.length} members loaded.`;

    }


    renderMembers(
      allMembers
    );

  }


  /* =====================================================
     FILTER
  ===================================================== */

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
      allMembers.filter(
        member => {

          const text = [

            member.registration_no,
            member.full_name,
            member.father_name,
            member.cnic,
            member.mobile,
            member.school_name,
            member.semis_code,
            member.designation,
            member._division_name,
            member._district_name,
            member._taluka_name

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return (

            (
              !search ||
              text.includes(search)
            )

            &&

            (
              !status ||
              member.status === status
            )

          );

        }
      );


    renderMembers(
      result
    );

  }


  /* =====================================================
     CHANGE MEMBER STATUS
  ===================================================== */

  async function changeMemberStatus(
    id,
    status
  ) {

    const member =
      allMembers.find(
        item =>
          item.id === id
      );


    if (!member) {

      alert(
        "Member not found."
      );

      return;

    }


    /*
      SECURITY CHECK
    */

    if (
      isDistrictAdmin() &&
      member.district_id !==
      currentDistrictId
    ) {

      alert(
        "Aap sirf apne District ke member ko update kar sakte hain."
      );

      return;

    }


    if (
      !isCentralOwner() &&
      !isDistrictAdmin()
    ) {

      alert(
        "Permission denied."
      );

      return;

    }


    const {
      error
    } = await supabaseClient
      .from("members")
      .update({

        status: status,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        id
      );


    if (error) {

      alert(
        "Status update failed:\n\n" +
        error.message
      );

      return;

    }


    alert(
      `Member ${status} ho gaya.`
    );


    await loadMembers();
    await loadStats();

  }


  /* =====================================================
     MEMBERS MANAGEMENT
  ===================================================== */

  async function openMembersManagement() {

    if (!membersSection) {

      alert(
        "Members Management section nahi mili."
      );

      return;

    }


    membersSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


    await loadMembers();

  }


  /* =====================================================
     MEMBER DETAILS
  ===================================================== */

  function openDetails(
    title,
    data
  ) {

    let modal =
      document.getElementById(
        "ytaUniversalModal"
      );


    if (modal) {
      modal.remove();
    }


    modal =
      document.createElement(
        "div"
      );


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


    Object.entries(
      data || {}
    ).forEach(
      ([key,value]) => {

        if (
          key.startsWith("_")
        ) {

          return;

        }


        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {

          return;

        }


        let displayValue =
          value;


        if (
          key ===
          "division_id"
        ) {

          displayValue =
            divisionName(
              value
            );

        }


        if (
          key ===
          "district_id"
        ) {

          displayValue =
            districtName(
              value
            );

        }


        if (
          key ===
          "taluka_id"
        ) {

          displayValue =
            talukaName(
              value
            );

        }


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
                displayValue
              )}
            </td>

          </tr>

        `;

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

          <button id="ytaCloseModal">
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


  /* =====================================================
     OPEN DISTRICTS
  ===================================================== */

  async function openDistricts() {

    await loadLocationMaps();


    const {
      data: districts,
      error
    } = await supabaseClient
      .from("districts")
      .select(
        "id,name,division_id"
      )
      .order(
        "name"
      );


    if (error) {

      alert(
        "Districts Error:\n\n" +
        error.message
      );

      return;

    }


    /*
      District Admin ko sirf
      assigned District dikhayen.
    */

    let visibleDistricts =
      districts || [];


    if (
      isDistrictAdmin() &&
      currentDistrictId
    ) {

      visibleDistricts =
        visibleDistricts.filter(
          district =>
            district.id ===
            currentDistrictId
        );

    }


    let modal =
      document.getElementById(
        "ytaUniversalModal"
      );


    if (modal) {
      modal.remove();
    }


    modal =
      document.createElement(
        "div"
      );


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


    visibleDistricts.forEach(
      district => {

        rows += `

          <tr>

            <td
              style="
                padding:12px;
                border-bottom:1px solid #ddd;
                font-weight:600;
              "
            >
              ${escapeHTML(
                district.name
              )}
            </td>

            <td
              style="
                padding:12px;
                border-bottom:1px solid #ddd;
              "
            >
              ${escapeHTML(
                divisionName(
                  district.division_id
                )
              )}
            </td>

            <td
              style="
                padding:12px;
                border-bottom:1px solid #ddd;
              "
            >

              <button
                class="district-members-btn"
                data-district-id="${district.id}"
                data-district-name="${escapeHTML(district.name)}"
              >
                View Members
              </button>

            </td>

          </tr>

        `;

      }
    );


    if (!visibleDistricts.length) {

      rows = `

        <tr>

          <td
            colspan="3"
            style="
              padding:25px;
              text-align:center;
            "
          >
            No districts found.
          </td>

        </tr>

      `;

    }


    modal.innerHTML = `

      <div
        style="
          background:white;
          width:min(1000px,100%);
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
            Districts
          </h2>

          <button id="ytaCloseModal">
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

                <th style="
                  padding:12px;
                  text-align:left;
                  background:#f1f5f9;
                ">
                  District Name
                </th>

                <th style="
                  padding:12px;
                  text-align:left;
                  background:#f1f5f9;
                ">
                  Division
                </th>

                <th style="
                  padding:12px;
                  text-align:left;
                  background:#f1f5f9;
                ">
                  Members
                </th>

              </tr>

            </thead>

            <tbody>
              ${rows}
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


    modal.addEventListener(
      "click",
      async event => {

        const button =
          event.target.closest(
            ".district-members-btn"
          );


        if (!button) {
          return;
        }


        await openDistrictMembers(
          button.dataset.districtId,
          button.dataset.districtName
        );

      }
    );

  }


  /* =====================================================
     DISTRICT MEMBERS
  ===================================================== */

  async function openDistrictMembers(
    districtId,
    districtNameText
  ) {

    /*
      District Admin security
    */

    if (
      isDistrictAdmin() &&
      districtId !==
      currentDistrictId
    ) {

      alert(
        "Aap sirf apne District ke members dekh sakte hain."
      );

      return;

    }


    await loadLocationMaps();


    const {
      data: members,
      error
    } = await supabaseClient
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
        designation,
        bps,
        status,
        created_at
      `)
      .eq(
        "district_id",
        districtId
      )
      .order(
        "created_at",
        {
          ascending:false
        }
      );


    if (error) {

      alert(
        "District Members Error:\n\n" +
        error.message
      );

      return;

    }


    const districtMembers =
      (members || []).map(
        member => ({

          ...member,

          _division_name:
            divisionName(
              member.division_id
            ),

          _district_name:
            districtName(
              member.district_id
            ),

          _taluka_name:
            talukaName(
              member.taluka_id
            )

        })
      );


    let modal =
      document.getElementById(
        "ytaUniversalModal"
      );


    if (modal) {
      modal.remove();
    }


    modal =
      document.createElement(
        "div"
      );


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


    let body = "";


    districtMembers.forEach(
      member => {

        body += `

          <tr>

            <td style="padding:10px;">
              ${escapeHTML(
                member.registration_no
              )}
            </td>

            <td style="padding:10px;">
              ${escapeHTML(
                member.full_name
              )}
            </td>

            <td style="padding:10px;">
              ${escapeHTML(
                member._division_name
              )}
            </td>

            <td style="padding:10px;">
              ${escapeHTML(
                member._district_name
              )}
            </td>

            <td style="padding:10px;">
              ${escapeHTML(
                member._taluka_name
              )}
            </td>

            <td style="padding:10px;">
              ${escapeHTML(
                member.school_name
              )}
            </td>

            <td style="padding:10px;">
              ${escapeHTML(
                member.status
              )}
            </td>

          </tr>

        `;

      }
    );


    if (!districtMembers.length) {

      body = `

        <tr>

          <td
            colspan="7"
            style="
              padding:30px;
              text-align:center;
            "
          >
            No members found in
            ${escapeHTML(
              districtNameText
            )}
            District.
          </td>

        </tr>

      `;

    }


    modal.innerHTML = `

      <div
        style="
          background:white;
          width:min(1200px,100%);
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

          <div>

            <h2>
              ${escapeHTML(
                districtNameText
              )}
              District Members
            </h2>

            <p>
              Total Members:
              <strong>
                ${districtMembers.length}
              </strong>
            </p>

          </div>

          <button id="ytaCloseModal">
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
              min-width:950px;
            "
          >

            <thead>

              <tr>

                <th style="padding:10px;background:#f1f5f9;">
                  Registration
                </th>

                <th style="padding:10px;background:#f1f5f9;">
                  Name
                </th>

                <th style="padding:10px;background:#f1f5f9;">
                  Division
                </th>

                <th style="padding:10px;background:#f1f5f9;">
                  District
                </th>

                <th style="padding:10px;background:#f1f5f9;">
                  Taluka
                </th>

                <th style="padding:10px;background:#f1f5f9;">
                  School
                </th>

                <th style="padding:10px;background:#f1f5f9;">
                  Status
                </th>

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


  /* =====================================================
     DIVISIONS
  ===================================================== */

  async function openDivisions() {

    await loadLocationMaps();


    const {
      data,
      error
    } = await supabaseClient
      .from("divisions")
      .select(
        "id,name,created_at"
      )
      .order(
        "name"
      );


    if (error) {

      alert(
        "Divisions Error:\n\n" +
        error.message
      );

      return;

    }


    openSimpleTable(
      "Divisions",
      data || [],
      [
        [
          "name",
          "Division Name"
        ],
        [
          "created_at",
          "Created"
        ]
      ]
    );

  }


  /* =====================================================
     TALUKAS
  ===================================================== */

  async function openTalukas() {

    await loadLocationMaps();


    const {
      data,
      error
    } = await supabaseClient
      .from("talukas")
      .select(
        "id,name,district_id"
      )
      .order(
        "name"
      );


    if (error) {

      alert(
        "Talukas Error:\n\n" +
        error.message
      );

      return;

    }


    let visibleTalukas =
      data || [];


    /*
      District Admin ko sirf
      apne District ki Talukas.
    */

    if (
      isDistrictAdmin() &&
      currentDistrictId
    ) {

      visibleTalukas =
        visibleTalukas.filter(
          item =>
            item.district_id ===
            currentDistrictId
        );

    }


    const converted =
      visibleTalukas.map(
        item => ({

          ...item,

          district_name:
            districtName(
              item.district_id
            )

        })
      );


    openSimpleTable(
      "Talukas",
      converted,
      [
        [
          "name",
          "Taluka Name"
        ],
        [
          "district_name",
          "District"
        ]
      ]
    );

  }


  /* =====================================================
     SIMPLE TABLE
  ===================================================== */

  function openSimpleTable(
    title,
    data,
    columns
  ) {

    let modal =
      document.getElementById(
        "ytaUniversalModal"
      );


    if (modal) {
      modal.remove();
    }


    modal =
      document.createElement(
        "div"
      );


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
              column[1]
            )}
          </th>

        `;

      }
    );


    let body = "";


    data.forEach(
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
                  row[column[0]]
                )}
              </td>

            `;

          }
        );


        body += "</tr>";

      }
    );


    if (!data.length) {

      body = `

        <tr>

          <td
            colspan="${columns.length}"
            style="
              padding:25px;
              text-align:center;
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
          width:min(1000px,100%);
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

          <button id="ytaCloseModal">
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


  /* =====================================================
     CENTRAL
  ===================================================== */

  async function openCentral() {

    const {
      data,
      error
    } = await supabaseClient
      .from(
        "organization_settings"
      )
      .select("*");


    if (error) {

      alert(
        "Central Error:\n\n" +
        error.message
      );

      return;

    }


    openSimpleTable(
      "Central Organization",
      data || [],
      [
        [
          "organization_name",
          "Organization Name"
        ],
        [
          "organization_short_name",
          "Short Name"
        ]
      ]
    );

  }


  /* =====================================================
     OFFICE BEARERS
  ===================================================== */

  async function openOfficeBearers() {

    const {
      data,
      error
    } = await supabaseClient
      .from(
        "dynamic_office_bearers"
      )
      .select("*");


    if (error) {

      alert(
        "Office Bearers Error:\n\n" +
        error.message
      );

      return;

    }


    openSimpleTable(
      "Dynamic Office Bearers",
      data || [],
      [
        [
          "name",
          "Name"
        ],
        [
          "father_name",
          "Father Name"
        ],
        [
          "designation",
          "Designation"
        ],
        [
          "bps",
          "BPS"
        ],
        [
          "mobile",
          "Mobile"
        ],
        [
          "is_active",
          "Active"
        ]
      ]
    );

  }


  /* =====================================================
     NAVIGATION
  ===================================================== */

  document.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "button"
        );


      if (!button) {
        return;
      }


      if (
        button.textContent
          .trim()
          .toLowerCase() !==
        "open"
      ) {

        return;

      }


      const card =
        button.closest(
          ".nav-card"
        );


      if (!card) {
        return;
      }


      const heading =
        card.querySelector(
          "h3"
        );


      const title =
        heading
          ?.textContent
          .trim()
          .toLowerCase() ||
        "";


      if (
        title ===
        "members"
      ) {

        await openMembersManagement();
        return;

      }


      if (
        title ===
        "districts"
      ) {

        await openDistricts();
        return;

      }


      if (
        title ===
        "divisions"
      ) {

        await openDivisions();
        return;

      }


      if (
        title ===
        "talukas"
      ) {

        await openTalukas();
        return;

      }


      if (
        title ===
        "central"
      ) {

        await openCentral();
        return;

      }


      if (
        title ===
        "office bearers"
      ) {

        await openOfficeBearers();
        return;

      }

    }
  );


  /* =====================================================
     LOAD MEMBERS BUTTON
  ===================================================== */

  if (loadMembersBtn) {

    loadMembersBtn.addEventListener(
      "click",
      async () => {

        await loadMembers();

      }
    );

  }


  /* =====================================================
     SEARCH
  ===================================================== */

  if (memberSearch) {

    memberSearch.addEventListener(
      "input",
      filterMembers
    );

  }


  /* =====================================================
     STATUS FILTER
  ===================================================== */

  if (memberStatus) {

    memberStatus.addEventListener(
      "change",
      filterMembers
    );

  }


  /* =====================================================
     MEMBER ACTIONS
  ===================================================== */

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
              approve.dataset
                .memberApprove,
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
              reject.dataset
                .memberReject,
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
                view.dataset
                  .memberView
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


  /* =====================================================
     LOGIN
  ===================================================== */

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          $("email")
            ?.value
            .trim();


        const password =
          $("password")
            ?.value;


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

          await setupUserAccess(
            data.user.id
          );


          showDashboard(
            data.user.email
          );


          if (
            isCentralOwner()
          ) {

            message(
              "Central Owner Login Successful."
            );

          } else {

            message(
              "District Admin Login Successful."
            );

          }


          await loadLocationMaps();
          await loadStats();


        } catch (error) {

          console.error(
            "Access Error:",
            error
          );


          await supabaseClient.auth
            .signOut();


          message(
            error.message ||
            "Access verify nahi ho saka.",
            true
          );

        }

      }
    );

  }


  /* =====================================================
     LOGOUT
  ===================================================== */

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async () => {

        await supabaseClient.auth
          .signOut();


        currentUser = null;
        currentProfile = null;
        currentRole = null;
        currentDistrictId = null;
        allMembers = [];


        showLogin();

      }
    );

  }


  /* =====================================================
     EXISTING SESSION
  ===================================================== */

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


    if (data?.session) {

      try {

        await setupUserAccess(
          data.session.user.id
        );


        showDashboard(
          data.session.user.email
        );


        await loadLocationMaps();
        await loadStats();


      } catch (accessError) {

        console.error(
          "Existing Session Access Error:",
          accessError
        );


        await supabaseClient.auth
          .signOut();


        showLogin();

      }

    } else {

      showLogin();

    }


  } catch (error) {

    console.error(
      "Session Error:",
      error
    );


    showLogin();

  }

});
