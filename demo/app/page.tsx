"use client";

import { useState, useRef } from "react";
const URL = "/api/ai";

export default function Page() {
  const [state, setState] = useState({
    messages: [{ role: "AI", content: "How can I help you?" }],
    prompt: "",
  });
  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;

  const postToAi = async (userPrompt) => {
    const resp = await fetch(URL, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ userPrompt }),
    });
    const data = await resp.json();

    messagesRef.current = [
      ...messagesRef.current,
      { role: "AI", content: JSON.stringify(data) },
    ];
    setState({
      messages: messagesRef.current,
      prompt: state.prompt,
    });
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (!state.prompt?.length) {
      return;
    }

    postToAi(state.prompt);

    messagesRef.current = [
      ...messagesRef.current,
      { role: "User", content: state.prompt },
    ];
    setState({
      messages: messagesRef.current,
      prompt: "",
    });
  };

  return (
    <div className="row py-lg-5">
      <div
        id="chat-log-container"
        className="mt-5 mb-5"
        style={{ height: 600, overflowY: "scroll" }}
      >
        <table id="chat-log" className="table table-borderless table-striped">
          <tbody id="chat-log-body">
            {state.messages.map((message, index) => {
              return (
                <tr key={index}>
                  <th>{message.role}</th>
                  <td>{message.content}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form id="chat-form" action="/api/ai" method="post">
        <div className="row">
          <div className="col-8">
            <textarea
              value={state.prompt}
              className="form-control"
              id="chat-message"
              placeholder="Input message..."
              onChange={(e) =>
                setState({ messages: state.messages, prompt: e.target.value })
              }
            ></textarea>
          </div>
          <div className="col-2">
            <button
              type="submit"
              onClick={sendMessage}
              className="btn btn-primary mb-3"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
