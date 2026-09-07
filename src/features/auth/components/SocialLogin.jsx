import { FcGoogle } from "react-icons/fc";
import { API_BASE_URL } from "@/core/api/endpoints";

export default function SocialLogin() {
    const handleGoogleLogin = () => {
        let authEndpoint = "/oauth2/authorization/google";
        if (API_BASE_URL && API_BASE_URL.startsWith("http")) {
            const backendOrigin = new URL(API_BASE_URL).origin;
            authEndpoint = `${backendOrigin}/oauth2/authorization/google`;
        }
        window.location.href = authEndpoint;
    };

    return (
        <div className="social-login">
            <button
                type="button"
                className="social-btn google-btn"
                onClick={handleGoogleLogin}
            >
                <FcGoogle className="social-icon" />
                <span>Tiếp tục với Google</span>
            </button>
        </div>
    );
}