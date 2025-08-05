from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from allauth.account.forms import SignupForm, LoginForm, ChangePasswordForm, ResetPasswordForm, SetPasswordForm
from allauth.account.views import PasswordChangeView, LoginView, SignupView, PasswordSetView, PasswordResetView
from utils.helpers import (
    extract_text,
    save_chunks_with_embeddings,
    create_document_entry,
    search_similar_chunk,
    generate_answer_with_llm,
    update_agent_from_metadata,
    update_profile_from_metadata
)
from utils.ip_process import background_visitor_logger, get_client_ip
from agent.models import Agent, Document, Profile, Chat, ChatMessage


def get_user_chats(request):
    profile = None
    if request.user.is_authenticated:
        profile = Profile.objects.filter(user=request.user).first()
    else:
        ip = get_client_ip(request)
        profile = Profile.objects.filter(ip_address=ip).first()

    chats = Chat.objects.filter(profile=profile).order_by('-updated_at')
    chat_data = [{"id": chat.id, "name": chat.name, "updated_at": chat.updated_at, "created_at": chat.created_at, "messages": f"{chat.messages.all().count()}"} for chat in chats]
    return JsonResponse({"chats": chat_data})


def get_chat_messages(request, chat_id):
    messages = ChatMessage.objects.filter(chat_id=chat_id).order_by("created_at")
    response_data = [
        {
            "message": msg.content,
            "from_user": msg.is_user
        }
        for msg in messages
    ]
    return JsonResponse({"messages": response_data})


@csrf_exempt
def upload_file(request):
    agent = Agent.objects.first()
    if agent.api_key == '':
        messages.error(request, "Please set your Groq API key in the Agent Model using the admin panel page.")
        return render(request, 'home.html')
    background_visitor_logger(request)
    profile = None
    if request.user.is_authenticated:
        profile = Profile.objects.filter(user=request.user).first()
    else:
        ip = get_client_ip(request)
        profile = Profile.objects.filter(ip_address=ip).first()
    if request.method == 'POST' and request.FILES.getlist('file[]'):
        for uploaded_file in request.FILES.getlist('file[]'):
            if Document.objects.filter(profile=profile, name=uploaded_file.name, file_size=uploaded_file.size).exists():
                return JsonResponse({"error": f"Document with the same name and size already exists - {uploaded_file.name}."})
            if Document.objects.filter(profile=profile).count() > 20:
                return JsonResponse({"error": "You have reached the maximum limit of 20 documents."})
            file_name = uploaded_file.name.lower()
            text = extract_text(uploaded_file, file_name)

            if text is None:
                return JsonResponse({"error": f"Unable to extract text from the file - {file_name}."})
            
            if not text.strip():
                return JsonResponse({"error": f"No readable text found in the file - {file_name}."})
        
            document = create_document_entry(profile, uploaded_file)
            save_chunks_with_embeddings(document, text)
            
        documents = Document.objects.order_by('-uploaded_at')
        docs_html = render_to_string('partials/document_list.html', {'documents': documents})
        manage_docs_html = render_to_string('partials/manage_doc_list.html', {'documents': documents})
        return JsonResponse({'success': 'Files uploaded successfully!', 'docs_html': docs_html, 'manage_docs_html': manage_docs_html})
    
    documents = Document.objects.filter(profile=profile).order_by('-uploaded_at')
    chats = Chat.objects.filter(profile=profile).order_by('-updated_at')
    context = {
        "documents": documents,
        "chats": chats,
        "login_form": LoginForm(), 
        "signup_form": SignupForm(), 
        "change_password_form": ChangePasswordForm(), 
        "reset_password_form": ResetPasswordForm(),
        "set_password_form": SetPasswordForm(),
    }
    return render(request, 'home.html', context)


@csrf_exempt
def search_docs(request):
    profile = None
    if request.user.is_authenticated:
        profile = Profile.objects.filter(user=request.user).first()
    else:
        ip = get_client_ip(request)
        profile = Profile.objects.filter(ip_address=ip).first()
        
    if not Document.objects.filter(profile=profile).exists():
        return JsonResponse({
            "error": (
                "👋 Hi! I’m DocuMate AI — your smart assistant, created by Naveen Chaudhary on 13/07/2025.\n"
                "I answer questions based on your uploaded documents, but it looks like you haven’t uploaded any yet.\n"
                "📄 Please upload a document so I can help you accurately. I’ll be ready as soon as you do! 😊"
            )
        })

    query = request.GET.get('q', '')
    chat_id = request.GET.get('chat_id')
    chat = Chat.objects.filter(id=chat_id, profile=profile).first() if chat_id else None
    result = []
    final_answer = ''

    if query:
        result = search_similar_chunk(query)
        if result:
            final_answer, chat = generate_answer_with_llm(profile, query, result, chat)
            if hasattr(final_answer, "response_metadata"):
                update_agent_from_metadata(final_answer.response_metadata)
                update_profile_from_metadata(profile, final_answer.response_metadata)

    return JsonResponse({
        'answer': final_answer.content,
        'chat_id': chat.pk,
        'chat_title': chat.name
    })


