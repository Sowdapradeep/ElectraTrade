
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Icons } from '../constants';

const socket = io.connect("http://localhost:5000");

const ChatWidget = ({ roomId, username, role }) => {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            socket.emit("join_room", roomId);
        }
    }, [roomId, isOpen]);

    useEffect(() => {
        const handler = (data) => {
            setMessageList((list) => [...list, data]);
        };
        socket.on("receive_message", handler);
        return () => socket.off("receive_message", handler);
    }, []);

    const sendMessage = async () => {
        if (currentMessage !== "") {
            const messageData = {
                room: roomId,
                author: username,
                role: role,
                message: currentMessage,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };

            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, messageData]);
            setCurrentMessage("");
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 animate-bounce"
            >
                <Icons.History className="w-6 h-6" /> {/* Using History icon as proxy for Chat, or we can add MessageSquare later */}
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col h-96 animate-in slide-in-from-bottom-10">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                <div>
                    <h3 className="text-sm font-bold">Live Support</h3>
                    <p className="text-[10px] opacity-70">Order #{roomId.substr(-6)}</p>
                </div>
                <button onClick={() => setIsOpen(false)}><Icons.XCircle className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                {messageList.map((msg, index) => {
                    const isMe = msg.author === username;
                    return (
                        <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-xs font-medium ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                                {msg.message}
                            </div>
                            <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold">{msg.author} • {msg.time}</span>
                        </div>
                    );
                })}
                {messageList.length === 0 && (
                    <div className="text-center text-[10px] text-slate-400 uppercase font-black pt-10">Start the conversation...</div>
                )}
            </div>

            <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                    type="text"
                    value={currentMessage}
                    placeholder="Type message..."
                    className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                    onChange={(event) => setCurrentMessage(event.target.value)}
                    onKeyPress={(event) => event.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                    <Icons.ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ChatWidget;
