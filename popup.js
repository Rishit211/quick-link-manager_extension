document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("link-name");
  const urlInput = document.getElementById("link-url");
  const categoryInput = document.getElementById("link-category");
  const addBtn = document.getElementById("add-link");
  const saveCurrentBtn = document.getElementById("save-current");
  const linksList = document.getElementById("links-list");
  const searchInput = document.getElementById("search");
  const categoryFilter = document.getElementById("category-filter");
  const exportBtn = document.getElementById("export-json");
  const importInput = document.getElementById("import-json");
  const darkModeToggle = document.getElementById("dark-mode-toggle");

  let links = [];

  function saveLinks() {
    chrome.storage.local.set({ links });
  }

  function loadLinks() {
    chrome.storage.local.get(["links", "darkMode"], (data) => {
      links = data.links || [];
      renderLinks();
      populateCategories();

      // Apply stored dark mode preference
      const isDark = data.darkMode;
      darkModeToggle.checked = isDark;
      document.body.classList.toggle("dark-mode", isDark);
    });
  }

  function addLink() {
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const category = categoryInput.value.trim();

    if (name && url) {
      links.push({ name, url, category, pinned: false });
      nameInput.value = "";
      urlInput.value = "";
      categoryInput.value = "";
      saveLinks();
      renderLinks();
      populateCategories();
    }
  }

  function saveCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      nameInput.value = tab.title;
      urlInput.value = tab.url;
    });
  }

  function renderLinks() {
    const search = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    linksList.innerHTML = "";

    [...links]
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      .filter(link =>
        (!search || link.name.toLowerCase().includes(search) || link.url.toLowerCase().includes(search)) &&
        (!selectedCategory || link.category === selectedCategory)
      )
      .forEach((link, index) => {
        const div = document.createElement("div");
        div.className = "link-item";

        div.innerHTML = `
          <strong>${link.name}</strong><br>
          <a href="${link.url}" target="_blank">${link.url}</a><br>
          <em>${link.category || "No Category"}</em><br>
          <button data-index="${index}" class="edit-btn">Edit</button>
          <button data-index="${index}" class="delete-btn">Delete</button>
          <button data-index="${index}" class="pin-btn">${link.pinned ? "Unpin" : "Pin"}</button>
        `;
        linksList.appendChild(div);
      });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const i = e.target.dataset.index;
        links.splice(i, 1);
        saveLinks();
        renderLinks();
        populateCategories();
      });
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const i = e.target.dataset.index;
        const link = links[i];
        nameInput.value = link.name;
        urlInput.value = link.url;
        categoryInput.value = link.category;
        links.splice(i, 1);
        saveLinks();
        renderLinks();
        populateCategories();
      });
    });

    document.querySelectorAll(".pin-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const i = e.target.dataset.index;
        links[i].pinned = !links[i].pinned;
        saveLinks();
        renderLinks();
      });
    });
  }

  function populateCategories() {
    const categories = [...new Set(links.map(link => link.category).filter(Boolean))];
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
  }

  function exportLinks() {
    const blob = new Blob([JSON.stringify(links, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quick_links.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importLinks(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (Array.isArray(imported)) {
          links = imported;
          saveLinks();
          renderLinks();
          populateCategories();
        }
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function toggleDarkMode(e) {
    const enabled = e.target.checked;
    document.body.classList.toggle("dark-mode", enabled);
    chrome.storage.local.set({ darkMode: enabled });
  }

  addBtn.addEventListener("click", addLink);
  saveCurrentBtn.addEventListener("click", saveCurrentTab);
  searchInput.addEventListener("input", renderLinks);
  categoryFilter.addEventListener("change", renderLinks);
  exportBtn.addEventListener("click", exportLinks);
  importInput.addEventListener("change", importLinks);
  darkModeToggle.addEventListener("change", toggleDarkMode);

  loadLinks();
});
