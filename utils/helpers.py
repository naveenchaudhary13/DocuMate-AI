import os, json, re, openpyxl, docx
from PyPDF2 import PdfReader
from PyPDF2.errors import PdfReadError
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage
from agent.models import Agent, Document, DocumentChunk, Chat, ChatMessage
from pgvector.django import L2Distance
from django.db import transaction


def get_embedding_model():
    from langchain.embeddings import HuggingFaceEmbeddings
    return HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-MiniLM-L3-v2")


def get_llm_instance():
    """LLM instance."""
    from agent.models import Agent
    agent = Agent.objects.first()
    if not agent:
        raise ValueError("Agent not found. Please check post_migrate signal.")
    
    return ChatGroq(
        model="meta-llama/llama-4-maverick-17b-128e-instruct",
        api_key=agent.api_key,
        temperature=0.0,
        max_retries=2,
    )


def update_agent_from_metadata(meta):
    """Update agent model with metadata."""
    agent = Agent.objects.first()
    if agent:
        usage = meta.get("token_usage", {})
        agent.total_input_tokens += usage.get("prompt_tokens", 0)
        agent.total_output_tokens += usage.get("completion_tokens", 0)
        agent.total_tokens += usage.get("total_tokens", 0)
        agent.model_name = meta.get("model_name", "")
        agent.system_fingerprint = meta.get("system_fingerprint", "")
        agent.service_tier = meta.get("service_tier", "")
        agent.save()
        

def update_profile_from_metadata(profile, meta):
    """Update profile with token usage from metadata."""
    usage = meta.get("token_usage", {})
    profile.total_input_tokens += usage.get("prompt_tokens", 0)
    profile.total_output_tokens += usage.get("completion_tokens", 0)
    profile.total_tokens += usage.get("total_tokens", 0)
    profile.save()
    

def extract_text(file, filename):
    """Extract text from a file."""
    ext = os.path.splitext(filename)[1].lower()
    file.seek(0)

    if ext == ".pdf":
        return extract_text_from_pdf(file)
    elif ext == ".txt":
        return extract_text_from_txt(file)
    elif ext in [".docx"]:
        return extract_text_from_docx(file)
    elif ext in [".xlsx"]:
        return extract_text_from_xlsx(file)
    else:
        return None
    
    
def extract_text_from_pdf(file):
    """Extract text from a PDF file."""
    try:
        reader = PdfReader(file)
        text = ""

        for page in reader.pages:
            page_content = page.extract_text() or ''
            text += page_content

        print(f"Text successfully extracted from PDF file")
        return text
    except PdfReadError:
        return "PDF could not be read properly."


def extract_text_from_txt(file):
    """Extract text from a TXT file."""
    print(f"Text successfully extracted from TXT file")
    return file.read().decode("utf-8")


def extract_text_from_docx(file):
    """Extract text from a DOCX file."""
    doc = docx.Document(file)
    print(f"Text successfully extracted from DOCX file")
    return "\n".join([para.text for para in doc.paragraphs])


def extract_text_from_xlsx(file):
    """Extract text from an XLSX file."""
    wb = openpyxl.load_workbook(file, read_only=True)
    text = []
    for sheet in wb.worksheets:
        for row in sheet.iter_rows(values_only=True):
            row_text = " ".join([str(cell) if cell is not None else '' for cell in row])
            text.append(row_text)

    print(f"Text successfully extracted from XLSX file")
    return "\n".join(text)


def chunk_text(text, chunk_size=800):
    """Split text into chunks."""
    text = re.sub(r'\s+', ' ', text).strip()
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]


def create_document_entry(profile, file_obj):
    """Create a Document instance and populate metadata"""
    original_name = os.path.basename(file_obj.name)
    base_name, ext = os.path.splitext(original_name)
    ext = ext.lower()
    
    existing_files = Document.objects.filter(
        profile=profile,
        name__startswith=base_name
    ).values_list("name", flat=True)
    
    new_name = original_name
    counter = 1
    while new_name in existing_files:
        new_name = f"{base_name}_{counter}{ext}"
        counter += 1
    
    with transaction.atomic():
        return Document.objects.create(
            profile=profile,
            file=file_obj,
            name=new_name,
            file_type=ext.replace(".", ""),
            file_size=file_obj.size,
        )


