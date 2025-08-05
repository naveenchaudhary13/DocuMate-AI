const sidebar = document.getElementById("sidebar");
const sidebarContent = document.getElementById("sidebarContent");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarLabels = document.querySelectorAll(".sidebar-label");
const toggleIcon = document.getElementById("toggleIcon");
const chatsToggleIcon = document.getElementById("chatsToggleIcon");
const chatsToggleBtn = document.getElementById("chatsToggleBtn");

let expanded = true;

sidebarToggle.addEventListener("click", () => {
	expanded = !expanded;
	if (expanded) {
		if (window.innerWidth <= 320) {
			sidebar.style.width = "10rem";
		} else if (window.innerWidth < 425) {
			sidebar.style.width = "12rem";
		} else {
			sidebar.style.width = "16rem";
		}
		sidebar.style.transition = "width 0.3s ease-in-out";
		sidebarContent.classList.add("px-4");
		sidebarContent.classList.remove("px-2.5");
		chatsToggleIcon.classList.remove("hidden");
		docsToggleIcon.classList.remove("hidden");
		sidebarLabels.forEach((label) => label.classList.remove("hidden"));
		sidebarToggle.style.left = "0";
		sidebarToggle.classList.remove("hover:text-blue-300");
		sidebarToggle.classList.add("hover:text-indigo-200");
		docsList.classList.remove("hidden");
		docsToggleIcon.classList.remove("fa-chevron-up");
		docsToggleIcon.classList.add("fa-chevron-down");
		chatsList.classList.remove("hidden");
		chatsToggleIcon.classList.remove("fa-chevron-up");
		chatsToggleIcon.classList.add("fa-chevron-down");
	} else {
		sidebar.style.width = "4rem";
		sidebar.style.transition = "width 0.3s ease-in-out";
		sidebarContent.classList.remove("px-4");
		sidebarContent.classList.add("px-2.5");
		chatsToggleIcon.classList.add("hidden");
		docsToggleIcon.classList.add("hidden");
		sidebarLabels.forEach((label) => label.classList.add("hidden"));
		sidebarToggle.style.left = "0";
		sidebarToggle.classList.remove("hover:text-indigo-200");
		sidebarToggle.classList.add("hover:text-blue-300");
		chatsList.style.display = "none";
		docsList.style.display = "none";
		docsList.classList.remove("hidden");
		docsToggleIcon.classList.remove("fa-chevron-up");
		docsToggleIcon.classList.add("fa-chevron-down");
		chatsToggleIcon.classList.remove("fa-chevron-up");
		chatsToggleIcon.classList.add("fa-chevron-down");
	}
});

const docsToggleBtn = document.getElementById("docsToggleBtn");
const docsList = document.getElementById("docsList");
const docsToggleIcon = document.getElementById("docsToggleIcon");
let docsExpanded = true;

docsToggleBtn.addEventListener("click", () => {
	docsExpanded = !docsExpanded;
	if (docsExpanded) {
		docsList.classList.remove("hidden");
		docsToggleIcon.classList.remove("fa-chevron-up");
		docsToggleIcon.classList.add("fa-chevron-down");
		docsToggleBtn.setAttribute("aria-expanded", "true");
	} else {
		docsList.classList.add("hidden");
		docsToggleIcon.classList.remove("fa-chevron-down");
		docsToggleIcon.classList.add("fa-chevron-up");
		docsToggleBtn.setAttribute("aria-expanded", "false");
	}
});

function showSuccessModal() {
	document.getElementById("successModal").classList.remove("hidden");
}

function closeSuccessModal() {
	document.getElementById("successModal").classList.add("hidden");
}

function openSignupModal() {
	toggleDropdown();
	document.getElementById("signupModal").classList.remove("hidden");
}

function closeSignupModal() {
	document.getElementById("signupModal").classList.add("hidden");
}

function openLoginModal() {
	toggleDropdown();
	document.getElementById("loginModal").classList.remove("hidden");
}

function closeLoginModal() {
	document.getElementById("loginModal").classList.add("hidden");
}

function openChangePasswordModal() {
	toggleDropdown();
	document.getElementById("changePasswordModal").classList.remove("hidden");
}

function closeChangePasswordModal() {
	document.getElementById("changePasswordModal").classList.add("hidden");
}

function openResetPasswordModal() {
	toggleDropdown();
	document.getElementById("resetPasswordModal").classList.remove("hidden");
}

