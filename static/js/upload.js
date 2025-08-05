const fileInput = document.getElementById("file-input");
const uploadLabel = document.getElementById("uploadLabel");
const uploadBtn = document.getElementById("uploadBtn");
const fileChipsContainer = document.getElementById("file-chips-container");
const sendBtn = document.getElementById("sendBtn");
const searchInput = document.getElementById("search-input");

let selectedFiles = [];

function updateUI() {
	fileChipsContainer.innerHTML = "";

	const hasFiles = selectedFiles.length > 0;

	sendBtn.style.display = hasFiles ? "none" : "inline-block";
	uploadBtn.style.display = hasFiles ? "inline-block" : "none";
	uploadLabel.textContent = hasFiles
		? `Select more (${selectedFiles.length})`
		: "Select files";

	selectedFiles.forEach((file, index) => {
		const chip = document.createElement("div");
		chip.className =
			"bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center space-x-1 max-w-xs truncate";

		const span = document.createElement("span");
		span.textContent = file.name;
		span.className = "truncate";

		const removeBtn = document.createElement("button");
		removeBtn.type = "button";
		removeBtn.innerHTML = '<i class="fas fa-times"></i>';
		removeBtn.className =
			"text-indigo-600 hover:text-indigo-900 focus:outline-none";
		removeBtn.title = "Remove File";

		removeBtn.addEventListener("click", () => {
			selectedFiles.splice(index, 1);
			updateUI();
			updateFileInputFiles();
		});

		chip.appendChild(span);
		chip.appendChild(removeBtn);
		fileChipsContainer.appendChild(chip);
	});

	searchInput.placeholder = hasFiles ? "" : "Ask something...";
}

function updateFileInputFiles() {
	const dataTransfer = new DataTransfer();
	selectedFiles.forEach((file) => dataTransfer.items.add(file));
	fileInput.files = dataTransfer.files;
}

fileInput.addEventListener("change", () => {
	for (const file of fileInput.files) {
		if (
			!selectedFiles.some((f) => f.name === file.name && f.size === file.size)
		) {
			selectedFiles.push(file);
		}
	}
	updateUI();
});

searchInput.addEventListener("input", () => {
	if (searchInput.value.trim().length > 0 && selectedFiles.length === 0) {
		sendBtn.style.display = "inline-block";
	} else if (selectedFiles.length === 0) {
		sendBtn.style.display = "none";
	}
});

updateUI();
