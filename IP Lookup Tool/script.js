const lookupBtn = document.getElementById("lookup-btn");
const infoCard = document.getElementById("info-card");

lookupBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    document.getElementById("ip").textContent = data.ip;
    document.getElementById("country").textContent = `${data.country_name} (${data.country_code})`;
    document.getElementById("isp").textContent = data.org;
    document.getElementById("timezone").textContent = data.timezone;

    infoCard.classList.remove("hidden");
  } catch (error) {
    alert("⚠️ Failed to fetch IP info. Please try again.");
    console.error(error);
  }
});
