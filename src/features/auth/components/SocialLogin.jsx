import { FcGoogle } from "react-icons/fc";
import { API_BASE_URL } from "@/core/api/endpoints";

const API_URL = API_BASE_URL;
export default function SocialLogin() {

    return (

        <div className="social-login">

            <button
                type="button"
                className="social-btn google-btn"
                onClick={() =>
                    window.location.href =
                        `${API_URL}/api/v1/auth/oauth2/google`
                }
            >
                <FcGoogle className="social-icon" />

                <span>Tiếp tục với Google</span>
            </button>

        </div>
    );
}