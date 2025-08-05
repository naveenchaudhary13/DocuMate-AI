const uploadForm = document.getElementById("uploadForm");
const chatWindow = document.getElementById("chat-window");
let activeChatId = null;

function appendMessage(text, fromUser = true, useTyping = false) {
	const msgDiv = document.createElement("div");
	msgDiv.className = fromUser
		? "text-right mb-2 flex justify-end"
		: "text-left mb-2 flex justify-start";

	const bubble = document.createElement("div");
	bubble.className = fromUser
		? "bg-indigo-600 text-white text-left px-4 py-2 rounded-2xl max-w-md break-words whitespace-pre-wrap overflow-x-auto"
		: "bg-gray-200 text-gray-800 text-left px-4 py-2 rounded-2xl max-w-md break-words whitespace-pre-wrap overflow-x-auto";

	msgDiv.appendChild(bubble);
	chatWindow.appendChild(msgDiv);
	chatWindow.scrollTop = chatWindow.scrollHeight;

	if (fromUser || !useTyping) {
		bubble.textContent = text;
	} else {
		let index = 0;
		const speed = 20;

		function typeChar() {
			if (index < text.length) {
				bubble.textContent += text.charAt(index);
				index++;
				chatWindow.scrollTop = chatWindow.scrollHeight;
				setTimeout(typeChar, speed);
			}
		}

		typeChar();
	}

	const placeholder = document.getElementById("placeholder");
	if (placeholder) {
		placeholder.style.display = "none";
	}
}

