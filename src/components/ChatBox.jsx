import { useState } from "react";
import axios from "axios";

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);

    const res = await axios.post("http://localhost:4000/api/chat", { message: input });
    const aiMessage = { role: "assistant", content: res.data.reply };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInput("");
  };

  return (
    <div className="border p-2 rounded h-60 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className="inline-block px-2 py-1 m-1 bg-gray-200 rounded">{m.content}</span>
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          className="flex-1 border px-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4">전송</button>
      </div>
    </div>
  );
}