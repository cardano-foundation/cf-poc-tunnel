import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-gray-900 text-white body-font shadow w-full">
            <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
                <a className="flex title-font font-medium items-center text-white mb-4 md:mb-0">
                    <span className="ml-3 text-xl">Demo IIW</span>
                </a>
                <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
                    <a href="#" className="mr-5 hover:text-gray-400">Main</a>
                    <a href="#" className="mr-5 hover:text-gray-400">About</a>
                    <a href="#" className="mr-5 hover:text-gray-400">Contact</a>
                </nav>
            </div>
        </header>
    );
};

export {Header};
