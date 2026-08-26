import {
    Card,
    Input,
    Button,
    Space
} from "antd";

import {
    SearchOutlined
} from "@ant-design/icons";

import { useState } from "react";

export default function SearchBar({ onSearch }) {

    const [keyword, setKeyword] =
        useState("");

    const handleSearch = () => {

        onSearch({
            q: keyword
        });

    };

    return (

        <Card
            style={{
                marginBottom: 24
            }}
        >

            <Space.Compact
                style={{
                    width: "100%"
                }}
            >

                <Input
                    size="large"
                    placeholder="Tìm salon, dịch vụ..."
                    value={keyword}
                    onChange={(e) =>
                        setKeyword(
                            e.target.value
                        )
                    }
                    onPressEnter={
                        handleSearch
                    }
                />

                <Button
                    size="large"
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                >
                    Tìm kiếm
                </Button>

            </Space.Compact>

        </Card>

    );

}