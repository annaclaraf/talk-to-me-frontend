'use client'
import React, { useState } from 'react';
import { JoinRoom } from './Join';
import { CreateRoom } from './Create';

export function FormWrapper() {
  const [selectedRoom, setSelectedRoom] = useState<'join' | 'create'>('join');

  const handleSelectRoom = (room: 'create' | 'join') => {
    setSelectedRoom(room);
  };

  return (
    <div className='max-w-[580px] w-[90%]'>
      <div className="flex items-center text-center">
        <span className={`w-1/2 p-4 cursor-pointer
          ${selectedRoom === 'join' && 'rounded-t-lg bg-secondary text-primary'}
          `} 
          onClick={() => handleSelectRoom('join')}
        >
          Ingressar
        </span>
        <span className={`w-1/2 p-4 cursor-pointer
          ${selectedRoom === 'create' && 'rounded-t-lg bg-secondary text-primary'}
          `} 
          onClick={() => handleSelectRoom('create')}
        >
          Nova Reunião
        </span>
      </div>
      <div className="space-y-8 bg-secondary py-10 rounded-b-lg px-10">
        <RoomSelector selectedRoom={selectedRoom} />
      </div>
    </div>
  );
};

const RoomSelector = ({ selectedRoom }: { selectedRoom: string }) => {
  switch (selectedRoom) {
    case 'create':
      return <CreateRoom />;
    case 'join':
      return <JoinRoom />;
    default:
      return <JoinRoom />;
  }
};

