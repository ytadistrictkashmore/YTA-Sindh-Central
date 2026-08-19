document.addEventListener("DOMContentLoaded", async () => {

  const supabaseClient = window.supabase.createClient(
    window.YTA_CONFIG.supabaseUrl,
    window.YTA_CONFIG.supabaseAnonKey
  );

  const divisionSelect = document.getElementById("division_id");
  const districtSelect = document.getElementById("district_id");
  const talukaSelect = document.getElementById("taluka_id");
  const form = document.getElementById("registrationForm");
  const message = document.getElementById("registrationMessage");


  function showMessage(text, error = false) {

    if (!message) return;

    message.textContent = text;
    message.style.color = error
      ? "#b91c1c"
      : "#15803d";
  }


  function setLoading(select, text) {

    if (!select) return;

    select.innerHTML = "";

    const option =
      document.createElement("option");

    option.value = "";
    option.textContent = text;

    select.appendChild(option);
  }


  /* =========================
     LOAD DIVISIONS
  ========================= */

  async function loadDivisions() {

    setLoading(
      divisionSelect,
      "Loading Divisions..."
    );

    const result =
      await supabaseClient
        .from("divisions")
        .select("id,name")
        .order("name");

    console.log(
      "DIVISIONS RESULT:",
      result
    );

    if (result.error) {

      setLoading(
        divisionSelect,
        "Unable to load Divisions"
      );

      showMessage(
        "Division Error: " +
        result.error.message,
        true
      );

      return false;
    }


    divisionSelect.innerHTML = `
      <option value="">
        Select Division
      </option>
    `;


    (result.data || []).forEach(
      division => {

        const option =
          document.createElement("option");

        option.value = division.id;
        option.textContent = division.name;

        divisionSelect.appendChild(
          option
        );

      }
    );


    return true;
  }


  /* =========================
     LOAD DISTRICTS
  ========================= */

  async function loadDistricts(
    divisionId
  ) {

    setLoading(
      districtSelect,
      "Loading Districts..."
    );

    setLoading(
      talukaSelect,
      "Select Taluka"
    );


    if (!divisionId) {

      setLoading(
        districtSelect,
        "Select District"
      );

      return;
    }


    const result =
      await supabaseClient
        .from("districts")
        .select("id,name,division_id")
        .eq(
          "division_id",
          divisionId
        )
        .order("name");


    console.log(
      "DISTRICTS RESULT:",
      result
    );


    if (result.error) {

      setLoading(
        districtSelect,
        "Unable to load Districts"
      );

      showMessage(
        "District Error: " +
        result.error.message,
        true
      );

      return;
    }


    districtSelect.innerHTML = `
      <option value="">
        Select District
      </option>
    `;


    (result.data || []).forEach(
      district => {

        const option =
          document.createElement("option");

        option.value =
          district.id;

        option.textContent =
          district.name;

        districtSelect.appendChild(
          option
        );

      }
    );

  }


  /* =========================
     LOAD TALUKAS
  ========================= */

  async function loadTalukas(
    districtId
  ) {

    setLoading(
      talukaSelect,
      "Loading Talukas..."
    );


    if (!districtId) {

      setLoading(
        talukaSelect,
        "Select Taluka"
      );

      return;
    }


    const result =
      await supabaseClient
        .from("talukas")
        .select("id,name,district_id")
        .eq(
          "district_id",
          districtId
        )
        .order("name");


    console.log(
      "TALUKAS RESULT:",
      result
    );


    if (result.error) {

      setLoading(
        talukaSelect,
        "Unable to load Talukas"
      );

      showMessage(
        "Taluka Error: " +
        result.error.message,
        true
      );

      return;
    }


    talukaSelect.innerHTML = `
      <option value="">
        Select Taluka
      </option>
    `;


    (result.data || []).forEach(
      taluka => {

        const option =
          document.createElement("option");

        option.value =
          taluka.id;

        option.textContent =
          taluka.name;

        talukaSelect.appendChild(
          option
        );

      }
    );

  }


  /* =========================
     EVENTS
  ========================= */

  divisionSelect.addEventListener(
    "change",
    async () => {

      await loadDistricts(
        divisionSelect.value
      );

    }
  );


  districtSelect.addEventListener(
    "change",
    async () => {

      await loadTalukas(
        districtSelect.value
      );

    }
  );


  /* =========================
     REGISTRATION NUMBER
  ========================= */

  async function getNextRegistrationNumber() {

    const result =
      await supabaseClient
        .from("members")
        .select("registration_no")
        .not(
          "registration_no",
          "is",
          null
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1);


    if (result.error)
      throw result.error;


    let number = 1;


    if (
      result.data &&
      result.data.length
    ) {

      const last =
        result.data[0]
          .registration_no;


      const match =
        String(last)
          .match(/\d+$/);


      if (match) {

        number =
          parseInt(
            match[0],
            10
          ) + 1;

      }

    }


    return (
      "YTA-SINDH-" +
      String(number)
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


        try {

          showMessage(
            "Submitting registration..."
          );


          const registrationNo =
            await getNextRegistrationNumber();


          const member = {

            registration_no:
              registrationNo,

            full_name:
              document
                .getElementById(
                  "full_name"
                )
                .value
                .trim(),

            father_name:
              document
                .getElementById(
                  "father_name"
                )
                .value
                .trim() || null,

            cnic:
              document
                .getElementById(
                  "cnic"
                )
                .value
                .trim(),

            mobile:
              document
                .getElementById(
                  "mobile"
                )
                .value
                .trim(),

            division_id:
              divisionSelect.value,

            district_id:
              districtSelect.value,

            taluka_id:
              talukaSelect.value,

            school_name:
              document
                .getElementById(
                  "school_name"
                )
                .value
                .trim(),

            semis_code:
              document
                .getElementById(
                  "semis_code"
                )
                .value
                .trim() || null,

            designation:
              document
                .getElementById(
                  "designation"
                )
                .value
                .trim() || "Teacher",

            bps:
              document
                .getElementById(
                  "bps"
                )
                .value
                .trim() || null,

            joining_date:
              document
                .getElementById(
                  "joining_date"
                )
                .value || null,

            address:
              document
                .getElementById(
                  "address"
                )
                .value
                .trim() || null,

            status:
              "Under Review"

          };


          const result =
            await supabaseClient
              .from("members")
              .insert(member);


          if (result.error) {

            console.error(
              "MEMBER INSERT ERROR:",
              result.error
            );

            showMessage(
              "Registration Error: " +
              result.error.message,
              true
            );

            return;
          }


          showMessage(
            "Registration successful! " +
            "Registration No: " +
            registrationNo +
            ". Application Under Review hai."
          );


          form.reset();


          await loadDivisions();


          setLoading(
            districtSelect,
            "Select District"
          );


          setLoading(
            talukaSelect,
            "Select Taluka"
          );


        } catch (error) {

          console.error(
            "REGISTRATION ERROR:",
            error
          );

          showMessage(
            "Error: " +
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
