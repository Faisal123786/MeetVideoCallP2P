import React from 'react'

function Navbar() {
    return (
        <div className='navbar'>
            <div className='navbar-container'>
                {/* Logo and Brand */}
                <div className='navbar-brand'>
                    <div className='logo'>
                        <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                            <path d='M23 7l-7 5 7 5V7z'></path>
                            <rect x='1' y='5' width='15' height='14' rx='2' ry='2'></rect>
                        </svg>
                    </div>
                    <span className='brand-name'>Meet</span>
                </div>



                <div className='navbar-right'>
                    <button className='theme-toggle'>🌙</button>
                    <div className='user-avatar'>U</div>
                </div>
            </div>
        </div>
    )
}

export default Navbar