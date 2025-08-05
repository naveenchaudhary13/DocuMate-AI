from django.db.models.signals import post_migrate, pre_delete
from allauth.account.signals import user_signed_up
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.db import transaction
from allauth.socialaccount.signals import pre_social_login
from agent.models import Agent, Profile, Document, DocumentDeletionLog
from utils.ip_process import get_client_ip
import os
from dotenv import load_dotenv

load_dotenv()


@receiver(post_migrate)
def create_default_agent(sender, **kwargs):
    if not Agent.objects.filter(name='DocuMate AI Agent').exists():
        Agent.objects.create(
            name='DocuMate AI Agent',
            api_key=os.getenv('GROQ_API_KEY'),
        )
        print("✅ Default DocuMate AI Agent created successfully!")


@receiver(user_logged_in)
def assign_profile_on_login(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    
    try:
        ip_profile = Profile.objects.get(ip_address=ip)
    except Profile.DoesNotExist:
        ip_profile = None
        
    if ip_profile:
        with transaction.atomic():
            ip_profile.user = user
            ip_profile.email = user.email
            ip_profile.username = user.username
            ip_profile.first_name = user.first_name
            ip_profile.last_name = user.last_name
            ip_profile.save()
        print(f"🗑️ [LOGIN] Anonymous profile merged and deleted")
        

@receiver(user_signed_up)
def assign_profile_on_signup(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    try:
        profile = Profile.objects.get(ip_address=ip, user__isnull=True)
        profile.user = user
        profile.email = user.email
        profile.username = user.username
        profile.first_name = user.first_name
        profile.last_name = user.last_name
        profile.save()
        print(f"✅ [SIGNUP] Profile linked to new user {user.username}")
    except Profile.DoesNotExist:
        print("❌ [SIGNUP] No unlinked profile found for IP:", ip)


@receiver(pre_social_login)
def handle_social_login(sender, request, sociallogin, **kwargs):
    user = sociallogin.user
    ip = get_client_ip(request)

    if not user.id:
        return

    try:
        ip_profile = Profile.objects.get(ip_address=ip)
    except Profile.DoesNotExist:
        ip_profile = None

    if ip_profile:
        with transaction.atomic():
            ip_profile.user = user
            ip_profile.email = user.email
            ip_profile.username = user.username
            ip_profile.first_name = user.first_name
            ip_profile.last_name = user.last_name
            ip_profile.save()
        print(f"🔄 [SOCIAL LOGIN] Merged anonymous profile to user {user.username}")


@receiver(pre_delete, sender=Document)
def delete_document_and_log(sender, instance, **kwargs):
    file_path = instance.file.path
    DocumentDeletionLog.objects.create(
        profile=instance.profile,
        document_name=instance.name,
        file_path=file_path,
        file_type=instance.file_type,
        file_size=instance.file_size,
    )
    if os.path.isfile(file_path):
        os.remove(file_path)
        print(f"🗑️ [DELETE] Document {instance.name} deleted")
    