function closeResetPasswordModal() {
	document.getElementById("resetPasswordModal").classList.add("hidden");
}

function openSetPasswordModal() {
	toggleDropdown();
	document.getElementById("setPasswordModal").classList.remove("hidden");
}
function closeSetPasswordModal() {
	document.getElementById("setPasswordModal").classList.add("hidden");
}

function togglePassword(fieldId, iconElement) {
	const field = document.getElementById(fieldId);
	if (field.type === "password") {
		field.type = "text";
		iconElement.classList.remove("fa-eye");
		iconElement.classList.add("fa-eye-slash");
	} else {
		field.type = "password";
		iconElement.classList.remove("fa-eye-slash");
		iconElement.classList.add("fa-eye");
	}
}

function formatDateTimeIndian(datetimeStr) {
	const date = new Date(datetimeStr);

	const day = `${date.getDate()}`.padStart(2, "0");
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const year = date.getFullYear();

	let hours = date.getHours();
	const minutes = `${date.getMinutes()}`.padStart(2, "0");

	const ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12;
	hours = hours ? hours : 12;
	const formattedHours = `${hours}`.padStart(2, "0");

	return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}

const dropdown = document.getElementById("dropdownMenu");
const wrapper = document.getElementById("userMenuWrapper");

function toggleDropdown() {
	dropdown.classList.toggle("hidden");
}

document.addEventListener("click", function (event) {
	const isClickInside = wrapper.contains(event.target);
	if (!isClickInside) {
		dropdown.classList.add("hidden");
	}
});

window.addEventListener("DOMContentLoaded", function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has("reset_token")) {
		openResetPasswordModal();
	}
});

document.addEventListener("DOMContentLoaded", function () {
	const chatsBtn = document.getElementById("chatsToggleBtn");
	const docsBtn = document.getElementById("docsToggleBtn");
	const chatsList = document.getElementById("chatsList");
	const docsList = document.getElementById("docsList");
	const chatsIcon = document.getElementById("chatsToggleIcon");
	const docsIcon = document.getElementById("docsToggleIcon");
	const newChatBtn = document.getElementById("newChatBtn");

	chatsList.style.display = "none";
	docsList.style.display = "none";
	newChatBtn.classList.remove("text-indigo-600", "bg-white");
	newChatBtn.classList.add(
		"bg-indigo-500",
		"text-white",
		"hover:bg-indigo-600"
	);

	function closeAll() {
		chatsList.style.display = "none";
		docsList.style.display = "none";
		chatsIcon.classList.remove("fa-chevron-up");
		docsIcon.classList.remove("fa-chevron-up");
		chatsIcon.classList.add("fa-chevron-down");
		docsIcon.classList.add("fa-chevron-down");
	}

	chatsBtn.addEventListener("click", function () {
		if (!expanded) return;
		const isOpen = chatsList.style.display === "block";
		closeAll();
		if (!isOpen) {
			chatsList.style.display = "block";
			chatsIcon.classList.remove("fa-chevron-down");
			chatsIcon.classList.add("fa-chevron-up");
		}
	});

	docsBtn.addEventListener("click", function () {
		if (!expanded) return;
		const isOpen = docsList.style.display === "block";
		closeAll();
		if (!isOpen) {
			docsList.style.display = "block";
			docsIcon.classList.remove("fa-chevron-down");
			docsIcon.classList.add("fa-chevron-up");
		}
	});
});

function openChatsModal() {
	toggleDropdown();
	document.getElementById("chatsModal").classList.remove("hidden");
}

function closeChatsModal() {
	document.getElementById("chatsModal").classList.add("hidden");
}

function openDocsModal() {
	toggleDropdown();
	document.getElementById("docsModal").classList.remove("hidden");
}

function closeDocsModal() {
	document.getElementById("docsModal").classList.add("hidden");
}

chatsToggleBtn.addEventListener("click", function () {
	if (!expanded) {
		openChatsModal();
		return;
	}
});

docsToggleBtn.addEventListener("click", function () {
	if (!expanded) {
		openDocsModal();
		return;
	}
});

