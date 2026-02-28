import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../providers/Socket';
import { useNavigate } from 'react-router-dom';
import { useToaster } from '../providers/Toaster';

function Home() {
    const [email, setEmail] = useState('');
    const [roomId, setRoomId] = useState('');
    const { socket } = useSocket();
    const navigate = useNavigate();
    const { showToast } = useToaster();

    const handleJoinRoom = useCallback(() => {
        if (email.trim() && roomId.trim()) {
            socket.emit('join_room', { email, roomId });
        }
    }, [email, roomId, socket]);

    const handleWaitForAdmit = useCallback((data) => {
        showToast(`You are waiting for admission to room ${data.roomId}`, "info");
        navigate(`/wait/${data.roomId}`);
    }, [showToast, navigate]);

    const handleAdmitToRoom = useCallback((data) => {
        showToast(`You have been admitted to room ${data.roomId}`, "success");
        navigate(`/room/${data.roomId}`);
    }, [navigate, showToast]);

    const handleRoomJoined = useCallback(({ roomId, isOwner }) => {
        if (isOwner) {
            showToast(`You created and joined room ${roomId} as the owner`, "success");
        } else {
            showToast(`You joined room ${roomId}`, "success");
        }
        navigate(`/room/${roomId}`);
    }, [navigate, showToast]);


    useEffect(() => {
        socket.on('wait_for_admit', handleWaitForAdmit);
        socket.on("room_joined", handleRoomJoined);

        return () => {
            socket.off('wait_for_admit', handleWaitForAdmit);
            socket.off("room_joined", handleRoomJoined);

        };
    }, [socket, handleWaitForAdmit, handleRoomJoined, showToast]);

    return (
        <div className='home'>
            <div className='home-container'>
                <div className='hero-section'>
                    <h1>Join Your Meeting</h1>
                    <p>Enter your email and room ID to get started</p>
                </div>

                <div className='join-section'>
                    <div className='join-card'>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleJoinRoom();
                        }}>
                            <div className='form-group'>
                                <label htmlFor='email' className='form-label'>Email Address</label>
                                <input
                                    id='email'
                                    type='email'
                                    placeholder='Enter your email'
                                    className='formField'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className='form-group'>
                                <label htmlFor='roomId' className='form-label'>Room ID</label>
                                <input
                                    id='roomId'
                                    type='text'
                                    placeholder='Enter room ID'
                                    className='formField'
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    required
                                />
                            </div>

                            <button type='submit' className='join-btn'>Join Room</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home