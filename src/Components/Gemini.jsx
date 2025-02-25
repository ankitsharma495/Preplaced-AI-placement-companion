import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import Loading from "./Loading";
import { allowedTopics } from "../Data";

const API_KEY = import.meta.env.VITE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function generateResponse(prompt, subjectName) {
  console.log(`🔍 Checking Allowed Topics for: ${subjectName}`);
  console.log("Allowed Topics:", allowedTopics[subjectName]);

  const lowerPrompt = prompt.toLowerCase();
  const isTopicAllowed = allowedTopics[subjectName]?.some((topic) =>
    lowerPrompt.includes(topic.toLowerCase())
  );

  if (!isTopicAllowed) {
    console.warn(`❌ Rejected: ${prompt} is not related to ${subjectName}`);
    return `❌ Only ${subjectName}-related questions are allowed.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    return result.response.text();
  } catch (error) {
    console.error("❌ Error generating response:", error);
    return "Error fetching response.";
  }
}

export default function Gemini({ subjectName }) {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    setChatHistory([]);
  }, [subjectName]);

  const handleGenerate = async () => {
    if (!input.trim()) return;

    console.log(`📩 User Input: ${input}`);
    const lowerInput = input.toLowerCase();
    const isTopicAllowed = allowedTopics[subjectName]?.some((topic) =>
      lowerInput.includes(topic.toLowerCase())
    );

    if (!isTopicAllowed) {
      setPopupMessage(`❌ Only ${subjectName} questions are allowed.`);
      setShowPopup(true);
      return;
    }

    const userMessage = { sender: "You", text: input };
    setChatHistory((prev) => [
      ...prev,
      userMessage,
      { sender: "Gemini", text: `Loading` },
    ]);
    setInput("");

    const response = await generateResponse(input, subjectName);
    setChatHistory((prev) =>
      prev.map((msg, index) =>
        index === prev.length - 1 ? { sender: "Gemini", text: response } : msg
      )
    );
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2 style={{ color: "#007bff" }}>Gemini AI {subjectName}</h2>
      <div
        style={{
          width: "100%",
          color:"black",
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "10px",
          textAlign: "left",
        }}
      >
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <strong>{msg.sender}:</strong>
            {msg.text.includes("```") ? (
              <SyntaxHighlighter language="cpp" style={dracula}>
                {msg.text.replace(/```/g, "")}
              </SyntaxHighlighter>
            ) : (
              <p>{msg.text}</p>
            )}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your question..."
        style={{
          width: "90%",
          padding: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          marginBottom: "10px",
        }}
      />
      <button
        onClick={handleGenerate}
        style={{
          background: "#007bff",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Send
      </button>
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.3)",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <p style={{ fontSize: "16px", fontWeight: "bold", color: "#d9534f" }}>
            {popupMessage}
          </p>
          <button
            onClick={() => setShowPopup(false)}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              background: "#d9534f",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
