
from io import BytesIO
import os

from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from dotenv import load_dotenv
from supabase import create_client
from google import genai
from pydantic import BaseModel
from docx import Document
from openpyxl import load_workbook


# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Supabase credentials are missing. Check your .env file.")

if not GEMINI_API_KEY:
    raise RuntimeError("Gemini API key is missing. Check your .env file.")


# ==========================================
# CONNECT TO SUPABASE AND GEMINI
# ==========================================

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)

client = genai.Client(api_key=GEMINI_API_KEY)

print("Supabase connected successfully!")


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(title="DocuMind AI API")


class ChatRequest(BaseModel):
    question: str


UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# ROOT AND HEALTH CHECK
# ==========================================

@app.get("/")
def root():
    return {
        "message": "DocuMind AI backend is running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "DocuMind AI"
    }


# ==========================================
# UPLOAD DOCUMENT
# ==========================================

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):

    allowed_types = {
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, TXT, DOCX and XLSX files are allowed."
        )

    contents = await file.read()

    safe_filename = Path(file.filename or "document").name
    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    extracted_text = ""
    page_count = 0

    # PDF extraction
    if file.content_type == "application/pdf":

        reader = PdfReader(BytesIO(contents))
        page_count = len(reader.pages)

        for page in reader.pages:
            text = page.extract_text()

            if text:
                extracted_text += text + "\n"

    # DOCX extraction
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":

        doc = Document(BytesIO(contents))

        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                extracted_text += paragraph.text + "\n"

        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(
                    cell.text.strip() for cell in row.cells
                )

                if row_text.strip():
                    extracted_text += row_text + "\n"

    # TXT extraction
    elif file.content_type == "text/plain":

        extracted_text = contents.decode(
            "utf-8",
            errors="ignore"
        )

    # Excel extraction
    elif file.content_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":

        try:
            workbook = load_workbook(
                BytesIO(contents),
                read_only=True,
                data_only=True
            )

            for sheet in workbook.worksheets:

                extracted_text += f"\n\nWorksheet: {sheet.title}\n"

                for row in sheet.iter_rows(values_only=True):

                    row_values = [
                        str(value) if value is not None else ""
                        for value in row
                    ]

                    if any(value.strip() for value in row_values):
                        extracted_text += " | ".join(row_values) + "\n"

            workbook.close()

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not read Excel file: {str(e)}"
            )

    # Save document in Supabase
    try:
        result = supabase.table("documents").insert({
            "filename": safe_filename,
            "content_type": file.content_type,
            "file_size": len(contents),
            "file_path": str(file_path),
            "extracted_text": extracted_text,
            "page_count": page_count,
            "status": "processed" if extracted_text else "uploaded"
        }).execute()

        return {
            "message": "Document uploaded and saved successfully",
            "filename": safe_filename,
            "pages": page_count,
            "characters": len(extracted_text),
            "database_saved": True
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save document: {str(e)}"
        )


# ==========================================
# EXTRACT PDF DOCUMENT
# ==========================================

@app.post("/api/documents/extract")
async def extract_document(file: UploadFile = File(...)):

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported for extraction."
        )

    contents = await file.read()

    temp_path = UPLOAD_DIR / f"temp_{Path(file.filename or 'document.pdf').name}"

    with open(temp_path, "wb") as buffer:
        buffer.write(contents)

    try:
        reader = PdfReader(temp_path)

        extracted_text = ""

        for page in reader.pages:
            text = page.extract_text()

            if text:
                extracted_text += text + "\n"

        return {
            "filename": file.filename,
            "pages": len(reader.pages),
            "text": extracted_text,
            "characters": len(extracted_text),
            "status": "extracted"
        }

    finally:
        if temp_path.exists():
            temp_path.unlink()


# ==========================================
# GET ALL DOCUMENTS
# ==========================================

@app.get("/api/documents")
def get_documents():

    try:
        result = (
            supabase.table("documents")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return result.data or []

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch documents: {str(e)}"
        )


