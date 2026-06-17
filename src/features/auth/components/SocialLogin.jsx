import { FcGoogle } from "react-icons/fc";
import { FaFacebookF } from "react-icons/fa";

const API_URL =
    "http://localhost:9090";

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

            <button
                type="button"
                className="social-btn facebook-btn"
                onClick={() =>
                    window.location.href =
                        `${API_URL}/api/v1/auth/oauth2/facebook`
                }
            >
                <FaFacebookF className="social-icon" />

                <span>Tiếp tục với Facebook</span>
            </button>

        </div>
    );
}