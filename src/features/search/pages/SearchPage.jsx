import { Row, Col } from "antd";

import SearchBar from "../components/SearchBar";
import SearchFilter from "../components/SearchFilter";
import SearchResultList from "../components/SearchResultList";

import useBranchSearch from "../hooks/useBranchSearch";

export default function SearchPage() {

    const {
        branches,
        loading,
        search,
        loadMore,
        hasNext
    } = useBranchSearch();

    return (

        <div>

            <SearchBar
                onSearch={search}
            />

            <Row gutter={24}>

                <Col span={6}>
                    <SearchFilter
                        onSearch={search}
                    />
                </Col>

                <Col span={18}>
                    <SearchResultList
                        items={branches}
                        loading={loading}
                        hasNext={hasNext}
                        onLoadMore={loadMore}
                    />
                </Col>

            </Row>

        </div>

    );

}