def save_chunks_with_embeddings(document, text, page_map=None):
    """Save chunks with embeddings."""
    embedding_model = get_embedding_model()
    chunks = chunk_text(text)
    with transaction.atomic():
        for index, chunk in enumerate(chunks):
            vector = embedding_model.embed_query(chunk)
            DocumentChunk.objects.create(
                document=document,
                content=chunk,
                embedding=vector,
                chunk_index=index,
                page_number=page_map.get(chunk) if page_map else None
            )


def search_similar_chunk(query):
    """Search for similar chunks."""
    embedding_model = get_embedding_model()
    query_embedding = embedding_model.embed_query(query)

    result = (
        DocumentChunk.objects
        .annotate(distance=L2Distance('embedding', query_embedding))
        .order_by('distance').first()
    )
    return result


def clean_llm_json(content):
    """Extracts only the JSON part from messy LLM responses."""
    try:
        json_match = re.search(r'\{(?:.|\n)*?\}', content)
        if json_match:
            return json_match.group(0).strip()
    except Exception as e:
        print("Regex JSON extraction error:", e)

    return content.strip()


def build_prompt(user_query, chunk, profile):
    """Build prompt for LLM."""
    doc_count = Document.objects.filter(profile=profile).count()
    doc_info = f"""
            Document Name: {chunk.document.name}\n\n
            Document Content: {chunk.content}\n\n
            Total Documents Uploaded: {doc_count}\n\n
        """
    chats = Chat.objects.filter(profile=profile).order_by('-created_at')
    all_chat_names = [chat.name for chat in chats]
    chat_info = "No Chat Names Currently Available"

    if all_chat_names:
        chat_info = f"Previous Chat Names(comma seperated): {', '.join(all_chat_names)}\n\n"

    messages = [
        SystemMessage(content="""
            **Introduction:**
                You are DocuMate AI — an intelligent assistant that answers queries based on document content. You were developed by Naveen Chaudhary on 13/07/2025.
            
            **Instructions:**
                Whenever a user's prompt is a greeting (like 'hi', 'hello', 'namaste', etc.) or asks about you (such as 'who are you?', 'what is your name?', or 'who developed you?'), introduce yourself, mention your name (DocuMate AI), your developer and creation date, and explain your role as a document-based AI assistant.
                For all other queries, answer concisely and strictly based on the document content. Do not provide any other information other than the document content if users query is not matching with the document content then tell me that - "Sorry, I couldn't provide any other information, I'm just a document-based AI assistant which answers queries based on document content.(share your introduction)".
            
            **Previous Chat Names:**
                {chat_info}
            
            **Document Information:**
                {doc_info}
            
            **Your Role:**
                Your job is to provide concise, helpful answers based only on the provided document information and mention document name if required.
                Also, generate a short chat title (3-5 words) that summarizes the topic but generates a unique name which is not present in the list of previous chat names check from previous chat names.
            
            **Strict Output Format:**
                You must return a single, valid JSON object only — without any explanation, markdown, or additional text.
                Example format:
                {
                    "chat_title": "Short Relevant Title",
                    "answer": "Concise and helpful answer based only on the document content."
                }

                ⚠️ Do NOT wrap the JSON in markdown (like ```json), and do NOT add any notes or text outside the JSON object.
                
            **Example Response:**
                {
                    "chat_title": "Chat Title",
                    "answer": "Answer to user's query"
                }
            """
        ),
        HumanMessage(content=f"""
            ❓ User Question: {user_query}
            📚 Relevant Documents: {doc_info}
            🗨️ Previous Chats: {chat_info}
            """
        )
    ]

    return messages


def generate_answer_with_llm(profile, query, chunk, chat=None):
    """Generate answer with LLM."""
    llm = get_llm_instance()
    messages = build_prompt(query, chunk, profile)
    result = llm.invoke(messages)
    cleaned_content = clean_llm_json(result.content)
    chat_title = "Untitled Chat"
    
    try:
        data = json.loads(cleaned_content)
        chat_title = data.get("chat_title", chat_title)
        result.content = data.get("answer", result.content)
    except json.JSONDecodeError as e:
        print("JSON Decode Error after cleaning:", e)
        return "Sorry, I couldn't understand the AI response.", chat

    if chat is None:
        chat = Chat.objects.create(profile=profile, name=chat_title)

    ChatMessage.objects.create(chat=chat, is_user=True, content=query)

    ChatMessage.objects.create(
        chat=chat,
        is_user=False,
        content=data.get("answer", "")
    )

    return result, chat
