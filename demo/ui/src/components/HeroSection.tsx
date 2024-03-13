import React from 'react';
const HeroSection: React.FC = () => {
    return (
        <>
            <div className="relative h-screen flex items-center justify-center text-center bg-hero bg-cover bg-no-repeat" >
                <div className="hero-content z-10 p-24 bg-black bg-opacity-70 rounded-lg">
                    <p className="text-sm md:text-base text-white font-bold mb-2">WELCOME <span className="text-gray-200">/ Demo Day</span></p>
                    <h1 className="font-bold break-normal text-white text-3xl md:text-5xl mb-4">Explore Digital Identity with Us</h1>
                    <p className="text-base md:text-xl text-gray-300 font-bold mb-8">Discover innovative solutions by Cardano Foundation</p>
                    <a href="#" className="bg-white text-gray-800 py-2 px-4 rounded-lg font-bold hover:bg-gray-100 transition duration-300 ease-in-out">Start Demo</a>
                </div>
            </div>
        </>
    );
};
export { HeroSection };