function selectChat(chatId) {
	loadChatMessages(chatId, false);
	closeChatsModal();
	chatsToggleBtn.classList.remove("text-indigo-600");
	chatsToggleBtn.classList.add("bg-indigo-500", "text-white");

	activeChatId = chatId;

	document.querySelectorAll("[data-chat-id]").forEach((el) => {
		el.classList.remove("bg-indigo-500", "text-white", "hover:bg-indigo-600");
		el.classList.add("bg-white");
	});

	document.querySelectorAll(`[data-chat-id="${chatId}"]`).forEach((el) => {
		el.classList.add("bg-indigo-500", "text-white", "hover:bg-indigo-600");
	});

	const newChatBtn = document.getElementById("newChatBtn");
	if (newChatBtn) {
		newChatBtn.classList.remove(
			"bg-indigo-500",
			"text-white",
			"hover:bg-indigo-600"
		);
		newChatBtn.classList.add("text-indigo-600");
	}
}

window.addEventListener("DOMContentLoaded", () => {
	if (window.innerWidth <= 425) {
		expanded = false;
		sidebar.style.width = "4rem";
		sidebarContent.classList.remove("px-4");
		sidebarContent.classList.add("px-2.5");
		chatsToggleIcon.classList.add("hidden");
		docsToggleIcon.classList.add("hidden");
		chatWindow.classList.remove("px-6", "py-4");
		sidebarLabels.forEach((label) => label.classList.add("hidden"));
		chatsList.style.display = "none";
		docsList.style.display = "none";
		sidebarToggle.classList.remove("hover:text-indigo-200");
		sidebarToggle.classList.add("hover:text-blue-300");
	}
});

function openSearchModal() {
	document.getElementById("searchModal").classList.remove("hidden");
	document.getElementById("searchInput").focus();
}

function closeSearchModal() {
	document.getElementById("searchModal").classList.add("hidden");
	document.getElementById("searchInput").value = "";
	document.getElementById("searchResults").innerHTML =
		'<div class="text-indigo-400 italic">Start typing to search...</div>';
}

