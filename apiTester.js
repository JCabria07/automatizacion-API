const BASE_URL = "https://jsonplaceholder.typicode.com";
const resultsContainer = document.getElementById("results");
const summary = document.getElementById("summary");

document.getElementById("runTests").addEventListener("click", runTests);

async function runTests() {
  resultsContainer.innerHTML = "";
  summary.textContent = "Ejecutando pruebas...";

  const startGlobal = performance.now();
  const tests = [];

  async function sendRequest(method, endpoint, data = null) {
    const url = BASE_URL + endpoint;
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (data) options.body = JSON.stringify(data);

    const start = performance.now();
    const response = await fetch(url, options);
    const time = Math.round(performance.now() - start);
    const body = await response.json().catch(() => ({}));

    return { method, url, status: response.status, time, body };
  }

  function renderCard(testName, status, validations) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";

    const badgeClass =
      status === 200 ? "bg-success" :
      status === 201 ? "bg-info" :
      status === 204 ? "bg-secondary" : "bg-danger";

    const card = document.createElement("div");
    card.className = "card p-3";

    const validationsHTML = validations.map(v => `
      <div class="p-2 mb-1 rounded ${v.pass ? "bg-light text-success border border-success" : "bg-light text-danger border border-danger"}">
        ${v.message}
      </div>
    `).join("");

    card.innerHTML = `
      <div class="card-body text-center">
        <h5 class="card-title mb-2">${testName}</h5>
        <h6><span class="badge ${badgeClass} badge-status">HTTP ${status}</span></h6>
        <div class="mt-3 text-start">${validationsHTML}</div>
        <img src="imgs/verified.gif" alt="Verified" class="gif-verified">
      </div>
    `;

    col.appendChild(card);
    resultsContainer.appendChild(col);
  }

  try {
    // --- GET /users ---
    const r1 = await sendRequest("GET", "/users");
    renderCard("GET /users", r1.status, [
      { message: "Código de estado 200 OK", pass: r1.status === 200 },
      { message: "La respuesta contiene usuarios", pass: Array.isArray(r1.body) && r1.body.length > 0 },
    ]);
    tests.push(r1);

    // --- POST /posts ---
    const postData = { title: "Nuevo Post", body: "Contenido de prueba", userId: 1 };
    const r2 = await sendRequest("POST", "/posts", postData);
    const postId = r2.body?.id;
    renderCard("POST /posts", r2.status, [
      { message: "Código de estado 201 Created", pass: r2.status === 201 },
      { message: "Se generó un ID de publicación", pass: !!postId },
    ]);
    tests.push(r2);

    // --- PUT /posts/:id ---
    const r3 = await sendRequest("PUT", `/posts/${postId || 1}`, {
      id: postId || 1,
      title: "Actualizado",
      body: "Nuevo contenido",
      userId: 1,
    });
    renderCard("PUT /posts/1", r3.status, [
      { message: "Código de estado 200 OK", pass: r3.status === 200 },
      { message: "Título actualizado correctamente", pass: r3.body?.title === "Actualizado" },
    ]);
    tests.push(r3);

    // --- DELETE /posts/:id ---
    const r4 = await sendRequest("DELETE", `/posts/${postId || 1}`);
    renderCard("DELETE /posts/1", r4.status, [
      { message: "Código de estado 200 o 204", pass: [200, 204].includes(r4.status) },
    ]);
    tests.push(r4);

  } catch (error) {
    const errorAlert = document.createElement("div");
    errorAlert.className = "alert alert-danger";
    errorAlert.textContent = "Error al ejecutar las pruebas: " + error.message;
    resultsContainer.appendChild(errorAlert);
  }

  const totalTime = ((performance.now() - startGlobal) / 1000).toFixed(2);
  summary.textContent = `Pruebas completadas en ${totalTime} segundos. Total de pruebas ejecutadas: ${tests.length}.`;
}
