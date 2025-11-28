"use client";

import Home from "./home";
import Chat from "./chat";

export default function Messages() {
    return (
        <div className="w-full h-screen flex bg-black text-white overflow-hidden">

            <div className="w-[35%] h-full border-r border-[#2f2f2f] overflow-y-auto">
                <Home />
            </div>

            <div className="w-[65%] h-full overflow-y-auto">
                <Chat />
            </div>

        </div>
    );
}