# ==========================================
# DELETE DOCUMENT
# ==========================================

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str):

    try:
        result = (
            supabase.table("documents")
            .select("*")
            .eq("id", document_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        document = result.data[0]
        file_path = document.get("file_path")

        # Delete only files inside the uploads folder
        if file_path:
            path = Path(file_path).resolve()
            upload_folder = UPLOAD_DIR.resolve()

            try:
                path.relative_to(upload_folder)

                if path.is_file():
                    path.unlink()

            except ValueError:
                pass

        # Delete Supabase database record
        supabase.table("documents").delete().eq(
            "id", document_id
        ).execute()

        return {
            "message": "Document deleted successfully",
            "document_id": document_id
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )


# ==========================================
# AI ASSISTANT - DOCUMENT ANALYSIS
# ==========================================

@app.post("/api/chat")
def chat_with_ai(request: ChatRequest):

    try:
        question = (request.question or "").strip()

        if not question:
            return {
                "answer": "Please enter a question."
            }

        # Get all processed documents
        result = (
            supabase.table("documents")
            .select("filename, extracted_text")
            .eq("status", "processed")
            .execute()
        )

        documents = result.data or []

        if not documents:
            return {
                "answer": "No processed documents are available. Please upload a document first."
            }

        # Prepare document context
        document_context = ""
        total_limit = 50000

        per_document_limit = max(
            3000,
            total_limit // len(documents)
        )

        for index, doc in enumerate(documents, start=1):

            filename = doc.get("filename") or "Untitled document"
            extracted_text = doc.get("extracted_text") or ""

            if not extracted_text.strip():
                continue

            document_text = extracted_text[:per_document_limit]

            document_context += (
                f"\n\n========== DOCUMENT {index} ==========\n"
                f"FILENAME: {filename}\n"
                f"CONTENT:\n{document_text}\n"
                f"========== END DOCUMENT {index} ==========\n"
            )

            if len(document_context) >= total_limit:
                document_context = document_context[:total_limit]
                break

        if not document_context.strip():
            return {
                "answer": "No readable text was found in the processed documents."
            }

        # Gemini prompt
        prompt = f"""
You are DocuMind AI, an intelligent document analysis assistant.

YOUR MAIN JOB:
Understand the user's intention and answer questions using uploaded documents.

IMPORTANT INSTRUCTIONS:

1. NEVER require the user to type the exact document filename.

2. Understand natural language, short questions, incomplete sentences,
   spelling mistakes, typing mistakes and informal English.

3. Understand the meaning of the user's question even if they type
   only one or two words.

4. Match the user's question to relevant documents by understanding
   their meaning, filenames and actual document contents.

5. Automatically select the most relevant document or documents.

6. If the user asks about a particular month, product, supplier,
   expense, component or project, find the relevant information
   across the available document contents.

7. If the user types a short request such as "shortlist",
   "summary", "total", "compare" or "details",
   make the best reasonable interpretation using the available documents.

8. If multiple documents are relevant, use the relevant ones.
   Do not mix unrelated information.

9. Use only information supported by the document contents.

10. Never invent prices, quantities, suppliers, part numbers,
    dates or specifications.

11. For Excel documents, carefully analyze worksheet data,
    headings, descriptions, quantities and values.

12. If information is missing, clearly mention that it is unavailable.

13. For general greetings or conversational questions,
    respond naturally without forcing document analysis.

14. Mention the filename or filenames used when providing
    a document-based answer.

15. Give clear, structured and useful answers.
    Use headings, tables or bullet points when appropriate.

AVAILABLE DOCUMENT CONTENT:
{document_context}

USER QUESTION:
{question}

Understand the user's intention, identify the most relevant
document content and provide the best accurate answer.

Do not ask for the exact filename.
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        answer = response.text or (
            "I couldn't generate an answer. Please try asking again."
        )

        return {
            "answer": answer
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini request failed: {str(e)}"
        )


# ==========================================
# PROJECT API - GET ALL PROJECTS
# ==========================================

@app.get("/api/projects")
def get_projects():

    try:
        result = (
            supabase.table("projects")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return result.data or []

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch projects: {str(e)}"
        )


# ==========================================
# PROJECT API - CREATE PROJECT
# ==========================================

@app.post("/api/projects")
def create_project(project: dict):

    try:
        name = (project.get("name") or "").strip()
        description = (project.get("description") or "").strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Project name is required"
            )

        result = (
            supabase.table("projects")
            .insert({
                "name": name,
                "description": description
            })
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Project could not be created"
            )

        return result.data[0]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create project: {str(e)}"
        )


# ==========================================
# ADD DOCUMENT TO PROJECT
# ==========================================

@app.post("/api/projects/{project_id}/documents/{document_id}")
def add_document_to_project(
    project_id: str,
    document_id: str
):

    try:
        project = (
            supabase.table("projects")
            .select("id")
            .eq("id", project_id)
            .execute()
        )

        if not project.data:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

        document = (
            supabase.table("documents")
            .select("id")
            .eq("id", document_id)
            .execute()
        )

        if not document.data:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        result = (
            supabase.table("documents")
            .update({
                "project_id": project_id
            })
            .eq("id", document_id)
            .execute()
        )

        return {
            "message": "Document added to project successfully",
            "data": result.data
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add document to project: {str(e)}"
        )


# ==========================================
# API STARTUP
# ==========================================

print("DocuMind AI API is ready!")
