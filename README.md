# AspireHub | AI-Powered Learning & System Architect Copilot 🚀

AspireHub is a professional, production-ready AI platform designed to help engineers master system design and context-aware learning. It combines Retrieval-Augmented Generation (RAG) with interactive architectural tools to provide a comprehensive engineering suite.

---

## 🌟 Key Features

### 1. Learning Hub (RAG Engine)
*   **Document-Aware Chat**: Upload PDFs and ask complex questions based on the content.
*   **Vector Intelligence**: Uses ChromaDB and HuggingFace embeddings to retrieve the most relevant context for every query.
*   **Persistent Knowledge**: Documents are processed, chunked, and stored in a vector database for efficient retrieval.

### 2. System Copilot (Architecture Generator)
*   **Structured Blueprints**: Generates detailed system designs including Requirements, HLD, Components, DB Schema, and Scaling strategies.
*   **Live Mermaid Diagrams**: Automatically visualizes architectures with professional, interactive Mermaid.js flowcharts.
*   **Modular UI**: Designs are rendered as high-fidelity "Architectural Cards" for maximum readability.

### 3. Mock Interview Mode
*   **FAANG-Style Training**: Engage in back-and-forth system design interviews with an AI that acts as a senior interviewer.
*   **Iterative Feedback**: The AI drills into your choices, asks about trade-offs, and provides constructive feedback on your design logic.
*   **Dynamic Dialogue**: Maintains conversation history for deep, contextual follow-up questions.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Lightning-fast development)
*   **Styling**: Modern CSS with Glassmorphism and HSL-tailored Dark Mode
*   **Navigation**: [React Router](https://reactrouter.com/) for seamless multi-page experience
*   **Visualization**: [Mermaid.js](https://mermaid-js.github.io/mermaid/) for architectural diagrams
*   **UI Components**: [Lucide React](https://lucide.dev/) icons and [React Markdown](https://github.com/remarkjs/react-markdown)

### Backend
*   **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High-performance Python)
*   **LLM Interface**: [Groq](https://groq.com/) (Using Llama 3.1 8B Instant for sub-second responses)
*   **AI Orchestration**: [LangChain](https://www.langchain.com/) for text splitting and retrieval
*   **Vector Database**: [ChromaDB](https://www.trychroma.com/) for persistent embeddings
*   **PDF Processing**: [PyPDF](https://pypdf.readthedocs.io/) for text extraction

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python 3.10+
*   Groq API Key (Set in `.env`)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/selvadhanush/AspireHub.git
    cd AspireHub
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    ```
    Create a `.env` file in the `backend` folder:
    ```env
    GROQ_API_KEY=your_key_here
    ```

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the App

1.  **Start Backend**
    ```bash
    cd backend
    uvicorn main:app --reload
    ```

2.  **Start Frontend**
    ```bash
    cd frontend
    npm run dev
    ```

---

## 📸 Interface Preview
*   **Sidebar**: Sleek navigation between Learning, Copilot, and Interview modes.
*   **Dark Theme**: Optimized for late-night engineering sessions with vibrant blue accents.
*   **Cards**: Clean, modular components designed for resume-ready presentations.

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for Aspiring Architects**
