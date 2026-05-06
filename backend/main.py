from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from pydantic import BaseModel
import io
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from pydantic import BaseModel
import io
import os
from groq import AsyncGroq
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = AsyncGroq(
    api_key=os.getenv("GROQ_API_KEY")
)

class AskRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/ask")
async def ask_question(request: AskRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
    
    try:
        # 1. Retrieve relevant chunks from Chroma DB
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Load the existing database
        try:
            vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
            results = vectorstore.similarity_search(request.prompt, k=3)
            context = "\\n\\n".join([doc.page_content for doc in results])
        except Exception:
            # Fallback if DB doesn't exist yet or is empty
            context = ""
            
        # 2. Construct context-aware prompt
        if context:
            system_prompt = "You are a helpful AI assistant. Answer the user's question based ONLY on the following context. If the answer is not in the context, say 'I don't have enough information to answer that based on the uploaded documents.'\\n\\nContext:\\n" + context
        else:
            system_prompt = "You are a helpful AI assistant."

        # 3. Send to LLM
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.prompt}
            ]
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    try:
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        extracted_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
        
        # Clean the text (remove excessive newlines/spaces)
        clean_text = " ".join(extracted_text.split())
        
        if not clean_text:
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

        # 2. Split Text into Chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(clean_text)

        # 3. Generate Embeddings & Store in Vector DB (ChromaDB)
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vectorstore = Chroma.from_texts(
            texts=chunks, 
            embedding=embeddings, 
            persist_directory="./chroma_db"
        )
        
        return {
            "message": "Data stored in vector DB",
            "filename": file.filename,
            "chunks_created": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

class DesignRequest(BaseModel):
    prompt: str

@app.post("/copilot/design")
async def generate_system_design(request: DesignRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
    
    try:
        # Retrieve relevant chunks from Chroma DB (optional RAG for system design docs)
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        try:
            vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
            results = vectorstore.similarity_search(request.prompt, k=3)
            context = "\n\n".join([doc.page_content for doc in results])
        except Exception:
            context = ""
            
        system_prompt = (
            "You are an expert system design architect. Your task is to generate a comprehensive system design based on the user's request. "
            "You MUST use Markdown formatting for your response. Specifically:\n"
            "- Use '###' for each major section header (e.g., ### 1. Requirements).\n"
            "- Use bold text for key terms.\n"
            "- Use code blocks for DB schemas or API examples.\n"
            "- In the HLD section, you MUST include a Mermaid diagram using a '```mermaid' block (use graph TD).\n"
            "- IMPORTANT: In Mermaid diagrams, ALWAYS wrap node labels in double quotes if they contain spaces or special characters (e.g., A[\"API Gateway\"]). Avoid using parentheses inside labels.\n"
            "- Use bullet points for lists.\n\n"
            "Structure your response strictly with these sections:\n"
            "1. Requirements\n"
            "2. HLD (High-Level Design with Mermaid Diagram)\n"
            "3. Components\n"
            "4. DB (Database schema and choice)\n"
            "5. APIs (Key endpoints)\n"
            "6. Scaling (Strategies for scaling the system)\n\n"
        )
        if context:
            system_prompt += f"Use the following provided context to inform your design if relevant:\n\nContext:\n{context}"

        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.prompt}
            ]
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class InterviewRequest(BaseModel):
    messages: list

@app.post("/copilot/interview")
async def system_design_interview(request: InterviewRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
    
    try:
        system_prompt = (
            "You are an expert system design interviewer at a top-tier tech company (FAANG). "
            "Your goal is to conduct a realistic system design interview. "
            "1. Start by asking the candidate what system they would like to design if they haven't picked one.\n"
            "2. Drill down into Functional and Non-functional requirements.\n"
            "3. Ask about High-Level Design, Bottlenecks, and Scaling strategies.\n"
            "4. Provide constructive feedback on their answers.\n"
            "Keep your responses concise and focused on one or two questions at a time to keep the interaction dynamic."
        )

        messages = [{"role": "system", "content": system_prompt}] + request.messages

        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