function liveSearch(query) {
	if (query.trim() === "") {
		document.getElementById("searchResults").innerHTML =
			'<div class="text-indigo-400 italic">Start typing to search...</div>';
		return;
	}

	const xhr = new XMLHttpRequest();
	xhr.open("GET", "/chat-search/?q=" + encodeURIComponent(query), true);
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4 && xhr.status === 200) {
			const data = JSON.parse(xhr.responseText);
			const resultsContainer = document.getElementById("searchResults");
			resultsContainer.innerHTML = "";

			data.results.chats.forEach((chat) => {
				const item = document.createElement("div");
				const chatsToggleBtn = document.getElementById("chatsToggleBtn");
				item.className =
					"p-2 my-2 bg-white text-start rounded cursor-pointer hover:bg-indigo-500 hover:text-white overflow-x-auto";
				item.innerHTML = `<strong>Chat:</strong> ${chat.name}`;
				item.onclick = () => {
					closeSearchModal();
					chatsToggleBtn.classList.remove("text-indigo-600");
					chatsToggleBtn.classList.add("bg-indigo-500", "text-white");
					loadChatMessages(chat.id, false);
					document.querySelectorAll("[data-chat-id]").forEach((el) => {
						el.classList.remove(
							"bg-indigo-500",
							"text-white",
							"hover:bg-indigo-600"
						);
						el.classList.add("bg-white");
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
				};
				resultsContainer.appendChild(item);
			});

			data.results.messages.forEach((msg) => {
				const item = document.createElement("div");
				item.className =
					"p-2 my-2 bg-white text-start rounded cursor-pointer hover:bg-indigo-500 hover:text-white overflow-x-auto";
				item.innerHTML = `<strong>Message:</strong> ${msg.content}`;
				item.onclick = () => {
					closeSearchModal();
					chatsToggleBtn.classList.remove("text-indigo-600");
					chatsToggleBtn.classList.add("bg-indigo-500", "text-white");
					loadChatMessages(msg.chat__id, false);
					document.querySelectorAll("[data-chat-id]").forEach((el) => {
						el.classList.remove(
							"bg-indigo-500",
							"text-white",
							"hover:bg-indigo-600"
						);
						el.classList.add("bg-white");
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
				};
				resultsContainer.appendChild(item);
			});
		}
	};

	xhr.send();
}

function openManageDocsModal() {
	toggleDropdown();
	document.getElementById("docsManageModal").classList.remove("hidden");
}

function closeManageDocsModal() {
	document.getElementById("docsManageModal").classList.add("hidden");
}

function openManageChatsModal() {
	toggleDropdown();
	document.getElementById("chatsManageModal").classList.remove("hidden");
}

function closeManageChatsModal() {
	document.getElementById("chatsManageModal").classList.add("hidden");
}

let deleteType = null;
let deleteId = null;

function toggleMeta(el) {
	const meta = el.nextElementSibling;
	const icon = el.querySelector("i");
	icon.classList.toggle("fa-chevron-up");
	icon.classList.toggle("fa-chevron-down");
	meta.classList.toggle("hidden");
}

function triggerDelete(type, id) {
	deleteType = type;
	deleteId = id;
	if (type === "chat") {
		document
			.getElementById("confirmChatDeleteModal")
			.classList.remove("hidden");
	} else {
		document.getElementById("confirmDeleteModal").classList.remove("hidden");
	}
}

function confirmDelete(confirm) {
	if (deleteType === "chat") {
		document.getElementById("confirmChatDeleteModal").classList.add("hidden");
	} else {
		document.getElementById("confirmDeleteModal").classList.add("hidden");
	}

	if (!confirm) return;

	fetch(`/delete-${deleteType}/${deleteId}/`, {
		method: "DELETE",
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.status) {
				if (data.docs_html) {
					document.getElementById("docsList").innerHTML = data.docs_html;
					document.getElementById("modalDocsList").innerHTML = data.docs_html;
				}
				if (data.manage_docs_html) {
					document.getElementById("modalManageDocsList").innerHTML =
						data.manage_docs_html;
					closeManageDocsModal();
				}
				if (data.chat) {
					const chatSidebar = document.getElementById(`chat-item-${deleteId}`);
					if (chatSidebar) chatSidebar.remove();
					const chatModal = document.getElementById(
						`modal-chat-item-${deleteId}`
					);
					if (chatModal) chatModal.remove();
					const manageChatModal = document.getElementById(
						`manage-modal-chat-item-${deleteId}`
					);
					if (manageChatModal) manageChatModal.remove();
					const chatWindow = document.getElementById(`chat-window-${deleteId}`);
					const newChatBtn = document.getElementById("newChatBtn");
					const chatsList = document.getElementById("chatsList");
					const chatsIcon = document.getElementById("chatsToggleIcon");
					const chatsBtn = document.getElementById("chatsToggleBtn");
					if (chatWindow) {
						chatWindow.id = "chat-window";
						chatWindow.innerHTML = "";
						chatWindow.innerHTML = `
							<div id="placeholder" class="text-gray-500 text-sm text-center">
								Ask something from your uploaded documents
							</div>`;
						newChatBtn.classList.remove("text-indigo-600");
						newChatBtn.classList.add(
							"bg-indigo-500",
							"text-white",
							"hover:bg-indigo-600"
						);
						chatsList.style.display = "none";
						chatsIcon.classList.remove("fa-chevron-up");
						chatsIcon.classList.add("fa-chevron-down");
						chatsBtn.classList.remove("bg-indigo-500", "text-white");
						chatsBtn.classList.add("text-indigo-600");
						if (!document.querySelector("#chatsList > [id^='chat-item-']")) {
							document.getElementById(
								"chatsList"
							).innerHTML = `<div class="text-indigo-400 italic px-2 py-1">No chats available.</div>`;
						}
						if (
							!document.querySelector(
								"#modalChatsList > [id^='modal-chat-item-']"
							)
						) {
							document.getElementById("modalChatsList").innerHTML =
								'<div class="text-indigo-400 italic">No chats available.</div>';
						}
						if (
							!document.querySelector(
								"#modalManageChatsList > [id^='manage-modal-chat-item-']"
							)
						) {
							document.getElementById("modalManageChatsList").innerHTML =
								'<div class="text-indigo-600 italic text-center">No chats available.</div>';
						}
					}
					closeManageChatsModal();
				}
				Toastify({
					text: "Deleted successfully!",
					duration: 4000,
					close: true,
					gravity: "top",
					position: "center",
					stopOnFocus: true,
					style: {
						background: "linear-gradient(to right, #22c55e, #16a34a)",
					},
					className: "rounded shadow text-md px-3 py-2",
				}).showToast();
			} else {
				Toastify({
					text: "Error processing your request.",
					duration: 4000,
					close: true,
					gravity: "top",
					position: "center",
					stopOnFocus: true,
					style: {
						background: "linear-gradient(to right, #ef4444, #b91c1c)",
					},
					className: "rounded shadow text-md px-3 py-2",
				}).showToast();
			}
		});
}

function openAboutModal() {
	toggleDropdown();
	document.getElementById("aboutModal").classList.remove("hidden");
}

function closeAboutModal() {
	document.getElementById("aboutModal").classList.add("hidden");
}
