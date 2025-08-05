from django.urls import path
from agent.views import upload_file, search_docs, chat_search, delete_doc, delete_chat, custom_logout, CustomPasswordChangeView, CustomSetPasswordView, CustomLoginView, CustomSignupView, get_user_chats, get_chat_messages


urlpatterns = [
    path('get-user-chats/', get_user_chats, name='get_user_chats'),
    path('get-chat-messages/<int:chat_id>/', get_chat_messages, name='get_chat_messages'),
    path('', upload_file, name='upload_file'),
    path('search/', search_docs, name='search_docs'),
    path("chat-search/", chat_search, name="chat_search"),
    path('delete-doc/<int:doc_id>/', delete_doc, name='delete_doc'),
    path('delete-chat/<int:chat_id>/', delete_chat, name='delete_chat'),
    path('logout/', custom_logout, name='custom_logout'),
    path('login/', CustomLoginView.as_view(), name='custom_login'),
    path('signup/', CustomSignupView.as_view(), name='custom_signup'),
    path('password/change/', CustomPasswordChangeView.as_view(), name='custom_change_password'),
    path('password/set/', CustomSetPasswordView.as_view(), name='custom_set_password'),
]
