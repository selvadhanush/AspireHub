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