function appendLoader() {
	const loaderDiv = document.createElement("div");
	loaderDiv.className = "text-left mb-3 flex justify-start";
	loaderDiv.id = "loading";

	const bubble = document.createElement("div");
	bubble.className = "bg-gray-200 text-gray-800 px-4 py-2 rounded-lg max-w-xs";
	bubble.innerHTML = `
      <div class="typing">
        <span></span><span></span><span></span>
      </div>`;

	loaderDiv.appendChild(bubble);
	chatWindow.appendChild(loaderDiv);
	chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeLoader() {
	const loader = document.getElementById("loading");
	if (loader) loader.remove();
}

uploadForm.addEventListener("submit", function (e) {
	e.preventDefault();

	const query = searchInput.value.trim();
	const hasFiles = fileInput.files.length > 0;

	if (hasFiles) {
		const formData = new FormData(uploadForm);

		fetch(uploadForm.action, {
			method: "POST",
			body: formData,
			headers: {
				"X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
					.value,
			},
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.success) {
					showSuccessModal();
					selectedFiles = [];
					fileInput.value = "";
					updateUI();
					if (data.docs_html) {
						document.getElementById("docsList").innerHTML = data.docs_html;
						document.getElementById("modalDocsList").innerHTML = data.docs_html;
					}
					if (data.manage_docs_html) {
						document.getElementById("modalManageDocsList").innerHTML =
							data.manage_docs_html;
					}
				} else {
					Toastify({
						text: data.error || "Something went wrong.",
						duration: 4000,
						close: true,
						gravity: "top",
						position: "center",
						stopOnFocus: true,
						duration: 5000,
						style: {
							background: "linear-gradient(to right, #ef4444, #b91c1c)",
						},
						className: "rounded shadow text-md px-3 py-2",
					}).showToast();
				}
			})
			.catch((err) => {
				console.error(err);
				Toastify({
					text: "Unable to upload file.",
					duration: 4000,
					close: true,
					gravity: "top",
					position: "center",
					stopOnFocus: true,
					duration: 5000,
					style: {
						background: "linear-gradient(to right, #ef4444, #b91c1c)",
					},
					className: "rounded shadow text-md px-3 py-2",
				}).showToast();
			});
	} else if (query) {
		appendMessage(query, true, true);
		searchInput.value = "";
		sendBtn.disabled = true;
		appendLoader();

		fetch(
			"search/?q=" +
				encodeURIComponent(query) +
				(activeChatId ? `&chat_id=${activeChatId}` : "")
		)
			.then((res) => res.json())
			.then((data) => {
				removeLoader();

				if (data.answer) {
					appendMessage(data.answer, false, true);
				} else if (data.error) {
					appendMessage(data.error, false, true);
				} else {
					appendMessage("Sorry, no answer found.", false, true);
				}

				if (data.chat_id) {
					activeChatId = data.chat_id;

					fetch("/get-user-chats/")
						.then((res) => res.json())
						.then((data) => {
							const chatsList = document.getElementById("chatsList");
							const modalChatsList = document.getElementById("modalChatsList");
							const modalManageChatsList = document.getElementById(
								"modalManageChatsList"
							);
							const chatsIcon = document.getElementById("chatsToggleIcon");
							const chatsToggleBtn = document.getElementById("chatsToggleBtn");
							const docsList = document.getElementById("docsList");
							const docsIcon = document.getElementById("docsToggleIcon");
							chatsList.innerHTML = "";
							modalChatsList.innerHTML = "";
							modalManageChatsList.innerHTML = "";

							if (data.chats.length === 0) {
								const emptyDiv = document.createElement("div");
								emptyDiv.className = "text-indigo-400 italic px-2 py-1";
								emptyDiv.textContent = "No chats available.";
								chatsList.appendChild(emptyDiv);
								modalChatsList.appendChild(emptyDiv);
								modalManageChatsList.appendChild(emptyDiv);
								return;
							}

							data.chats.forEach((chat) => {
								const div = document.createElement("div");
								const newChatBtn = document.getElementById("newChatBtn");
								newChatBtn.classList.remove(
									"bg-indigo-500",
									"text-white",
									"hover:bg-indigo-600"
								);
								newChatBtn.classList.add("text-indigo-600");
								const chatWindow = document.querySelector(".chat-window");
								chatWindow.id = `chat-window-${chat.id}`;

								div.className =
									"p-2 bg-white rounded mb-2 me-1 truncate cursor-pointer hover:bg-indigo-400";
								div.textContent = chat.name;
								div.title = chat.name;
								div.id = "chat-item-" + chat.id;
								div.setAttribute("data-chat-id", chat.id);

								const modalDiv = document.createElement("div");
								modalDiv.className =
									"p-2 my-3 bg-white rounded cursor-pointer chat-item";
								modalDiv.textContent = chat.name;
								modalDiv.title = chat.name;
								modalDiv.setAttribute("data-chat-id", chat.id);
								modalDiv.setAttribute("onclick", `selectChat(${chat.id})`);

								const modalManageParentDiv = document.createElement("div");
								modalManageParentDiv.className =
									"p-2 bg-indigo-500 rounded shadow hover:bg-indigo-600 relative group";
								modalManageParentDiv.id = "manage-modal-chat-item-" + chat.id;

								const modalManageDiv = document.createElement("div");
								modalManageDiv.className =
									"cursor-pointer font-medium text-gray-800 bg-indigo-300 p-2 rounded";
								modalManageDiv.textContent = chat.name;
								modalManageDiv.setAttribute("onclick", `toggleMeta(this)`);

								modalManageDiv.innerHTML = `
								  <span>${chat.name}</span>
								  <i class="arrow-icon fas fa-chevron-down transition-transform duration-300"></i>
								`;

								const metaInfo = document.createElement("div");
								metaInfo.className = "chat-meta hidden mt-2 text-sm text-gray-600 bg-indigo-200 p-2 rounded";
								metaInfo.innerHTML = `
								  <div><strong>Created at:</strong> ${formatDateTimeIndian(chat.created_at)}</div>
								  <div><strong>Last updated at:</strong> ${formatDateTimeIndian(chat.updated_at)}</div>
								  <div><strong>Messages:</strong> ${chat.messages}</div>
								  <button onclick="triggerDelete('chat', ${chat.id})" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 hover:text-white mt-2">Delete</button>
								`;

								if (chat.id === activeChatId) {
									div.classList.add(
										"bg-indigo-500",
										"hover:bg-indigo-600",
										"text-white"
									);
									modalDiv.classList.add(
										"bg-indigo-500",
										"hover:bg-indigo-600",
										"text-white"
									);
								}

								div.onclick = () => {
									loadChatMessages(chat.id, false);
									activeChatId = chat.id;

									document.querySelectorAll("#chatsList div").forEach((el) => {
										el.classList.remove(
											"bg-indigo-500",
											"hover:bg-indigo-600",
											"text-white"
										);
									});

									div.classList.add(
										"bg-indigo-500",
										"hover:bg-indigo-600",
										"text-white"
									);
								};

								chatsList.appendChild(div);
								modalChatsList.appendChild(modalDiv);
								modalManageParentDiv.appendChild(modalManageDiv);
								modalManageParentDiv.appendChild(metaInfo);
								modalManageChatsList.appendChild(modalManageParentDiv);

								if (expanded) {
									docsList.style.display = "none";
									docsIcon.classList.remove("fa-chevron-up");
									docsIcon.classList.add("fa-chevron-down");
									chatsList.style.display = "block";
									chatsIcon.classList.remove(
										"fa-chevron-down",
										"text-indigo-400"
									);
									chatsIcon.classList.add("fa-chevron-up");
								}
								chatsToggleBtn.classList.remove("text-indigo-600");
								chatsToggleBtn.classList.add("bg-indigo-500", "text-white");
							});
						});
				}
			})
			.catch(() => {
				removeLoader();
				appendMessage("Error processing your request.", false, true);
			})
			.finally(() => {
				sendBtn.disabled = false;
				searchInput.focus();
			});
	} else {
		Toastify({
			text: "Please enter a query or select a file.",
			duration: 4000,
			close: true,
			gravity: "top",
			position: "center",
			stopOnFocus: true,
			duration: 5000,
			style: {
				background: "linear-gradient(to right, #ef4444, #b91c1c)",
			},
			className: "rounded shadow text-md px-3 py-2",
		}).showToast();
	}
});

