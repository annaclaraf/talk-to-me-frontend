"use client";
import { FormEvent, useEffect, useRef, useState, useContext } from "react";
import Image from "next/image";

import { SocketContext } from "@/contexts/SocketContext";

interface IChatMessage {
  message: string;
  username: string;
  roomId: string;
  time: string;
}

export function Chat({ roomId }: { roomId: string }) {
  const { socket } = useContext(SocketContext);
  const [chat, setChat] = useState<IChatMessage[]>([]);
  const currentMsg = useRef<HTMLInputElement>(null);

  const username = sessionStorage.getItem("username");

  useEffect(() => {
    socket?.on('chat', (data) => {
      setChat((prevState) => [...prevState, data]);
    });
  }, [socket]);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    if (currentMsg.current && currentMsg.current?.value !== '') {
      const sendMsgToServer = {
        message: currentMsg.current.value,
        username: username as string,
        roomId,
        time: new Date().toLocaleTimeString(),
      };

      socket?.emit('chat', sendMsgToServer);
      setChat((prevState) => [...prevState, sendMsgToServer]);

      currentMsg.current.value = '';
    }
  }

  return (
    <div className="bg-gray-900 p-4 max-w-[370px] w-[30%] hidden md:flex rounded-md h-full">
      <div className="relative h-full w-full">
        {chat.map((chat, index) => {
          return (
            <div className="bg-gray-950 rounded p-2" key={index}>
              <div className="flex items-center text-pink-400 space-x-2">
                <span>{chat.username}</span>
                <span>{chat.time}</span>
              </div>
              <div className="mt-5 text-sm">
                <p>{chat.message}</p>
              </div>
            </div>
          );
        })}

        <form onSubmit={(e) => sendMessage(e)} className="absolute bottom-0 w-full">
          <div className="flex relative ">
            <input
              type="text"
              name=""
              id=""
              ref={currentMsg}
              className="px-3 py-2 bg-gray-950 rounded-md w-full"
            />
            <button type="submit" className="absolute -translate-x-[50%] -translate-y-[50%] right-0 top-[50%] cursor-pointer">
              <Image
                src="/send.png"
                width={20}
                height={200}
                alt="Send"
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}