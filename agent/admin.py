from django.contrib import admin
from agent.models import Agent, Profile, Document, DocumentChunk, DocumentDeletionLog, Chat, ChatMessage


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ['name', 'total_tokens', 'total_input_tokens', 'total_output_tokens', 'service_tier', 'updated_at']
    

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['ip_address', 'username', 'email', 'city', 'region', 'country', 'browser', 'os', 'device_type', 'is_bot', 'total_tokens', 'first_visited_at', 'last_visited_at']
    search_fields = ['ip_address', 'username', 'email', 'city', 'region', 'country', 'browser', 'os', 'device_type', 'is_bot']
    list_filter = ['first_visited_at', 'last_visited_at', 'country', 'device_type', 'is_bot']
    ordering = ['-last_visited_at', 'username']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'file_type', 'file_size', 'uploaded_at']
    search_fields = ['name', 'file_type', 'uploaded_at']
    list_filter = ['uploaded_at', 'file_type']
    ordering = ['-uploaded_at', 'name']
    

@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ['document', 'chunk_index']
    search_fields = ['content', 'chunk_index']
    list_filter = ['document', 'chunk_index']
    ordering = ['document', 'chunk_index']
    
    
@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['profile', 'name', 'created_at']
    search_fields = ['name', 'created_at']
    list_filter = ['created_at', 'profile']
    ordering = ['-created_at', 'name']
    
    
@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['chat', 'is_user', 'created_at']
    search_fields = ['content', 'created_at']
    list_filter = ['is_user', 'created_at']
    ordering = ['-created_at', 'is_user']
    
    
@admin.register(DocumentDeletionLog)
class DocumentDeletionLogAdmin(admin.ModelAdmin):
    list_display = ['document_name', 'profile', 'file_size', 'deleted_at']
    search_fields = ['document_name', 'profile__user__username']
    list_filter = ['deleted_at']
    ordering = ['-deleted_at']