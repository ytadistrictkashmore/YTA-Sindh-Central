document.addEventListener("DOMContentLoaded", async () => {

  const supabaseClient = window.supabase.createClient(
    window.YTA_CONFIG.supabaseUrl,
    window.YTA_CONFIG.supabaseAnonKey
  );

  const $ = (id) => document.getElementById(id);

  const form = $("registrationForm");
  const message = $("registrationMessage");

  const divisionSelect = $("division_id");
  const districtSelect = $("district_id");
  const talukaSelect = $("taluka_id");


  /* =========================
     MESSAGE
  ========================= */

  function showMessage(text, error = false) {

    if (!message) return;

    message.textContent = text;

    message.style.color =
      error ? "#b91c1c" : "#15803d";
  }


  /* =========================
     LOAD DIVISIONS
  ========================= */

  async function loadDivisions() {

    if (!divisionSelect) return;

    const { data, error } =
      await supabaseClient
        .from("divisions")
        .select("id, name")
        .order("name");

    if (error) {

      console.error(error);

      showMessage(
        "Divisions load nahi ho sakin: " +
        error.message,
        true
      );

      return;
    }

    divisionSelect.innerHTML = `
      <option value="">
        Select Division
      </option>
    `;

    (data || []).forEach(division => {

      const option =
        document.createElement("option");

      option.value = division.id;
      option.textContent = division.name;

      divisionSelect.appendChild(option);

    });

  }


  /* =========================
     LOAD DISTRICTS
  ========================= */

  async function loadDistricts(divisionId) {

    districtSelect.innerHTML = `
      <option value="">
        Select District
      </option>
    `;

    talukaSelect.innerHTML = `
      <option value="">
        Select Taluka
      </option>
    `;

    if (!divisionId) return;

    const { data, error } =
      await supabaseClient
        .from("districts")
        .select("id, name")
        .eq("division_id", divisionId)
        .order("name");

    if (error) {

      console.error(error);

      showMessage(
        "Districts load nahi ho sake: " +
        error.message,
        true
      );

      return;
    }

    (data || []).forEach(district => {

      const option =
        document.createElement("option");

      option.value = district.id;
      option.textContent = district.name;

      districtSelect.appendChild(option);

    });

  }


  /* =========================
     LOAD TALUKAS
  ========================= */

  async function loadTalukas(districtId) {

    talukaSelect.innerHTML = `
      <option value="">
        Select Taluka
      </option>
    `;

    if (!districtId) return;

    const { data, error } =
      await supabaseClient
        .from("talukas")
        .select("id, name")
        .eq("district_id", districtId)
        .order("name");

    if (error) {

      console.error(error);

      showMessage(
        "Talukas load nahi ho sakin: " +
        error.message,
        true
      );

      return;
    }

    (data || []).forEach(taluka => {

      const option =
        document.createElement("option");

      option.value = taluka.id;
      option.textContent = taluka.name;

      talukaSelect.appendChild(option);

    });

  }


  /* =========================
     DIVISION CHANGE
  ========================= */

  if (divisionSelect) {

    divisionSelect.addEventListener(
      "change",
      async () => {

        await loadDistricts(
          divisionSelect.value
        );

      }
    );

  }


  /* =========================
     DISTRICT CHANGE
  ========================= */

  if (districtSelect) {

    districtSelect.addEventListener(
      "change",
      async () => {

        await loadTalukas(
          districtSelect.value
        );

      }
    );

  }


  /* =========================
     GENERATE REGISTRATION NO
  ========================= */

  async function generateRegistrationNumber() {

    const { data, error } =
      await supabaseClient
        .from("members")
        .select("registration_no")
        .not("registration_no", "is", null)
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1);

    if (error) {

      console.error(error);

      throw error;
    }

    let nextNumber = 1;

    if (
      data &&
      data.length &&
      data[0].registration_no
    ) {

      const match =
        String(
          data[0].registration_no
        ).match(/\d+$/);

      if (match) {

        nextNumber =
          parseInt(
            match[0],
            10
          ) + 1;

      }

    }

    return (
      "YTA-SINDH-" +
      String(nextNumber)
        .padStart(5, "0")
    );

  }


  /* =========================
     FORM SUBMIT
  ========================= */

  if (form) {

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        showMessage(
          "Registration submit ho rahi hai..."
        );


        try {

          const fullName =
            $("full_name")
              ?.value
              .trim();

          const fatherName =
            $("father_name")
              ?.value
              .trim();

          const cnic =
            $("cnic")
              ?.value
              .trim();

          const mobile =
            $("mobile")
              ?.value
              .trim();

          const divisionId =
            $("division_id")
              ?.value;

          const districtId =
            $("district_id")
              ?.value;

          const talukaId =
            $("taluka_id")
              ?.value;

          const schoolName =
            $("school_name")
              ?.value
              .trim();

          const semisCode =
            $("semis_code")
              ?.value
              .trim();

          const designation =
            $("designation")
              ?.value
              .trim();

          const bps =
            $("bps")
              ?.value
              .trim();

          const joiningDate =
            $("joining_date")
              ?.value || null;

          const address =
            $("address")
              ?.value
              .trim();


          /* =====================
             VALIDATION
          ===================== */

          if (!fullName) {

            showMessage(
              "Full Name required hai.",
              true
            );

            return;
          }

          if (!cnic) {

            showMessage(
              "CNIC required hai.",
              true
            );

            return;
          }

          if (!mobile) {

            showMessage(
              "Mobile number required hai.",
              true
            );

            return;
          }

          if (!divisionId) {

            showMessage(
              "Division select karein.",
              true
            );

            return;
          }

          if (!districtId) {

            showMessage(
              "District select karein.",
              true
            );

            return;
          }

          if (!talukaId) {

            showMessage(
              "Taluka select karein.",
              true
            );

            return;
          }

          if (!schoolName) {

            showMessage(
              "School Name required hai.",
              true
            );

            return;
          }


          /* =====================
             REGISTRATION NUMBER
          ===================== */

          const registrationNo =
            await generateRegistrationNumber();


          /* =====================
             INSERT
          ===================== */

          const {
            data,
            error
          } =
            await supabaseClient
              .from("members")
              .insert({

                registration_no:
                  registrationNo,

                full_name:
                  fullName,

                father_name:
                  fatherName || null,

                cnic:
                  cnic,

                mobile:
                  mobile,

                division_id:
                  divisionId,

                district_id:
                  districtId,

                taluka_id:
                  talukaId,

                school_name:
                  schoolName,

                semis_code:
                  semisCode || null,

                designation:
                  designation ||
                  "Teacher",

                bps:
                  bps || null,

                joining_date:
                  joiningDate,

                address:
                  address || null,

                status:
                  "Under Review"

              })
              .select()
              .single();


          if (error) {

            console.error(
              "Registration Error:",
              error
            );

            showMessage(
              "Registration failed: " +
              error.message,
              true
            );

            return;
          }


          /* =====================
             SUCCESS
          ===================== */

          showMessage(
            "Registration successful! " +
            "Registration No: " +
            registrationNo +
            " | Application Under Review hai."
          );


          form.reset();


          await loadDivisions();


          districtSelect.innerHTML = `
            <option value="">
              Select District
            </option>
          `;


          talukaSelect.innerHTML = `
            <option value="">
              Select Taluka
            </option>
          `;


          console.log(
            "Registered Member:",
            data
          );


        } catch (error) {

          console.error(
            "Registration Error:",
            error
          );

          showMessage(
            "Unexpected error: " +
            error.message,
            true
          );

        }

      }
    );

  }


  /* =========================
     INITIAL LOAD
  ========================= */

  await loadDivisions();

});
