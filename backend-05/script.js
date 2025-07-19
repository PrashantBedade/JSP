document.getElementById("surveyForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("http://localhost:3000/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    document.getElementById("responseMsg").innerText = result.message;
    this.reset();
  } catch (error) {
    document.getElementById("responseMsg").innerText = "Something went wrong. Try again!";
    console.error(error);
  }
});