searchInput.addEventListener("keydown", function (e) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		uploadForm.requestSubmit();
	}
});

sendBtn.addEventListener("click", function () {
	uploadForm.requestSubmit();
});

document.addEventListener("DOMContentLoaded", () => {
	fetch("/get-user-chats/")
		.then((res) => res.json())
		.then((data) => {
			const chatsList = document.getElementById("chatsList");
			chatsList.innerHTML = "";

			if (data.chats.length === 0) {
				const emptyDiv = document.createElement("div");
				emptyDiv.className = "text-indigo-400 italic px-2 py-1";
				emptyDiv.textContent = "No chats available.";
				chatsList.appendChild(emptyDiv);
				return;
			}

			data.chats.forEach((chat) => {
				const div = document.createElement("div");
				div.className =
					"p-2 bg-white rounded mb-2 me-1 truncate cursor-pointer hover:bg-indigo-400";
				div.textContent = chat.name;
				div.title = chat.name;
				div.id = `chat-item-${chat.id}`;
				div.setAttribute("data-chat-id", chat.id);

				div.onclick = () => {
					const chatsToggleBtn = document.getElementById("chatsToggleBtn");
					chatsToggleBtn.classList.remove("text-indigo-600");
					chatsToggleBtn.classList.add("bg-indigo-500", "text-white");

					loadChatMessages(chat.id, false);
					activeChatId = chat.id;

					document.querySelectorAll("#chatsList div").forEach((el) => {
						el.classList.remove(
							"bg-indigo-500",
							"hover:bg-indigo-600",
							"text-white"
						);
					});

					document.querySelectorAll(`chat-item`).forEach((el) => {
						el.classList.remove(
							"bg-indigo-500",
							"text-white",
							"hover:bg-indigo-600"
						);
					});

					document
						.querySelectorAll(`[data-chat-id="${chat.id}"]`)
						.forEach((el) => {
							el.classList.add(
								"bg-indigo-500",
								"text-white",
								"hover:bg-indigo-600"
							);
						});

					div.classList.add(
						"bg-indigo-500",
						"hover:bg-indigo-600",
						"text-white"
					);
				};

				chatsList.appendChild(div);
			});
		});
});

function loadChatMessages(chatId, fromNewChat = false) {
	if (!chatId) return;
	chatWindow.scroll = "smooth";
	fetch(`/get-chat-messages/${chatId}/`)
		.then((response) => response.json())
		.then((data) => {
			const chatWindow = document.querySelector(".chat-window");
			const newChatBtn = document.getElementById("newChatBtn");

			chatWindow.innerHTML = "";
			chatWindow.id = `chat-window-${chatId}`;
			newChatBtn.classList.remove(
				"bg-indigo-500",
				"text-white",
				"hover:bg-indigo-600"
			);
			newChatBtn.classList.add("text-indigo-600");

			data.messages.forEach((msg) => {
				appendMessage(msg.message, msg.from_user, false);
			});

			chatWindow.scrollTop = chatWindow.scrollHeight;
		})
		.catch((error) => {
			console.error("Error loading chat messages:", error);
		});
}

document.querySelectorAll(".chat-option").forEach((item) => {
	item.addEventListener("click", function () {
		const chatId = this.dataset.chatId;
		loadChatMessages(chatId, false);
	});
});

document.getElementById("newChatBtn").addEventListener("click", function () {
	const chatWindow = document.querySelector(".chat-window");
	const chatsToggleBtn = document.getElementById("chatsToggleBtn");
	const chatsToggleIcon = document.getElementById("chatsToggleIcon");
	const chatsList = document.getElementById("chatsList");
	chatsList.style.display = "none";

	chatsToggleBtn.classList.add("text-indigo-600");
	chatsToggleBtn.classList.remove("bg-indigo-500", "text-white");
	this.classList.remove("text-indigo-600", "bg-white");
	this.classList.add("bg-indigo-500", "text-white");

	chatWindow.id = "chat-window";
	chatWindow.innerHTML = `
    <div id="placeholder" class="text-gray-500 text-sm text-center">
      Ask something from your uploaded documents
    </div>`;

	chatsToggleIcon.classList.remove("fa-chevron-up");
	chatsToggleIcon.classList.add("fa-chevron-down");

	activeChatId = null;

	document.querySelectorAll("[data-chat-id]").forEach((el) => {
		el.classList.remove("bg-indigo-500", "text-white", "hover:bg-indigo-600");
		el.classList.add("bg-white");
	});

	chatWindow.scrollTop = 0;
});
