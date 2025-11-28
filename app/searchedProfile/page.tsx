import Profile from "./Profile";
import Data from "./Data";
import { Suspense } from "react";

export default function Page() {
    return (
        <>
            <div className="w-full flex flex-col items-center gap-8 py-6">
                <Suspense fallback={<div className="text-gray-400 p-4">Loading...</div>}>
                    <Profile />
                </Suspense >

                
                <Suspense fallback={<div className="text-gray-400 p-4">Loading...</div>}>
                    <Data />
                </Suspense >
            </div>
        </>
    )
}