@csrf_exempt
def chat_search(request):
    query = request.GET.get("q", "").strip()
    data = {"chats": [], "messages": []}
    profile = None
    if request.user.is_authenticated:
        profile = Profile.objects.filter(user=request.user).first()
    else:
        ip = get_client_ip(request)
        profile = Profile.objects.filter(ip_address=ip).first()

    if query:
        chats = Chat.objects.filter(name__icontains=query, profile=profile).values("id", "name", "updated_at")[:5]
        messages = ChatMessage.objects.filter(content__icontains=query, chat__profile=profile).select_related("chat").values("id", "content", "chat__id", "chat__name", "created_at")[:5]

        data["chats"] = list(chats)
        data["messages"] = list(messages)

    return JsonResponse({"status": True, "results": data})


@csrf_exempt
def delete_doc(request, doc_id):
    if request.method == 'DELETE':
        try:
            Document.objects.get(id=doc_id).delete()
            documents = Document.objects.order_by('-uploaded_at')
            docs_html = render_to_string('partials/document_list.html', {'documents': documents})
            manage_docs_html = render_to_string('partials/manage_doc_list.html', {'documents': documents})
            return JsonResponse({'status': True, 'docs_html': docs_html, 'manage_docs_html': manage_docs_html})
        except Document.DoesNotExist:
            return JsonResponse({'status': False, 'error': 'Doc not found'})
    return JsonResponse({'status': False, 'error': 'Invalid method'})


@csrf_exempt
def delete_chat(request, chat_id):
    if request.method == 'DELETE':
        try:
            Chat.objects.get(id=chat_id).delete()
            return JsonResponse({'status': True, 'chat': True})
        except Chat.DoesNotExist:
            return JsonResponse({'status': False, 'error': 'Chat not found'})
    return JsonResponse({'status': False, 'error': 'Invalid method'})


def custom_logout(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return redirect('/')
    

class CustomLoginView(LoginView):
    template_name = 'home.html'
    form_class = LoginForm
    success_url = '/'

    def form_invalid(self, form):
        error_message = list(form.errors.values())[0][0]
        messages.error(self.request, error_message)
        context = self.get_context_data(login_form=form)
        context.update({
            "signup_form": SignupForm(),
            "change_password_form": ChangePasswordForm(),
            "reset_password_form": ResetPasswordForm(),
            "set_password_form": SetPasswordForm(),
            "documents": Document.objects.all().order_by('-uploaded_at')
        })
        return render(self.request, self.template_name, context)
    
    
class CustomSignupView(SignupView):
    template_name = 'home.html'
    form_class = SignupForm
    success_url = '/'

    def form_invalid(self, form):
        error_message = list(form.errors.values())[0][0]
        messages.error(self.request, error_message)
        context = self.get_context_data(signup_form=form)
        context.update({
            "login_form": LoginForm(),
            "change_password_form": ChangePasswordForm(),
            "reset_password_form": ResetPasswordForm(),
            "set_password_form": SetPasswordForm(),
            "documents": Document.objects.all().order_by('-uploaded_at')
        })
        return render(self.request, self.template_name, context)
    
    
class CustomPasswordChangeView(PasswordChangeView):
    template_name = 'home.html'
    form_class = ChangePasswordForm
    success_url = '/'

    def form_invalid(self, form):
        error_message = list(form.errors.values())[0][0]
        messages.error(self.request, error_message)
        context = self.get_context_data(change_password_form=form)
        context.update({
            "login_form": LoginForm(),
            "signup_form": SignupForm(),
            "reset_password_form": ResetPasswordForm(),
            "set_password_form": SetPasswordForm(),
            "documents": Document.objects.all().order_by('-uploaded_at')
        })
        return render(self.request, self.template_name, context)
    
    
class CustomSetPasswordView(PasswordSetView):
    template_name = 'home.html'
    form_class = SetPasswordForm
    success_url = '/'
    
    def form_invalid(self, form):
        error_message = list(form.errors.values())[0][0]
        messages.error(self.request, error_message)
        context = self.get_context_data(reset_password_form=form)
        context.update({
            "login_form": LoginForm(),
            "signup_form": SignupForm(),
            "change_password_form": ChangePasswordForm(),
            "reset_password_form": ResetPasswordForm(),
            "documents": Document.objects.all().order_by('-uploaded_at')
        })
        return render(self.request, self.template_name, context)