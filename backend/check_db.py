from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import warnings
warnings.filterwarnings("ignore")

print("Loading Chroma DB...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

count = vectorstore._collection.count()
print(f"Successfully connected to Chroma DB!")
print(f"Total chunks of text stored: {count}")

if count > 0:
    print("Here is a peek at one of the text chunks stored in the database:\\n")
    data = vectorstore._collection.peek(1)
    if 'documents' in data and data['documents']:
        print(f"Extract: {data['documents'][0][:200]}...")
