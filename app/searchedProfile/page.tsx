import Profile from "./Profile";
import Data from "./Data";

export default function Page() {
    return (
        <>
            <div className="w-full flex flex-col items-center gap-8 py-6">
                <Profile />
                <Data />
            </div>
        </>
    )
}
