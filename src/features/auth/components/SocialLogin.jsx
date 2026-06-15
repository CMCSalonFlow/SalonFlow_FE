const API_URL =
    "http://localhost:9090";

export default function SocialLogin() {

    return (

        <div className="social-login">

            <button
                type="button"
                className="google-btn"
                onClick={() =>
                    window.location.href =
                        `${API_URL}/api/v1/auth/oauth2/google`
                }
            >
                Đăng nhập bằng Google
            </button>

            <button
                type="button"
                className="facebook-btn"
                onClick={() =>
                    window.location.href =
                        `${API_URL}/api/v1/auth/oauth2/facebook`
                }
            >
                Đăng nhập bằng Facebook
            </button>

        </div>
    );
}