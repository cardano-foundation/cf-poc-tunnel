import React from 'react';
import IIWCover from "../assets/IIW-photo.png";
const HeroSection: React.FC = () => {
    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 opacity-75"></div>
            <img src={IIWCover} alt="Main" className="w-full h-full object-cover opacity-50" />
            <div className="relative text-center py-16 md:py-32">
                <p className="text-sm md:text-base text-white font-bold">WELCOME <span className="text-gray-200">/ MY PROJECT</span></p>
                <h1 className="font-bold break-normal text-white text-3xl md:text-5xl">Explore Digital Identity with Us</h1>
                <p className="text-base md:text-xl text-gray-300 font-bold py-8">Discover innovative solutions on our platform.</p>
                <a href="#" className="bg-white text-gray-800 py-2 px-4 rounded-lg font-bold hover:bg-gray-100 transition duration-300 ease-in-out inline-block">Register Now</a>
            </div>
        </div>
    );
};
export { HeroSection };
