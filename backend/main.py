from fastapi import FastAPI, HTTPException, UploadFile, File
from pypdf import PdfReader
from pydantic import BaseModel
import io
import os
from groq import AsyncGroq
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

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
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant", # Default Groq model
            messages=[
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
        
        return {
            "message": "PDF text successfully extracted",
            "filename": file.filename,
            "text": clean_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")
