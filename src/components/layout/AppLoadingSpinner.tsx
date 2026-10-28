export default function AppLoadingSpinner() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-space">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plasma motion-reduce:animate-none"></div>
        </div>
    );
}