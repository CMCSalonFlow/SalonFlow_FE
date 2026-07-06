import {
    Card,
    Rate,
    Tag,
    Space,
    Typography,
    Button
} from "antd";

const { Title, Text } =
    Typography;

export default function SearchResultCard({
    item
}) {

    return (

        <Card
            style={{
                marginBottom: 16
            }}
        >

            <Title level={4}>
                {item.salonName}
            </Title>

            <Text strong>
                {item.branchName}
            </Text>

            <br />

            <Text type="secondary">
                {item.address}
            </Text>

            <br />
            <br />

            <Space>

                <Tag color="blue">
                    {item.minPrice?.toLocaleString()}
                    đ
                </Tag>

                <Tag color="green">
                    {item.maxPrice?.toLocaleString()}
                    đ
                </Tag>

            </Space>

            <br />
            <br />

            <Rate
                disabled
                value={item.rating}
            />

            {
                item.distance &&
                (
                    <>
                        <br />
                        <Text>
                            📍
                            {
                                item.distance
                                    .toFixed(1)
                            }
                            km
                        </Text>
                    </>
                )
            }

            <div
                style={{
                    marginTop: 16
                }}
            >

                <Button
                    type="primary"
                >
                    Đặt lịch
                </Button>

            </div>

        </Card>

    );

}