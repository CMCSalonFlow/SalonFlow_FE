import {
    Card,
    Form,
    InputNumber,
    Rate,
    Button,
    Divider
} from "antd";

export default function SearchFilter({
    onSearch
}) {

    const [form] = Form.useForm();

    const submit = () => {

        const values =
            form.getFieldsValue();

        onSearch(values);

    };

    return (

        <Card title="Bộ lọc">

            <Form
                form={form}
                layout="vertical"
            >

                <Form.Item
                    label="Giá từ"
                    name="priceMin"
                >
                    <InputNumber
                        style={{
                            width: "100%"
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label="Giá đến"
                    name="priceMax"
                >
                    <InputNumber
                        style={{
                            width: "100%"
                        }}
                    />
                </Form.Item>

                <Divider />

                <Form.Item
                    label="Đánh giá tối thiểu"
                    name="ratingMin"
                >
                    <Rate />
                </Form.Item>

                <Button
                    type="primary"
                    block
                    onClick={submit}
                >
                    Áp dụng
                </Button>

            </Form>

        </Card>

    );

}