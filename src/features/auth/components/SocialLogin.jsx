import { FcGoogle } from "react-icons/fc";

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
                        "/oauth2/authorization/google"
                }
            >
                <FcGoogle className="social-icon" />

                <span>Tiếp tục với Google</span>
            </button>

        </div>
    );
}