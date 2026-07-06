import {
    Layout
} from "antd";

const { Footer } =
    Layout;

export default function CustomerFooter() {

    return (
        <Footer
            style={{
                textAlign: "center"
            }}
        >
            SalonFlow © 2026
            <br />
            Hệ thống quản lý salon
            làm đẹp
        </Footer>
    );
}