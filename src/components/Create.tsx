'use client'
import { useRef, FormEvent } from 'react';
import { Button } from './Button';
import { Input } from './Input';

export function CreateRoom() {
  const name = useRef<HTMLInputElement>(null);

  function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.current && name.current.value !== '') {
      sessionStorage.setItem("username", name.current.value);
      window.location.href = `/room/${generateRandomRoomId()}`;
    }
  }

  function generateRandomRoomId() {
    return Math.random().toString(36).substring(2, 7);
  }

  return (
    <form onSubmit={(e) => handleCreateRoom(e)} className="space-y-8">
      <Input placeholder="Seu nome" type="text" ref={name} />
      <Button title="Entrar" type="submit"  />
    </form>
  );
}